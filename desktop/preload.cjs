const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("raseedDesktop", {
  platform: process.platform,
  version: process.versions.electron,
  pickDirectory: () => ipcRenderer.invoke("raseed:choose-directory"),
  pickFile: (options = {}) => ipcRenderer.invoke("raseed:choose-file", options),
  showItemInFolder: (filePath) => ipcRenderer.invoke("raseed:show-item-in-folder", filePath),
});
