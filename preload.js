const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sneak', {
  resize: mode => ipcRenderer.send('resize', mode),
  setScale: n => ipcRenderer.send('set-scale', n),
  setOpacity: n => ipcRenderer.send('set-opacity', n),
  openFile: () => ipcRenderer.invoke('open-file'),
  openSettings: () => ipcRenderer.send('open-settings'),
  openHelp: () => ipcRenderer.send('open-help'),
  closeSelf: () => ipcRenderer.send('close-self'),
  hide: () => ipcRenderer.send('hide'),
  quit: () => ipcRenderer.send('quit'),
  onToggleScroll: cb => ipcRenderer.on('toggle-scroll', () => cb()),
});
