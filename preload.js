const customTitlebar = require('custom-electron-titlebar')
const { Menu, MenuItem } = require("electron").remote;
const { ipcRenderer } = require("electron");
let titlebar;
window.addEventListener('DOMContentLoaded', () => {
  titlebar = new customTitlebar.Titlebar(); 
  const menu = new Menu();

menu.append(new MenuItem({
	label: 'Account',
    submenu: [
		{
		  label: 'Settings',
		  click: async () => {
			  settings();
		  }
		},
		{
		  label: 'Logout',
		  click: async () => {
			  logout();
		  }
		}
		  
		
	  ]
}));


titlebar.updateMenu(menu);
titlebar.updateBackground("#181C27");
});


function logout() {
	ipcRenderer.invoke('logout');
}
function settings(){
	ipcRenderer.invoke("settings");
}
function login(uid) {
	ipcRenderer.invoke("login", uid);
}