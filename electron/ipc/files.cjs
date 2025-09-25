function registerFileIpc({ ipcMain, dialog, shell, getWin, log }) {
  ipcMain.handle('file:pick', async (_evt, opts) => {
    const res = await dialog.showOpenDialog(getWin(), {
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
    if (filePath) shell.showItemInFolder(filePath);
    return { ok: true };
  });
}

module.exports = { registerFileIpc };
