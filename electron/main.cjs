'use strict';

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  Menu,
  nativeImage,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const http = require('node:http');
const os = require('node:os');
const { fork, spawn } = require('node:child_process');
const { registerIpcHandlers } = require('./ipc/index.cjs');

const PORT = Number(process.env.PORT) || 5123;
let win = null;
let nextChild = null;

/* ============== Paths & basics ============== */
const isDev = () => !app.isPackaged;
const EXE_DIR = () => {
  try {
    return path.dirname(app.getPath('exe'));
  } catch {
    return process.cwd();
  }
};
const APP_ROOT = () => path.join(process.resourcesPath, 'app'); // resources/app
const PROD_DB = () => path.join(EXE_DIR(), 'data', 'mil.db'); // δίπλα στο exe

/* ============== Logging (με emergency fallback) ============== */
function userDataSafe() {
  try {
    return app.getPath('userData');
  } catch {
    return null;
  }
}
function getLogPath() {
  const ud = userDataSafe();
  return path.join(ud || process.cwd(), 'mil-tracker.log');
}
// extra flags εκτός από env
function debugFlagFilesOn() {
  try {
    const exeFlag = path.join(EXE_DIR(), 'debug-log.flag');
    const userFlag = userDataSafe()
      ? path.join(userDataSafe(), 'debug-log.flag')
      : null;
    return fs.existsSync(exeFlag) || (userFlag && fs.existsSync(userFlag));
  } catch {
    return false;
  }
}
const DEBUG = process.env.MIL_DEBUG === '1' || isDev() || debugFlagFilesOn();

function emergencyLog(...args) {
  try {
    const line = `[${new Date().toISOString()}] ${args
      .map((x) => {
        if (typeof x === 'string') return x;
        try {
          return JSON.stringify(x);
        } catch {
          return String(x);
        }
      })
      .join(' ')}\n`;
    fs.appendFileSync(
      path.join(os.tmpdir(), 'mil-emergency.log'),
      line,
      'utf8'
    );
  } catch {}
}
function log(...args) {
  if (!DEBUG) return;
  const line = `[${new Date().toISOString()}] ${args
    .map((x) => {
      if (typeof x === 'string') return x;
      try {
        return JSON.stringify(x);
      } catch {
        return String(x);
      }
    })
    .join(' ')}\n`;
  try {
    fs.appendFileSync(getLogPath(), line, 'utf8');
  } catch {}
  try {
    console.log(line.trim());
  } catch {}
}
// BOOT TRACE (πάντα γράφει emergency + κανονικό αν γίνεται)
(function bootTraceOnce() {
  const info = {
    MIL_DEBUG: process.env.MIL_DEBUG || '',
    DEBUG_resolved: DEBUG,
    isDev: isDev(),
    exeDir: EXE_DIR(),
    userData: userDataSafe(),
    appRoot: APP_ROOT(),
    logPath: getLogPath(),
    timestamp: new Date().toISOString(),
  };
  emergencyLog('BOOT TRACE', info);
  try {
    fs.appendFileSync(
      getLogPath(),
      `[${info.timestamp}] BOOT TRACE ${JSON.stringify(info)}\n`,
      'utf8'
    );
  } catch {}
})();

/* ============== Single instance ============== */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

/* ============== File helpers ============== */
function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {}
}
function ensureProdDbPresent() {
  const dest = PROD_DB();
  ensureDir(path.dirname(dest));
  const seed = path.join(APP_ROOT(), 'data', 'mil.db');
  if (!fs.existsSync(dest)) {
    if (fs.existsSync(seed)) {
      fs.copyFileSync(seed, dest);
      log('Seeded PROD DB from', seed, '->', dest);
    } else {
      fs.writeFileSync(dest, '');
      log('Created empty PROD DB at', dest);
    }
  } else {
    log('PROD DB exists at', dest);
  }
}
function waitForPort(port, host = '127.0.0.1', timeoutMs = 40000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tryOnce() {
      const socket = net.createConnection(port, host);
      socket.once('connect', () => {
        socket.end();
        log(`port ${port} reachable`);
        resolve(true);
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          const msg = `Timeout waiting for http://${host}:${port}`;
          log(msg);
          reject(new Error(msg));
        } else setTimeout(tryOnce, 300);
      });
    })();
  });
}

