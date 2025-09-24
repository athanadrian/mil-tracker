'use strict';
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const { fork, spawn } = require('node:child_process');
const { registerIpcHandlers } = require('./ipc/index.cjs');

const PORT = Number(process.env.PORT) || 5123;
let win = null;
let prisma = null;
let nextChild = null;

const isDev = () => !app.isPackaged;

/* ============== Logger ============== */
const DEBUG = process.env.MIL_DEBUG === '1' || isDev();
function getLogPath() {
  try {
    return path.join(app.getPath('userData'), 'mil-tracker.log');
  } catch {
    return path.join(process.cwd(), 'mil-tracker.log');
  }
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

/* ============== Paths & helpers ============== */
const PROJECT_DB = () => path.join(process.cwd(), 'data', 'mil.db'); // dev
const EXE_DIR = () => {
  try {
    return path.dirname(app.getPath('exe'));
  } catch {
    return process.cwd();
  }
};
const PROD_DB = () => path.join(EXE_DIR(), 'data', 'mil.db'); // prod
const APP_ROOT = () => path.join(process.resourcesPath, 'app'); // packaged app root

function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {}
}

function ensureProdDbPresent() {
  const dest = PROD_DB();
  ensureDir(path.dirname(dest));
  if (!fs.existsSync(dest)) {
    // seed από το πακέτο: resources/app/data/mil.db (έρχεται από build.files)
    const seed = path.join(APP_ROOT(), 'data', 'mil.db');
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
        } else {
          setTimeout(tryOnce, 300);
        }
      });
    })();
  });
}

/* ============== Health start path ============== */
function getStartPath() {
  try {
    const flag = path.join(app.getPath('userData'), 'debug-health.flag');
    if (fs.existsSync(flag)) return '/api/health';
  } catch {}
  return process.env.MIL_START_PATH || '/';
}

/* ============== Next server (prod) ============== */
async function bootNextInProd() {
  const serverJs = path.join(APP_ROOT(), '.next', 'standalone', 'server.js');
  if (!fs.existsSync(serverJs))
    throw new Error('Next standalone server.js not found');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    DATABASE_URL: `file:${PROD_DB()}`,
  };

  nextChild = fork(serverJs, [], {
    env,
    cwd: path.dirname(serverJs),
    stdio: 'ignore',
    detached: false,
  });
  nextChild.on('error', (e) => log('Next child error:', e?.message || e));
  nextChild.on('exit', (code, sig) => log('Next child exit:', code, sig));

  await waitForPort(PORT);
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

/* ============== Prisma init (πάντα data/mil.db) ============== */
async function initPrisma() {
  if (prisma) return prisma;

  let dbPath;
  if (isDev()) {
    dbPath = PROJECT_DB();
    ensureDir(path.dirname(dbPath));
    if (!fs.existsSync(dbPath)) {
      // αν δεν έχεις φτιάξει data/mil.db, ξεκίνα με κενό
      fs.writeFileSync(dbPath, '');
      log('Created empty DEV DB at', dbPath);
    }
  } else {
    // seed πριν ανοίξουμε Prisma
    ensureProdDbPresent();
    dbPath = PROD_DB();
  }

  process.env.DATABASE_URL = `file:${dbPath}`;
  log('DB =', process.env.DATABASE_URL);

  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  return prisma;
}

/* ============== Window ============== */
async function createWindow() {
  const startPath = getStartPath();
  win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
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
    if (process.env.MIL_DEBUG === '1')
      win.webContents.openDevTools({ mode: 'detach' });
  } else {
    await bootNextInProd();
    log('PROD load URL:', url);
    await win.loadURL(url);
  }
}

/* ============== App lifecycle ============== */
app.whenReady().then(async () => {
  log('App ready. isDev=', isDev());
  try {
    await initPrisma(); // φροντίζει DB path & seed (prod)
    registerIpcHandlers({
      ipcMain,
      dialog,
      shell,
      getWin: () => win,
      log,
      getPrisma: () => initPrisma(),
    });
    await createWindow();
  } catch (e) {
    log('Fatal during startup:', e?.message || e);
    dialog.showErrorBox('Mil Tracker', String(e?.message || e));
    app.quit();
  }
});
app.on('before-quit', async () => {
  log('before-quit');
  try {
    if (prisma) await prisma.$disconnect();
  } catch {}
  killNextChildSync();
});
app.on('window-all-closed', () => {
  log('window-all-closed');
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
