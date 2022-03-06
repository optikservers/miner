"use strict";

// Copyright © 2020 - 2022 OptikServers

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.





// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
var unzipper = require("unzipper");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const { DownloaderHelper } = require('node-downloader-helper');
const http = require("axios");
const https = require("https");
if (process.platform == "win32") global.appData = process.env.APPDATA + "/OptikServers";
if (process.platform == "linux") global.appData = process.env.HOME + "/.optikservers";
global.config = null;
global.authenticated = false;
global.user = null;
global.json = JSON.stringify(
  {
    user: 'not_set',
    settings: {
      cpuAffinity: '80',
      cpuMining: '1',
      gpuMining: '1',
      autoStart: '1',
      openWindow: '1'
    }
  }
);
const agent = new https.Agent({
  rejectUnauthorized: false
});
require("./js/ipcHandler");

app.whenReady().then(() => {
  require("./js/tray");
  global.mainWindow = new BrowserWindow({
    width: 1200,
    center: true,
    height: 700,
    icon: __dirname + "/html/icon.png",
    title: "OptikServers",
    webPreferences: {
      nodeIntegration: true,
      // devTools: false,
      contextIsolation: false
    }
  });
  mainWindow.removeMenu();
  mainWindow.webContents.openDevTools({mode: "bottom"})

  if (!fs.existsSync(appData)) {
    console.log(fs.mkdirSync(appData));
  }
  if (!fs.existsSync(appData+"/config.json")) {
    fs.writeFileSync(appData+"/config.json", json);
  }


  config = require(appData+"/config.json");
  if (config.user !== "not_set") {
    authenticated = true;
    user = config.user;
  }
  
  
  if (authenticated == true) {
    mainWindow.loadFile('html/index.html')
  }
  else {
    mainWindow.loadFile("html/login.html");
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

ipcMain.handle("userinfo", async () => {
  http.get("https://my.optikservers.com/api/miner/getuserinfo?userid=" + user, { httpsAgent: agent})
  .then(function (response) {
    mainWindow.webContents.send("user", response.data.username, response.data.coins);
  }); 
})
// ipcMain.handle("start", async () => {
//   // Find XMRIG miner and start it
//     if (!fs.existsSync(appData + "/XMRig")) {
//     console.log(fs.mkdirSync(appData+"/XMRig"));
//   }
//   if (!fs.existsSync(appData +"/XMRig/xmrig.exe")) {
//     const dl = new DownloaderHelper("https://github.com/MoneroOcean/xmrig/releases/download/v6.16.2-mo2/xmrig-v6.16.2-mo2-win64.zip" , appData + "/XMRig");
//     dl.on('end', function () {
//       fs.createReadStream(appData + "/XMRig/xmrig-v6.16.2-mo2-win64.zip")
//       .pipe(unzipper.Extract({ path: appData + "/XMRig" }));
//     });
//     dl.start();
//   }
//   if (fs.existsSync(appData+"/XMRig/config.json")) {
//     fs.unlinkSync(appData+"/XMRig/config.json");
//   }
//     fs.copyFileSync(path.join(__dirname, "xmrig.config.json"), appData+"/XMRig/config.json");
//     var xmrigjson = require(appData+"/XMRig/config.json");
//   xmrigjson.pools[0].user = wallet;
//   xmrigjson.pools[0].pass = "NCE_" + user;
//   xmrigjson.cpu['max-threads-hint'] = config.settings.cpuLimit;
//   fs.writeFileSync(appData+"/XMRig/config.json", JSON.stringify(xmrigjson));
//   xmrig = spawn(appData+"\\OptikServers\\XMRig\\xmrig.exe");
//   xmrig.on('close', () => {
//     xmrig = null;
//     mainWindow.webContents.send("error", "MINER_KILLED");
//   })
// });


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
  fs.writeFileSync(appData+"/config.json", JSON.stringify(config));

});

ipcMain.handle("settings:fetch", async () => {
  mainWindow.webContents.send("settings:fetch_reply", config.settings.cpuLimit);  
});

ipcMain.handle("settings:back", async () => {
  mainWindow.loadFile("index.html");
})





// setInterval(function () {
//   if (xmrig !== null) {
//     // Send api requestv
//     http.get("https://my.optikservers.com/api/miner/heartbeat?uid="+user,{
//       headers: {
//         'Authorization': `Bearer uTkVjxdk9Qc29P7YCdeSVPFw54yuSava`
//       },
//       httpsAgent: agent
//     }).then(function (response) {
//       if (response !== "OK") {
//         if (response == "HASH_TOO_LOW") {
//           mainWindow.webContents.send("error", "Your hashrate is too low to earn, consider increasing your CPU limit.");
//         }
//       }
//     })
//   }
// }, 60000);

