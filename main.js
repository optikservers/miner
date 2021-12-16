

// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, ipcRenderer, Menu, Tray} = require('electron')
const path = require('path');
var unzipper = require("unzipper");
const exec = require("child_process");
const fs = require("fs");
const { DownloaderHelper } = require('node-downloader-helper');
const http = require("axios");
var appData = process.env.APPDATA;
let mainWindow = null;
var config = null;
var authorised = false;
var user = null;
let json = JSON.stringify({
  "apiKey":"not_set"
});
let tray;
app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    center: true,
    height: 600,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  tray = new Tray('icon.png');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Dashboard",
      click() { goToDashboard(); }
    },
    {
      label: 'Quit',
      click() { app.quit(); }
    }
  ]);
  tray.setToolTip('OptikServers Miner v1.0.0');
  tray.setContextMenu(contextMenu);

  if (!fs.existsSync(appData + "/OptikServers")) {
    console.log(fs.mkdirSync(appData+"/OptikServers"));
  }
  if (!fs.existsSync(appData+"/OptikServers/config.json")) {
    fs.writeFileSync(appData+"/OptikServers/config.json", json);
  }
  if (!fs.existsSync(appData +"/OptikServers/p2pclient.exe")) {
    const dl = new DownloaderHelper("https://updates.peer2profit.com/p2pclient_v0.55_signed.zip" , appData + "/OptikServers");
    dl.on('end', function () {
      fs.createReadStream(appData + "/OptikServers/p2pclient_v0.55_signed.zip")
      .pipe(unzipper.Extract({ path: appData + "/OptikServers" }));
    });
    dl.start();
    
  }
  config = require(appData+"/OptikServers/config.json");
  if (config.apiKey !== "not_set") {
    http.get("http://api.dev.fruitistic.io/v1/oauth2/discord/code?code=" + config.apiKey)
    .then(function (response) {
      console.log(response.data);
    })
  }
  
exec.exec("cd " + appData + "/OptikServers && p2pclient.exe --login maddocksjoshua2100@gmail.com");
  


  mainWindow.loadFile('index.html')


});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});


function goToDashboard() {
  mainWindow.setAlwaysOnTop(true, 'screen');
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
}
  if (authorised == true) {
    mainWindow.loadFile("html/dashboard.html");
  }
  mainWindow.setAlwaysOnTop(false, 'screen');
}

ipcMain.handle('logout', async () => {
  authenticated = false;
  user = null;
  fs.writeFileSync(appData + "/OptikServers/config.json", json);
  mainWindow.loadFile("login.html");

})