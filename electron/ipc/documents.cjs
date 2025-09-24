// electron/ipc/documents.cjs
function registerDocumentIpc({ ipcMain, getPrisma, log }) {
  ipcMain.handle('documents:add', async (_evt, docs) => {
    const prisma = await getPrisma();
    return prisma.$transaction(
      docs.map((d) => prisma.document.create({ data: d }))
    );
  });
}

module.exports = { registerDocumentIpc };
