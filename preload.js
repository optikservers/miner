const customTitlebar = require('custom-electron-titlebar')
const { Menu, MenuItem } = require("electron").remote;
const { ipcRenderer } = require("electron");
let titlebar;
window.addEventListener('DOMContentLoaded', () => {
  titlebar = new customTitlebar.Titlebar(); 
  const menu = new Menu();
menu.append(new MenuItem({
	label: 'Item 2',
	submenu: [
		{
			label: 'Subitem 1',
			click: () => console.log('Click on subitem 1')
		},
		{
			type: 'separator'
		}
	]
}));

menu.append(new MenuItem({
	label: 'Account',
	submenu: [
		{
      label: 'Logout',
      type: "normal",
      click: () => logout()
		}
	]
}));

titlebar.updateMenu(menu);
titlebar.updateBackground("#181C27");
titlebar.updateIcon("icon.png");
});


function logout() {
	ipcRenderer.invoke('logout');
}