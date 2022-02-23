const { Tray, Menu } = require("electron");


const tray = new Tray(__dirname + '/../html/icon.png');
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