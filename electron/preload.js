const { contextBridge, ipcRenderer } = require('electron');

const CH = {
  files: {
    pick: 'file:pick',
    open: 'file:open',
    showInFolder: 'file:showInFolder',
  },
};

const api = {
  files: {
    pick: (filters) => ipcRenderer.invoke(CH.files.pick, { filters }),
    open: (filePath) => ipcRenderer.invoke(CH.files.open, filePath),
    showInFolder: (filePath) =>
      ipcRenderer.invoke(CH.files.showInFolder, filePath),
  },
};

contextBridge.exposeInMainWorld('api', Object.freeze(api));
