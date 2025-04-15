const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  checkBoxes: (mainFolderPath) => ipcRenderer.invoke('check-boxes', mainFolderPath),
  convertBox: (payload) => ipcRenderer.invoke('convert-box', payload),
});
