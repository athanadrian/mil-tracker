const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pickFiles: (filters) => ipcRenderer.invoke('file:pick', { filters }),
  openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('file:showInFolder', filePath),

  listCountries: () => ipcRenderer.invoke('countries:list'),
  createCountry: (data) => ipcRenderer.invoke('countries:create', data),

  addDocuments: (docs) => ipcRenderer.invoke('documents:add', docs),
});
