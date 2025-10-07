'use strict';

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  Menu,
  protocol,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs'); // ✅ Promises API σε CJS
const promiseFs = require('node:fs/promises'); // ✅ Promises API σε CJS
const { lookup: mimeLookup } = require('mime-types');
const net = require('node:net');
//const mime = require('mime');
const { fork, spawn } = require('node:child_process');
const { registerIpcHandlers } = require('./ipc/index.cjs');

const PORT = Number(process.env.PORT) || 5123;
let win = null;
let nextChild = null;

/* ===== Basics ===== */
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
const BASE_DIR = path.join(app.getAppPath(), 'static'); // adjust

/* ===== Minimal logger (always-on) ===== */
function getLogPath() {
  try {
    return path.join(app.getPath('userData'), 'mil-tracker.log');
  } catch {
    return path.join(process.cwd(), 'mil-tracker.log');
  }
}
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args
    .map((x) =>
      typeof x === 'string'
        ? x
        : (() => {
            try {
              return JSON.stringify(x);
            } catch {
              return String(x);
            }
          })()
    )
    .join(' ')}\n`;
  try {
    fs.appendFileSync(getLogPath(), line, 'utf8');
  } catch {}
}

/* ===== Single instance ===== */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

/* ===== Small helpers ===== */
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
    try {
      if (fs.existsSync(seed)) {
        fs.copyFileSync(seed, dest);
        log('DB seeded');
      } else {
        fs.writeFileSync(dest, '');
        log('DB created empty');
      }
    } catch (e) {
      log('DB error:', e?.message || e);
    }
  }
}
function waitForPort(port, host = '127.0.0.1', timeoutMs = 40000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tryOnce() {
      const s = net.createConnection(port, host);
      s.once('connect', () => {
        s.end();
        resolve(true);
      });
      s.once('error', () => {
        s.destroy();
        if (Date.now() - start > timeoutMs)
          reject(new Error(`Timeout http://${host}:${port}`));
        else setTimeout(tryOnce, 250);
      });
    })();
  });
}
function getStartPath() {
  try {
    const flag = path.join(app.getPath('userData'), 'debug-health.flag');
    if (fs.existsSync(flag)) return '/api/health';
  } catch {}
  return process.env.MIL_START_PATH || '/';
}

/* ===== Dir copy (public/.next assets -> standalone) ===== */
function copyDirSync(src, dest) {
  try {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, entry.name);
      const d = path.join(dest, entry.name);
      if (entry.isDirectory()) copyDirSync(s, d);
      else fs.copyFileSync(s, d);
    }
  } catch (e) {
    log('copyDirSync error:', e?.message || e, src, '->', dest);
  }
}

/* ===== Next server (prod) ===== */
async function bootNextInProd() {
  const appRoot = APP_ROOT(); // resources/app
  const standaloneDir = path.join(appRoot, '.next', 'standalone'); // resources/app/.next/standalone
  const serverJs = path.join(standaloneDir, 'server.js');
  if (!fs.existsSync(serverJs))
    throw new Error('Next standalone server.js not found');

  // Πηγές (πακεταρισμένα από electron-builder "files")
  const srcStatic = path.join(appRoot, '.next', 'static');
  const srcBuildId = path.join(appRoot, '.next', 'BUILD_ID');
  const srcPublic = path.join(appRoot, 'public');

  // Προορισμοί (εκεί που σερβίρει ο standalone server)
  const dstNextRoot = path.join(standaloneDir, '.next');
  const dstStatic = path.join(dstNextRoot, 'static');
  const dstBuildId = path.join(dstNextRoot, 'BUILD_ID');
  const dstPublic = path.join(standaloneDir, 'public');

  // 🔁 Συγχρονισμός assets ΠΡΙΝ το boot
  try {
    if (fs.existsSync(srcStatic)) {
      copyDirSync(srcStatic, dstStatic);
    }
    if (fs.existsSync(srcBuildId)) {
      fs.mkdirSync(dstNextRoot, { recursive: true });
      fs.copyFileSync(srcBuildId, dstBuildId);
    }
    if (fs.existsSync(srcPublic)) {
      copyDirSync(srcPublic, dstPublic);
    }
    log('Assets synced to standalone');
  } catch (e) {
    log('Asset sync error:', e?.message || e);
  }

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    DATABASE_URL: `file:${PROD_DB()}`,
  };

  nextChild = fork(serverJs, [], {
    env,
    cwd: path.dirname(serverJs), // standalone working dir
    stdio: 'ignore', // πιο «ήσυχο»/γρήγορο boot
    detached: false,
  });
  nextChild.on('error', (e) => log('Next child error:', e?.message || e));
  nextChild.on('exit', (code, sig) =>
    log('Next child exit:', String(code), String(sig))
  );

  await waitForPort(PORT).catch((e) => {
    log('Next start timeout:', e?.message || e);
    throw e;
  });
}

