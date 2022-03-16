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
global.mining = "stopped";

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
 
ipcMain.handle('login', async (event, id) => {
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
  mainWindow.webContents.send("miner-change", "STARTING MINER...");
  mining = "starting";
  const sysinfo = require("systeminformation");
  var graphics = await sysinfo.graphics();
  var cpu = await sysinfo.cpu();
  global.phoenixMiner = null;
  global.XMRig = null;
  var options = {
    httpsRequestOptions: {
      agent: agent
    }, // Override the https request options
  }
  async function startMining() {
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
        
        // Change file permissions for linux users
        if (process.platform == "linux") await exec(`chmod u+x ${appData}/${minerFile}`).on('exit', (code) => {
          mainWindow.webContents.send("error", "There was an unexpected error when changing the miner's permissions (CHMOD). Please contact support");
          mining = "stopped";
          return;
        });
        if (graphics.controllers == "") {
          phoenixMiner = spawn(appData + "/" + minerFile, ['-pool', 'prohashing.com:3339', '-wal', 'optikservers', '-pass', `a=ethash,n=${user}`, '-log', '0']);
        } else {
          try {
            phoenixMiner = spawn(appData + "/" + minerFile, ['-pool', 'prohashing.com:3339', '-wal', 'optikservers', '-pass', `a=ethash,n=${user},l=${graphics.controllers[0].vram}`, '-log', '0']);
          } catch (error) {
            console.log(error);
          }
        }
        phoenixMiner.stdout.on('data', (data) => {
          var data = data.toString();
          // console.log(`STDOUT: ${data}`);
          if (data.includes("Connected")) {
            // PhoenixMiner is running
            console.log("[INFO] PhoenixMiner v5 running.");
            mining = "running";
          }
          if (data.includes("No avaiable GPUs for mining. Please check your drivers and/or hardware")) {
            // No GPU on the user's device
            console.log("[ERROR] No GPUs available for PhoenixMiner.");
            mainWindow.webContents.send("error", "There is no available GPUs for mining. Mining will only begin if CPU mining is enabled.");
            mining = "stopped";
            phoenixMiner.kill();
            phoenixMiner = null;
            return;
          }
        });
        phoenixMiner.on('exit', () => {
          phoenixMiner = "error";
          mainWindow.webContents.send('miner-change', 'START MINER');
        })
      });
      // Start downloading
      dl.start();
    }
  
    if (config.settings.cpuMining == "1") {
        // START CPU MINING WITH XMRIG & MO
        
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
        // Change file permissions for linux users
        if (process.platform == "linux") await exec(`chmod u+x ${appData}/${xmrigminerFile}`).on('exit', (code) => {
          mainWindow.webContents.send("error", "There was an unexpected error when changing the miner's permissions (CHMOD). Please contact support");
          mining = "stopped";
          return;
        });
          XMRig = spawn(appData + "/" + xmrigminerFile, ['-o', 'gulf.moneroocean.stream:10128', '-u', '44g5KqHrrdz1mF6Z9YGB6SJRGcEVbRXWnZXC8BmSkPjSHYvWSfjftZwE7GESLDDUTgMjN4MBdPzebEKuK3XYRRE94RjCL4M' ,'-p', user, '-k', '--donate-level', 0, '--cpu-max-threads-hint' ,config.settings.cpuAffinity]);
          XMRig.stdout.on('data', (data) => {
            var data = data.toString();
            if (data.includes("STARTING ALGO PERFORMANCE CALIBRATION (with 10 seconds round)")) {
              // PhoenixMiner is running
              console.log("[INFO] XMRig running.");
              mining = "running";
            }
          });   
          XMRig.on('exit', () => {
            XMRig = "error";
            mainWindow.webContents.send('miner-change', 'START MINER');
            mining = "stopped";
          })
        });
      // Start downloading
      dl.start();
    }
  }
  await startMining();
  setInterval(() => {
    if (XMRig !== null) mining = "running";
    if (phoenixMiner !== null) mining = "running";
    if (XMRig == "error" && phoenixMiner == "error") mining = "stopped";
    if (mining == "stopped") {
      mainWindow.webContents.send('miner-change', "START MINER");
    } else if (mining == "running") mainWindow.webContents.send('miner-change', "STOP MINER");
  },5000);


})

ipcMain.handle('stop-miner', async () => {
  if (XMRig !== null) {
    XMRig.kill();
    XMRig = null;
  }
  if (phoenixMiner !== null) {
    phoenixMiner.kill();
    phoenixMiner = null;

  }
  mining = "stopped";
  mainWindow.webContents.send('miner-change', "START MINER");

})

ipcMain.handle('get-miner-status', async () => {
  return mining;
});

ipcMain.handle('get-hashrate', async () => {
  var hashrate = await axios.get("https://my.optikservers.com/api/miner/hashrate?uid=" + user);
  return hashrate.data;
});

ipcMain.handle('get-earning', async () => {
  var earning = await axios.get("https://my.optikservers.com/api/miner/rate?uid=" + user);
  return earning.data;
});

ipcMain.handle('get-mining-type', async () => {
  const config = require(appData+"/config.json");
  let result = "";
  if (config.settings.gpuMining == "1" && config.settings.cpuMining == "1") {
      result = "CPU & GPU";
  } else if (config.settings.cpuMining == "1") {
    result = "CPU";
  } else if (config.settings.gpuMining == "1") {
    result = "GPU";
  }
  return result;
})