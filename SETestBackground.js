// Modules to control application life and create native browser window
import {app, BrowserWindow, ipcMain} from 'electron';
let mainWindow;
let steamID = null;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('SEClient.html')

  mainWindow.on('ready-to-show', ()=>{
    mainWindow.webContents.send('strengths', [['Player1', 0.9], ['Player2', 0.8], ['Player3', 0.7], ['Player4', 0.2]]);
    mainWindow.webContents.send('steam-id', process.argv[2]);

  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

