const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onWebSocketData: (callback) => ipcRenderer.on('websocket-data', (_event, value) => callback(value)),
});