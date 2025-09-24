// electron/ipc/countries.cjs
function registerCountryIpc({ ipcMain, getPrisma, log }) {
  ipcMain.handle('countries:list', async () => {
    const prisma = await getPrisma();
    return prisma.country.findMany({ orderBy: { name: 'asc' } });
  });

  ipcMain.handle('countries:create', async (_evt, data) => {
    const prisma = await getPrisma();
    return prisma.country.create({ data });
  });
}

module.exports = { registerCountryIpc };
