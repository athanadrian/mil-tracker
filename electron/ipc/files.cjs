// electron/ipc/files.cjs
function registerFileIpc({ ipcMain, dialog, shell, getWin, log }) {
  ipcMain.handle('file:pick', async (_evt, opts) => {
    const win = getWin ? getWin() : undefined;
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
    try {
      shell.showItemInFolder(filePath);
      return { ok: true };
    } catch (e) {
      log?.('file:showInFolder error', e?.message || e);
      return { ok: false, error: String(e?.message || e) };
    }
  });
}

module.exports = { registerFileIpc };
