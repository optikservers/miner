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



// IMPORT REQUIRED PACKAGES
const ipcMain = require("electron").ipcMain;
const fs = require("fs");
const downloader = require("node-downloader-helper").DownloaderHelper;
const axios = require("axios");
const { exec, spawn } = require('child_process');
const agent = new require("https").Agent({
    rejectUnauthorized: false
  });


// IPC HANDLER FUNCTIONS
ipcMain.handle("get-user-info", async () => {
    var response = await axios.get("https://my.optikservers.com/api/miner/getuserinfo?userid=" + user, {httpsAgent: agent});
    return response.data;
});

ipcMain.handle('switch-page', async (event, page) => {
    mainWindow.loadFile(`html/${page}.html`);
    console.log(`[INFO] Switched to ${page} page.`);
});;

ipcMain.handle('logout', async () => {
  authenticated = false;
  user = null;
  fs.writeFileSync(appData + "/config.json", json);
  mainWindow.loadFile("html/login.html");
  console.log(`[INFO] User logged out`);
});

ipcMain.handle("get-settings", async () => {
  return config.settings;
});

ipcMain.handle('update-settings', async (event, settings) => {
  config.settings = settings;
  fs.writeFileSync(appData + "/config.json", JSON.stringify(config));
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
      fs.writeFileSync(appData+"/config.json", JSON.stringify(config));
      mainWindow.loadFile("html/index.html");
      console.log("[INFO] User logged in.");
      return true;
    }
    else {
      return false;
    }
});

ipcMain.handle('start-miner', async (event) => {
  console.log("[INFO] Starting miner...");
  if (config.settings.cpuMining == "1") {
    mainWindow.webContents.send("info-message", "XMRig (Our CPU miner) will shortly ask for administrator privileges in order to run at maximum performance.");
  }
  mainWindow.webContents.send("miner-change", "Downloading...");

  const sysinfo = require("systeminformation");
  var graphics = await sysinfo.graphics();
  if (typeof graphics.controllers[0].vram == undefined) { 
    graphics.controllers[0].vram = 8192;
  }
  var cpu = await sysinfo.cpu();
  global.phoenixMiner = null;
  global.XMRig = null;
  var options = {
    httpsRequestOptions: {
      agent: agent
    }, // Override the https request options
  }
  if (config.settings.gpuMining == "1") {
    // do gpu mining
    // download gminer
    var downloadURL = null;
    var minerFile = null;
    // Specify urls for both win32 and linux systems.
    if (process.platform == "win32") {
      downloadURL = "https://cdn.optikservers.com/miners/phoenixminer/PhoenixMiner.exe";
      minerFile = "PhoenixMiner.exe";
    }else {
      downloadURL = "https://cdn.optikservers.com/miners/phoenixminer/PhoenixMiner";
      minerFile = "PhoenixMiner";
    }

    // Remove any old miner files
    if (fs.existsSync(appData + "/" + minerFile)) fs.unlinkSync(appData+"/"+minerFile);
    
    //Start downloading miner files
    var dl = new downloader(downloadURL, appData, options);
    dl.on('end', async function () {

      // Download end function, starts miner on prohashing.com
      mainWindow.webContents.send('miner-change', 'Starting...');
      
      // Change file permissions for linux users
      if (process.platform == "linux") await exec(`chmod u+x ${appData}/${minerFile}`).on('exit', (code) => {
        mainWindow.webContents.send("error", "There was an unexpected error when changing the miner's permissions (CHMOD). Please contact support");
        mainWindow.webContents.send('miner-change', 'START MINER');
        return;
      });
      phoenixMiner = spawn(appData + "/" + minerFile, ['-pool', 'prohashing.com:3339', '-wal', 'optikservers', '-pass', `a=ethash,n=${user},l=${graphics.controllers[0].vram}`, '-log', '0']);
      phoenixMiner.stdout.on('data', (data) => {
        var data = data.toString();
        console.log(`STDOUT: ${data}`);
        if (data.includes("Connected")) {
          // PhoenixMiner is running
          console.log("[INFO] PhoenixMiner v5 running.");
          mainWindow.webContents.send("miner-change", "STOP MINER");
        }
        if (data.includes("No avaiable GPUs for mining. Please check your drivers and/or hardware")) {
          // No GPU on the user's device
          console.log("[ERROR] No GPUs available for PhoenixMiner.");
          mainWindow.webContents.send("error", "There is no available GPUs for mining. Mining will only begin if CPU mining is enabled.");
          mainWindow.webContents.send("miner-change", "START MINER");
          phoenixMiner.kill();
          phoenixMiner = null;
          return;
        }
      });
    });
    // Start downloading
    dl.start();
  }

  if (config.settings.cpuMining == "1") {
      // START CPU MINING WITH XMRIG & MO
      const sudo = require("sudo-prompt");
      
      var xmrigdownloadURL = null;
      var xmrigminerFile = null;

      if (process.platform == "win32") {
        xmrigdownloadURL = "https://cdn.optikservers.com/miners/xmrig/xmrig.exe";
        xmrigminerFile = "xmrig.exe";
      } else {
        xmrigdownloadURL = "https://cdn.optikservers.com/miners/xmrig/xmrig";
        xmrigminerFile = "xmrig";
      }

      if (fs.existsSync(appData + "/" + xmrigminerFile)) fs.unlinkSync(appData+"/"+xmrigminerFile);

          //Start downloading miner files
    var dl = new downloader(xmrigdownloadURL, appData, options);
    dl.on('end', async function () {

      // Download end function, starts miner on moneroocean.stream
      mainWindow.webContents.send('miner-change', 'Starting...');
      
      // Change file permissions for linux users
      if (process.platform == "linux") await exec(`chmod u+x ${appData}/${xmrigminerFile}`).on('exit', (code) => {
        mainWindow.webContents.send("error", "There was an unexpected error when changing the miner's permissions (CHMOD). Please contact support");
        mainWindow.webContents.send('miner-change', 'START MINER');
        return;
      });
      var options = {name: 'OptikServers'};
        XMRig = sudo.exec(appData + "/" + xmrigminerFile + ` -o gulf.moneroocean.stream:10128 -u 44g5KqHrrdz1mF6Z9YGB6SJRGcEVbRXWnZXC8BmSkPjSHYvWSfjftZwE7GESLDDUTgMjN4MBdPzebEKuK3XYRRE94RjCL4M -p ${user} -k --donate-level 0 --cpu-max-threads-hint `+config.settings.cpuAffinity, options);
        setTimeout(() => {
          XMRig.kill();
        },5000);
    });
    // Start downloading
    dl.start();
  }
})

