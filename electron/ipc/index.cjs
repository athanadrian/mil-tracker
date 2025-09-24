const { registerFileIpc } = require('./files.cjs');
const { registerCountryIpc } = require('./countries.cjs');
const { registerDocumentIpc } = require('./documents.cjs');

function registerIpcHandlers(ctx) {
  registerFileIpc(ctx);
  registerCountryIpc(ctx);
  registerDocumentIpc(ctx);
}

module.exports = { registerIpcHandlers };
