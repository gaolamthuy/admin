const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // Load the index.html from a url
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, 'build/index.html')}`
  );

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Set up event handler for window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// When Electron is ready, create the window
app.whenReady().then(createWindow);

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, recreate the window when the dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle IPC messages for printing
ipcMain.on('print-invoice', (event, data) => {
  if (mainWindow) {
    const pdfPath = path.join(app.getPath('temp'), 'invoice.pdf');
    const printWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
      },
    });

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(data.html)}`);
    
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({}, (success, error) => {
        if (!success) {
          console.log('Print failed:', error);
          event.reply('print-response', { success: false, error });
        } else {
          event.reply('print-response', { success: true });
        }
        printWindow.close();
      });
    });
  }
}); 