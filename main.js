const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, globalShortcut, screen, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// Tests run with their own profile so they never touch (or get blocked by) the real install.
if (process.env.SNEAKPEEK_PROFILE) app.setPath('userData', process.env.SNEAKPEEK_PROFILE);
if (!app.requestSingleInstanceLock()) app.quit();

const BASE = [440, 112];
const SIZES = { pill: [...BASE], edit: [760, 300], mini: [240, 44] };
const ICON = path.join(__dirname, 'assets', 'icon-256.png');
const TRAY = path.join(__dirname, 'assets', 'tray.png'); // Electron picks tray@2x/@3x on HiDPI
let main, settings, help, tray, mode = 'pill', saveTimer;
global.sneakFlags = { skipTaskbar: true }; // no getter for skipTaskbar; smoke test reads this

const boundsFile = () => path.join(app.getPath('userData'), 'bounds.json');

function make(page, opts) {
  const win = new BrowserWindow({
    frame: false, show: false, alwaysOnTop: true, skipTaskbar: true,
    maximizable: false, fullscreenable: false, backgroundMaterial: 'acrylic', icon: ICON,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
    ...opts,
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
  win.setContentProtection(true);
  win.on('show', () => win.setContentProtection(true));
  // Other topmost apps (taskbar, overlays) can bump us; re-pin when we lose focus or the flag drops.
  const pin = () => { if (!win.isDestroyed() && win.isVisible()) { win.setAlwaysOnTop(true, 'screen-saver'); win.moveTop(); } };
  win.on('blur', pin);
  win.on('always-on-top-changed', (_e, on) => { if (!on) pin(); });
  win.pin = pin;
  // external links (GitHub) open in the default browser, never inside the overlay
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https:/.test(url)) shell.openExternal(url); } });
  win.loadFile(path.join(__dirname, 'renderer', page)).catch(e => console.error(`load ${page} failed:`, e.message));
  return win;
}

function show(win) {
  win.show();
  win.setContentProtection(true);
}

function clampToWorkArea(b) {
  const wa = screen.getDisplayMatching(b).workArea;
  const width = Math.min(b.width, wa.width), height = Math.min(b.height, wa.height);
  return {
    width, height,
    x: Math.round(Math.max(wa.x, Math.min(b.x, wa.x + wa.width - width))),
    y: Math.round(Math.max(wa.y, Math.min(b.y, wa.y + wa.height - height))),
  };
}

function createMain() {
  let saved = null;
  try { saved = JSON.parse(fs.readFileSync(boundsFile(), 'utf8')); } catch {}
  const wa = screen.getPrimaryDisplay().workArea;
  const [w, h] = SIZES.pill;
  const b = saved ? clampToWorkArea({ x: saved.x, y: saved.y, width: w, height: h }) : { width: w, height: h, x: Math.round(wa.x + (wa.width - w) / 2), y: wa.y };
  main = make('index.html', { ...b, minWidth: 240, minHeight: 72, resizable: true, useContentSize: true });
  main.setContentBounds(b); // ctor size drifts ~2px at fractional DPI; this path is exact
  main.once('ready-to-show', () => { show(main); setTimeout(prepSettings, 300); });
  // ponytail: 2s re-pin loop, catches z-order steals that fire no event; drop if blur/changed events prove enough
  setInterval(() => main.pin(), 2000);
  const persist = () => {
    if (mode !== 'pill') return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (main.isDestroyed()) return;
      const { x, y } = main.getContentBounds();
      fs.writeFile(boundsFile(), JSON.stringify({ x, y }), () => {});
    }, 400);
  };
  main.on('move', persist);
  main.on('resize', persist);
  main.on('closed', () => app.quit());
}

// Settings is created hidden right after startup so opening it is instant and never shows a blank page.
function prepSettings() {
  if (settings && !settings.isDestroyed()) return settings;
  settings = make('settings.html', { width: 300, height: 420, resizable: false, useContentSize: true });
  settings.ready = new Promise(r => settings.once('ready-to-show', r));
  settings.on('blur', () => settings.hide());
  return settings;
}

async function toggleSettings() {
  if (settings && !settings.isDestroyed() && settings.isVisible()) return settings.hide();
  prepSettings();
  await settings.ready;
  const m = main.getBounds();
  settings.setContentBounds(clampToWorkArea({ x: m.x + m.width + 8, y: m.y, width: 300, height: 420 }));
  show(settings);
}

function openHelp() {
  if (help && !help.isDestroyed()) { help.center(); return show(help); }
  help = make('help.html', { width: 720, height: 460, resizable: false, useContentSize: true });
  help.once('ready-to-show', () => { help.center(); show(help); });
}

function toggleMain() {
  main.isVisible() ? main.hide() : show(main);
}

app.on('second-instance', () => main && show(main));

app.whenReady().then(() => {
  createMain();

  tray = new Tray(TRAY);
  tray.setToolTip('SneakPeek');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show/Hide', click: toggleMain },
    { label: 'Help', click: openHelp },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]));
  tray.on('click', toggleMain);

  globalShortcut.register('Ctrl+Alt+Space', () => main.webContents.send('toggle-scroll'));

  ipcMain.on('resize', (_e, m) => {
    if (!SIZES[m]) return;
    const prev = main.getContentBounds();
    // leaving pill: remember its size so returning restores the user's pill
    if (mode === 'pill') SIZES.pill = [prev.width, prev.height];
    mode = m;
    const [width, height] = SIZES[m];
    main.setMinimumSize(...(m === 'mini' ? SIZES.mini : [240, 72]));
    main.setContentBounds(clampToWorkArea({ width, height, x: Math.round(prev.x + prev.width / 2 - width / 2), y: prev.y }));
  });
  ipcMain.on('set-scale', (_e, n) => {
    n = Math.min(1.4, Math.max(0.6, Number(n) || 1));
    SIZES.pill = BASE.map(v => Math.round(v * n));
    if (mode !== 'pill') return;
    const prev = main.getContentBounds(), [width, height] = SIZES.pill;
    main.setContentBounds(clampToWorkArea({ width, height, x: Math.round(prev.x + prev.width / 2 - width / 2), y: prev.y }));
  });
  ipcMain.on('set-opacity', (_e, n) => main.setOpacity(Math.min(1, Math.max(0.3, Number(n) || 1))));
  ipcMain.on('open-settings', toggleSettings);
  ipcMain.on('open-help', openHelp);
  ipcMain.on('close-self', e => BrowserWindow.fromWebContents(e.sender)?.hide());
  ipcMain.on('hide', () => main.hide());
  ipcMain.on('quit', () => app.quit());
  ipcMain.handle('open-file', async () => {
    const r = await dialog.showOpenDialog(main, {
      properties: ['openFile'],
      filters: [{ name: 'Scripts', extensions: ['txt', 'pdf', 'docx'] }],
    });
    if (r.canceled || !r.filePaths[0]) return null;
    const file = r.filePaths[0];
    try {
      return { name: path.basename(file), text: await require('./src/importer').importFile(file) };
    } catch (e) {
      return { error: e.message };
    }
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
