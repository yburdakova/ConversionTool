const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'frontend/preload.js'),
    },
  });

  win.loadFile('frontend/index.html');
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('check-boxes', async (event, mainFolderPath) => {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['backend/analyze.py', mainFolderPath]);
  
      let result = '';
  
      python.stdout.on('data', (data) => {
        result += data.toString();
      });
  
      python.stderr.on('data', (data) => {
        console.error('Python error:', data.toString());
      });
  
      python.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        reject(err);
      });
  
      python.on('close', () => {
        resolve(result);
      });
    });
  });
  

ipcMain.handle('convert-box', async (event, payload) => {
    const { boxName, mainFolder, duplicateFolder } = payload;
  
    return new Promise((resolve, reject) => {
      const python = spawn('python', [
        'backend/convert_box.py',
        boxName,
        mainFolder,
        duplicateFolder
      ]);
  
      let errorOutput = '';
      let stdoutLog = '';
  
      python.stdout.on('data', (data) => {
        stdoutLog += data.toString();
      });
  
      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
  
      python.on('error', (err) => {
        reject(`Failed to start Python: ${err.message}`);
      });
  
      python.on('close', (code) => {
        if (code !== 0 || errorOutput) {
          reject(`Python error:\n${errorOutput || stdoutLog}`);
        } else {
          resolve(stdoutLog.trim());
        }
      });
    });
  });
  
