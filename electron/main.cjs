'use strict';

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  Menu,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
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

/* ===== App lifecycle ===== */
app.whenReady().then(async () => {
  try {
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
