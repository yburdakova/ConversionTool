const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  checkBoxes: (mainFolderPath, duplicateFolderPath) =>
    ipcRenderer.invoke('check-boxes', mainFolderPath, duplicateFolderPath),
  convertBox: (payload) => ipcRenderer.invoke('convert-box', payload),

});
