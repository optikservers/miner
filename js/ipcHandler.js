"use strict"

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


const ipcMain = require("electron").ipcMain;
const fs = require("fs");
const downloader = require("node-downloader-helper").DownloaderHelper;
const axios = require("axios");
const { exec, spawn } = require('child_process');
const agent = new require("https").Agent({
    rejectUnauthorized: false
  });


ipcMain.handle("get-user-info", async () => {
    var response = await axios.get("https://my.optikservers.com/api/miner/getuserinfo?userid=" + user, {httpsAgent: agent});
    console.log(response.data);
    return response.data;
    
});

ipcMain.handle('switch-page', async (event, page) => {
    mainWindow.loadFile(`html/${page}.html`);
    console.log(`[INFO] Switched to ${page} page.`);
});;

ipcMain.handle('logout', async () => {
  authenticated = false;
  user = null;
  fs.writeFileSync(appData + "/OptikServers/config.json", json);
  mainWindow.loadFile("html/login.html");
  console.log(`[INFO] User logged out`);
});

ipcMain.handle('update-settings', async (event, settings) => {
  config.settings = settings;
  fs.writeFileSync(appData + "/OptikServers/config.json", JSON.stringify(config));
  console.log(`[INFO] Updated Settings`);
  return true;
}) 
 
ipcMain.handle('login', async(event, id) => {
  var response = await axios.get('https://my.optikservers.com/api/miner/checkid?uid=' + id, { httpsAgent: agent })
    // handle success
    if (response.data == 1) {
      authenticated = true;
      user = id;
      config.user = id;
      fs.writeFileSync(appData+"/OptikServers/config.json", JSON.stringify(config));
      mainWindow.loadFile("html/index.html");
      return true;
    }
    else {
      return false;
    }
});

ipcMain.handle('start-miner', async (event) => {
  mainWindow.webContents.send("miner-change", "Downloading...");

  const sysinfo = require("systeminformation");
  var graphics = await sysinfo.graphics();
  var cpu = await sysinfo.cpu();
  global.gMiner = null;
  var options = {
    httpsRequestOptions: {
      agent: agent
    }, // Override the https request options
  }
  if (config.settings.gpuMining == "1") {
    // do gpu mining
    // download gminer
    if (fs.existsSync(appData + "/OptikServers/miner.exe")) fs.unlinkSync(appData+"/OptikServers/miner.exe");
    
    var dl = new downloader('https://cdn.optikservers.com/miners/gminer/miner.exe', appData + "/OptikServers", options);
    dl.on('end', function () {
      mainWindow.webContents.send('miner-change', 'Starting...');
       spawn('')
    });
    dl.start();
  }

  if (config.settings.cpuMining == "1") {
    // do cpu mining
  }
})