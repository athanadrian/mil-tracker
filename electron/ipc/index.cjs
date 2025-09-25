const { registerFileIpc } = require('./files.cjs');

function registerIpcHandlers(ctx) {
  registerFileIpc(ctx);
}

module.exports = { registerIpcHandlers };