/* ===== Kill Next on quit ===== */
function killNextChildSync() {
  if (!nextChild || nextChild.killed) return;
  try {
    nextChild.kill();
  } catch (e) {
    log('kill error:', e?.message || e);
  }
  if (process.platform === 'win32' && nextChild && !nextChild.killed) {
    try {
      spawn('taskkill', ['/PID', String(nextChild.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    } catch (e) {
      log('taskkill error:', e?.message || e);
    }
  }
}

/* ===== Window icon ===== */
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
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return undefined;
}

/* ===== BrowserWindow ===== */
async function createWindow() {
  const startPath = getStartPath();
  win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    minWidth: 768,
    minHeight: 600,
    center: true,
    icon: resolveWindowIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      devTools: isDev(), // DevTools μόνο σε dev
    },
    autoHideMenuBar: true,
  });

  const url = `http://localhost:${PORT}${startPath}`;

  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {});
  win.webContents.on('did-fail-load', (_e, code, desc, failedUrl) =>
    log('did-fail-load', String(code), desc, failedUrl)
  );
  win.webContents.on('render-process-gone', (_e, d) =>
    log('render-process-gone', d?.reason || '')
  );

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

  if (isDev()) {
    await win.loadURL(url);
  } else {
    ensureProdDbPresent();
    await bootNextInProd();
    await win.loadURL(url);
  }
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local',
    privileges: {
      standard: true, // να συμπεριφέρεται σαν κανονικό scheme (URL parsing)
      secure: true, // ως "secure"
      supportFetchAPI: true, // για protocol.handle με Response
      stream: true, // streaming
      corsEnabled: true, // να μην μπλοκάρεται από CORS εντός app
    },
  },
]);

/* ===== App lifecycle ===== */
app.whenReady().then(async () => {
  try {
    // protocol.handle('local', async (request) => {
    //   try {
    //     const u = new URL(request.url); // π.χ. local://c/Users/...  ή  local:///C:/Users/...

    //     let fullPath;

    //     // Μορφή 1: local://C/Users/...
    //     if (u.hostname && /^[a-z]$/i.test(u.hostname)) {
    //       const drive = u.hostname.toUpperCase(); // "C"
    //       fullPath = `${drive}:${u.pathname}`; // "C:/Users/..."
    //     }
    //     // Μορφή 2: local:///C:/Users/...
    //     else if (/^\/[A-Za-z]:\//.test(u.pathname)) {
    //       fullPath = u.pathname.slice(1); // "C:/Users/..."
    //     }
    //     // POSIX absolute
    //     else {
    //       fullPath = u.pathname; // "/Users/..."
    //     }

    //     fullPath = decodeURIComponent(fullPath);
    //     if (process.platform === 'win32') {
    //       fullPath = fullPath.replace(/\//g, path.sep); // -> backslashes
    //     }

    //     console.log('[local] →', fullPath);

    //     const data = await fs.readFile(fullPath);
    //     const type = mime.getType(fullPath) || 'application/octet-stream';
    //     return new Response(data, { headers: { 'Content-Type': type } });
    //   } catch (err) {
    //     console.error('[local] ERROR:', request.url, err);
    //     // 404 όταν το αρχείο λείπει, 500 για άλλα
    //     const msg = String(err?.code || '')
    //       .toLowerCase()
    //       .includes('enoent')
    //       ? { status: 404, text: 'Not Found' }
    //       : { status: 500, text: 'Internal Error' };
    //     return new Response(msg.text, { status: msg.status });
    //   }
    // });

    protocol.handle('local', async (request) => {
      const u = new URL(request.url); // π.χ. local://c/Users/... ή local:///C:/Users/...
      let fullPath;

      try {
        if (u.hostname && /^[a-z]$/i.test(u.hostname)) {
          const drive = u.hostname.toUpperCase(); // "C"
          fullPath = `${drive}:${u.pathname}`; // "C:/Users/..."
        } else if (/^\/[A-Za-z]:\//.test(u.pathname)) {
          fullPath = u.pathname.slice(1); // "C:/Users/..."
        } else {
          fullPath = u.pathname; // "/Users/..." (POSIX)
        }

        fullPath = decodeURIComponent(fullPath);
        if (process.platform === 'win32') {
          fullPath = fullPath.replace(/\//g, path.sep); // -> backslashes
        }

        console.log('[local] REQUEST:', request.url);
        console.log('[local] MAPPED :', fullPath);

        const data = await promiseFs.readFile(fullPath); // ✅ promises.readFile
        const type = mimeLookup(fullPath) || 'application/octet-stream';

        return new Response(data, { headers: { 'Content-Type': type } });
      } catch (err) {
        const code = String(err?.code || '');
        let status = 500;
        if (code === 'ENOENT') status = 404;
        else if (code === 'EACCES') status = 403;

        console.error('[local] ERROR  :', request.url, '→', fullPath);
        console.error('[local] CODE   :', code);
        console.error('[local] STACK  :', err?.stack || err);
        return new Response(`${status} ${code || 'Internal Error'}`, {
          status,
        });
      }
    });

    log('App start', 'isDev=' + isDev(), 'exeDir=' + EXE_DIR());
    app.setAppUserModelId('com.doa.miltracker');
    Menu.setApplicationMenu(null);
    registerIpcHandlers({ ipcMain, dialog, shell, getWin: () => win, log });
    await createWindow();
  } catch (e) {
    log('Fatal during startup:', e?.message || e);
    try {
      dialog.showErrorBox('Mil Tracker', String(e?.message || e));
    } catch {}
    app.quit();
  }
});
app.on('before-quit', () => {
  killNextChildSync();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