/* ============== Start path (toggle /api/health) ============== */
function getStartPath() {
  try {
    const flag = path.join(userDataSafe() || EXE_DIR(), 'debug-health.flag');
    if (fs.existsSync(flag)) return '/api/health';
  } catch {}
  return process.env.MIL_START_PATH || '/';
}

/* ============== Static diagnostics helpers ============== */
function copyDirSync(src, dest) {
  try {
    fs.mkdirSync(dest, { recursive: true });
    if (fs.cpSync) {
      fs.cpSync(src, dest, { recursive: true });
      return;
    }
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, entry.name);
      const d = path.join(dest, entry.name);
      if (entry.isDirectory()) copyDirSync(s, d);
      else fs.copyFileSync(s, d);
    }
  } catch (e) {
    log('copyDirSync error', { src, dest, err: e?.message || e });
  }
}
function listStaticCss(label, baseDir) {
  const cssDir = path.join(baseDir, '.next', 'static', 'css');
  try {
    const files = fs.existsSync(cssDir)
      ? fs
          .readdirSync(cssDir)
          .filter((f) => f.endsWith('.css'))
          .map((f) => {
            const p = path.join(cssDir, f);
            const s = fs.statSync(p);
            return `${f} (${s.size} bytes)`;
          })
      : [];
    log(`${label} static CSS:`, files);
  } catch (e) {
    log(`${label} static css error:`, e?.message || e);
  }
}
function readBuildIdFrom(d) {
  try {
    const p = path.join(d, '.next', 'BUILD_ID');
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : null;
  } catch {
    return null;
  }
}
async function fetchBuildIdFromServer() {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port: PORT, path: '/_next/BUILD_ID', timeout: 3000 },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () =>
          resolve({ status: res.statusCode, body: buf.trim() })
        );
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}
// επιστρέφει πιθανά physical paths (appRoot και standalone)
function mapUrlToStaticCandidates(u) {
  try {
    const { pathname } = new URL(u);
    const prefix = '/_next/static/';
    if (!pathname.startsWith(prefix)) return [];
    const rel = pathname.slice(prefix.length); // μετά το static/
    const appPath = path.join(
      APP_ROOT(),
      '.next',
      'static',
      rel.replace(/\//g, path.sep)
    );
    const standPath = path.join(
      APP_ROOT(),
      '.next',
      'standalone',
      '.next',
      'static',
      rel.replace(/\//g, path.sep)
    );
    return [appPath, standPath];
  } catch {
    return [];
  }
}

/* ============== Next server (prod) ============== */
async function bootNextInProd() {
  const appRoot = APP_ROOT();
  const serverJs = path.join(appRoot, '.next', 'standalone', 'server.js');
  const standalone = path.join(appRoot, '.next', 'standalone');

  if (!fs.existsSync(serverJs))
    throw new Error('Next standalone server.js not found');

  const srcStatic = path.join(appRoot, '.next', 'static');
  const srcBuildId = path.join(appRoot, '.next', 'BUILD_ID');
  const srcPublic = path.join(appRoot, 'public');

  const dstNextRoot = path.join(standalone, '.next');
  const dstStatic = path.join(dstNextRoot, 'static');
  const dstBuildId = path.join(dstNextRoot, 'BUILD_ID');
  const dstPublic = path.join(standalone, 'public');

  log('APP_ROOT=', appRoot);
  log('Exist standalone=', fs.existsSync(standalone));
  log('Exist src .next/static=', fs.existsSync(srcStatic));
  log('Exist src BUILD_ID=', fs.existsSync(srcBuildId));

  // inventory πριν
  listStaticCss('APP_ROOT', appRoot);

  // 🔁 Συγχρονισμός assets στο standalone (όπως σε επίσημο Dockerfile Next)
  try {
    if (fs.existsSync(srcStatic)) {
      log('Sync .next/static ->', dstStatic);
      copyDirSync(srcStatic, dstStatic);
    } else {
      log('WARN: src .next/static missing at', srcStatic);
    }
    if (fs.existsSync(srcBuildId)) {
      fs.mkdirSync(dstNextRoot, { recursive: true });
      fs.copyFileSync(srcBuildId, dstBuildId);
      log('Copied BUILD_ID ->', dstBuildId);
    } else {
      log('WARN: src BUILD_ID missing at', srcBuildId);
    }
    if (fs.existsSync(srcPublic)) {
      log('Sync public ->', dstPublic);
      copyDirSync(srcPublic, dstPublic);
    } else {
      log('WARN: public dir missing at', srcPublic);
    }
  } catch (e) {
    log('Asset sync error:', e?.message || e);
  }

  // inventory μετά
  listStaticCss('STANDALONE', standalone);

  const diskBuildApp = readBuildIdFrom(appRoot);
  const diskBuildStdl = readBuildIdFrom(standalone);
  log('BUILD_ID (disk appRoot)=', diskBuildApp);
  log('BUILD_ID (disk standalone)=', diskBuildStdl);

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    DATABASE_URL: `file:${PROD_DB()}`,
  };

  nextChild = fork(serverJs, [], {
    env,
    cwd: path.dirname(serverJs), // ✅ standalone working dir
    stdio: 'pipe',
    detached: false,
  });
  nextChild.on('error', (e) => log('Next child error:', e?.message || e));
  nextChild.on('exit', (code, sig) => log('Next child exit:', code, sig));
  if (nextChild.stdout)
    nextChild.stdout.on('data', (b) => log('[next]', String(b)));
  if (nextChild.stderr)
    nextChild.stderr.on('data', (b) => log('[next-err]', String(b)));

  await waitForPort(PORT);

  const srvBuild = await fetchBuildIdFromServer();
  if (srvBuild) log('BUILD_ID (server)=', srvBuild.status, srvBuild.body);
  if (srvBuild?.body && diskBuildStdl && srvBuild.body !== diskBuildStdl) {
    log('⚠️ BUILD_ID mismatch between server and standalone disk!');
  }
}
function killNextChildSync() {
  if (!nextChild || nextChild.killed) return;
  try {
    log('Killing Next child pid=', nextChild.pid);
    nextChild.kill();
  } catch (e) {
    log('nextChild.kill error:', e?.message || e);
  }
  if (process.platform === 'win32' && nextChild && !nextChild.killed) {
    try {
      spawn('taskkill', ['/PID', String(nextChild.pid), '/T', '/F'], {
        stdio: 'ignore',
      }).on('exit', () => log('taskkill issued for pid', nextChild.pid));
    } catch (e) {
      log('taskkill spawn error:', e?.message || e);
    }
  }
}

/* ============== DevTools toggle/flags ============== */
function shouldOpenDevTools() {
  try {
    if (process.env.MIL_DEBUG === '1') return true;
    const exeFlag = path.join(EXE_DIR(), 'debug-devtools.flag');
    const userFlag = userDataSafe()
      ? path.join(userDataSafe(), 'debug-devtools.flag')
      : null;
    return fs.existsSync(exeFlag) || (userFlag && fs.existsSync(userFlag));
  } catch {
    return false;
  }
}

/* ============== Window icon resolver (public/images) ============== */
function resolveWindowIcon() {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const devIco = path.join(process.cwd(), 'public', 'images', 'icon.ico');
  const devPng = path.join(process.cwd(), 'public', 'images', 'icon.png');
  const pkgIco = path.join(APP_ROOT(), 'public', 'images', 'icon.ico');
  const pkgPng = path.join(APP_ROOT(), 'public', 'images', 'icon.png');

  const candidates = isWin
    ? [pkgIco, devIco, pkgPng, devPng]
    : isMac
    ? [pkgPng, devPng]
    : [pkgPng, devPng];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      log('Using window icon:', p);
      return p;
    }
  }
  log('Window icon not found in public/images');
  return undefined;
}

