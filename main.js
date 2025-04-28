const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
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

ipcMain.handle('check-boxes', async (event, mainFolderPath, duplicateFolderPath) => {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['backend/analyze.py', mainFolderPath, duplicateFolderPath]);

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
  const { boxName, mainFolder, duplicateFolder, quality } = payload;

  const boxFolderPath = path.join(mainFolder, boxName);
  const outputFolderPath = duplicateFolder;

  return new Promise((resolve, reject) => {
    const exePath = path.join(__dirname, 'backend', 'converter.exe');

    const args = [
      '-input', boxFolderPath,
      '-output', outputFolderPath,
      '-dpi=72',
      '-scale=1.0',
      `-quality=${quality || 10}`
    ];

    console.log('Launching converter.exe with args:', args);

    const child = spawn(exePath, args);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[converter stdout]:', data.toString());
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[converter stderr]:', data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(`converter.exe exited with code ${code}\n${stderr}`);
      }
    });

    child.on('error', (err) => {
      reject(`Failed to start converter.exe: ${err.message}`);
    });
  });
});
