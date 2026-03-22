const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: "LAN Chat Pro",
    backgroundColor: '#0a0a0a',
  });

  // Start the Express server
  const serverPath = path.join(__dirname, '..', 'server.ts');
  
  if (isDev) {
    // In development, we use tsx to run the server
    serverProcess = fork(
      path.join(__dirname, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      [serverPath],
      {
        env: { ...process.env, NODE_ENV: 'development' },
        silent: false
      }
    );
    
    // Wait for server to start (simple delay or listen for message)
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 5000);
  } else {
    // In production, the server should be compiled or handled differently
    // For now, let's assume the user will run npm run build first
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) serverProcess.kill();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (serverProcess) serverProcess.kill();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