/* ============== BrowserWindow ============== */
async function createWindow() {
  const startPath = getStartPath();
  win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    center: true,
    icon: resolveWindowIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      devTools: true,
    },
    autoHideMenuBar: true,
  });

  let forceShowTimer = setTimeout(() => {
    if (win && !win.isVisible()) {
      log('force show after timeout');
      win.show();
      win.focus();
    }
  }, 30000);

  win.once('ready-to-show', () => {
    log('ready-to-show');
    win.show();
    clearTimeout(forceShowTimer);
  });
  win.on('unresponsive', () => log('window unresponsive'));
  win.on('closed', () => {
    log('window closed');
    clearTimeout(forceShowTimer);
  });

  win.webContents.on('did-finish-load', () => {
    log('did-finish-load');
    if (win?.isVisible()) clearTimeout(forceShowTimer);
    if (isDev() || shouldOpenDevTools()) {
      try {
        win.webContents.openDevTools({ mode: 'detach' });
        log('DevTools opened');
      } catch (e) {
        log('DevTools open error', e?.message || e);
      }
    }
  });

  // toggle DevTools
  win.webContents.on('before-input-event', (event, input) => {
    const isToggle =
      input.key === 'F12' ||
      (input.key === 'I' && input.control && input.shift);
    if (isToggle) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
        log('DevTools closed (toggle)');
      } else {
        win.webContents.openDevTools({ mode: 'detach' });
        log('DevTools opened (toggle)');
      }
      event.preventDefault();
    }
  });

  // Inspect element on right-click
  win.webContents.on('context-menu', (_e, params) => {
    try {
      win.webContents.inspectElement(params.x, params.y);
    } catch {}
  });

  // 🧹 καθάρισε cache/storages πριν το πρώτο load
  try {
    await win.webContents.session.clearCache();
    await win.webContents.session.clearStorageData({
      storages: ['appcache', 'serviceworkers', 'cachestorage'],
    });
    log('Cleared HTTP & storage caches before first load');
  } catch (e) {
    log('Cache clear error:', e?.message || e);
  }

  // 🔎 static diagnostics: map & ύπαρξη σε appRoot και standalone
  win.webContents.session.webRequest.onCompleted((d) => {
    if (d.url.includes('/_next/static/')) {
      const candidates = mapUrlToStaticCandidates(d.url);
      const existsInfo = candidates.map((p) => {
        const ex = fs.existsSync(p);
        let sz = -1;
        if (ex) {
          try {
            sz = fs.statSync(p).size;
          } catch {}
        }
        return { path: p, exists: ex, size: sz };
      });
      log('STATIC COMPLETED', {
        url: d.url,
        status: d.statusCode,
        method: d.method,
        candidates: existsInfo,
      });
    }
  });
  win.webContents.session.webRequest.onErrorOccurred((d) => {
    if (d.url.includes('/_next/static/')) {
      const candidates = mapUrlToStaticCandidates(d.url);
      const existsInfo = candidates.map((p) => {
        const ex = fs.existsSync(p);
        let sz = -1;
        if (ex) {
          try {
            sz = fs.statSync(p).size;
          } catch {}
        }
        return { path: p, exists: ex, size: sz };
      });
      log('STATIC ERROR', {
        url: d.url,
        error: d.error,
        candidates: existsInfo,
      });
    }
  });

  win.webContents.on('did-fail-load', (_e, code, desc, url) =>
    log('did-fail-load', { code, desc, url })
  );
  win.webContents.on('render-process-gone', (_e, details) =>
    log('render-process-gone', details)
  );

  const url = `http://localhost:${PORT}${startPath}`;
  if (isDev()) {
    log('DEV load URL:', url);
    await win.loadURL(url);
  } else {
    ensureProdDbPresent();
    await bootNextInProd();
    log('PROD load URL:', url);
    await win.loadURL(url);
  }

  if (DEBUG) {
    try {
      shell.showItemInFolder(getLogPath());
    } catch {}
  }
}

/* ============== App lifecycle ============== */
app.whenReady().then(async () => {
  log('App ready. isDev=', isDev());
  try {
    app.setAppUserModelId('com.doa.miltracker');
    Menu.setApplicationMenu(null);

    registerIpcHandlers({ ipcMain, dialog, shell, getWin: () => win, log });

    await createWindow();
  } catch (e) {
    log('Fatal during startup:', e?.message || e);
    dialog.showErrorBox('Mil Tracker', String(e?.message || e));
    app.quit();
  }
});
app.on('before-quit', async () => {
  log('before-quit');
  killNextChildSync();
});
app.on('window-all-closed', () => {
  log('window-all-closed');
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
