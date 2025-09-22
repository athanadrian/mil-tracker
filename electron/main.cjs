const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
let win = null;

async function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  });
  await win.loadURL('http://localhost:5123');
  if (!app.isPackaged) win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC παραδείγματα
ipcMain.handle('file:pick', async (_evt, opts) => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: opts?.filters,
  });
  return res.canceled ? [] : res.filePaths;
});
ipcMain.handle('file:open', async (_evt, filePath) => {
  if (!filePath) return { ok: false, error: 'No path' };
  const result = await shell.openPath(filePath);
  return { ok: result === '', error: result || undefined };
});
ipcMain.handle('file:showInFolder', async (_evt, filePath) => {
  shell.showItemInFolder(filePath);
  return { ok: true };
});

ipcMain.handle('countries:list', async () =>
  prisma.country.findMany({ orderBy: { name: 'asc' } })
);
ipcMain.handle('countries:create', async (_evt, data) =>
  prisma.country.create({ data })
);
ipcMain.handle('documents:add', async (_evt, docs) =>
  prisma.$transaction(docs.map((d) => prisma.document.create({ data: d })))
);
