const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("raseedDesktop", {
  platform: process.platform,
  version: process.versions.electron,
});
