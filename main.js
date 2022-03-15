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


const { app, BrowserWindow, Notification, Tray, Menu } = require('electron');
const fs = require("fs");

const gotTheLock = app.requestSingleInstanceLock()    
if (!gotTheLock) {
  app.quit()
}

if (process.platform == "win32") global.appData = process.env.APPDATA + "/OptikServers";
if (process.platform == "linux") global.appData = process.env.HOME + "/.optikservers";
global.config = null;
global.authenticated = false;
global.user = null;
global.tray = null;
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
// Old version has old settings config
if (fs.existsSync(appData+"/config.json")) {
  var tempConfig = require(appData+"/config.json");
  if (typeof tempConfig.settings == undefined) {
    fs.writeFileSync(appData+"/config.json", json);
  }
}
require("./js/ipcHandler");

app.whenReady().then(() => {
  tray = new Tray(__dirname + '/html/icon.png');
  const contextMenu = Menu.buildFromTemplate([
  {
    label: "Open App",
    click() { mainWindow.show() }
  },
  {
    label: 'Quit',
    click() { 
      app.isQuiting = true;
      app.quit(); }
  }
]);
tray.setToolTip('OptikServers Miner');
tray.setContextMenu(contextMenu);
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
  mainWindow.on('close', async (event) => {
    if(!app.isQuiting){
        event.preventDefault();
        mainWindow.hide();
        new Notification({ title: "Minimised to tray", body: "The optikservers application has been minimised to tray."}).show();
    }
    return false;
})
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


app.on('before-quit', function () {
  isQuiting = true;
});
