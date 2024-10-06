const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');

let mainWindow;
let ws;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 650,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('index.html');
}

function connectWebSocket() {
    ws = new WebSocket('ws://localhost:11398');

    ws.on('open', () => {
        console.log('Connected to WebSocket server');
    });

    ws.on('message', (data) => {
        const parsedData = JSON.parse(data);
        mainWindow.webContents.send('websocket-data', parsedData);
        console.log(new Date(), 'Received data:', parsedData);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
    });
}

app.whenReady().then(() => {
    createWindow();
    connectWebSocket();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});