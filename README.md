<p align="center">
  <img src="assets/brand/logo-wordmark.png" alt="SneakPeek" width="220" />
</p>

# SneakPeek

*Just Right There!*

[![Windows 10 2004+](https://img.shields.io/badge/windows-10%202004%2B%20%7C%2011-f6f5f3?style=flat-square&labelColor=1c1b19)](#install)
[![Electron 45](https://img.shields.io/badge/electron-45-e7e5e1?style=flat-square&labelColor=1c1b19)](https://www.electronjs.org/)
[![Hidden from screen share](https://img.shields.io/badge/screen%20share-hidden-2f9e5b?style=flat-square&labelColor=1c1b19)](#how-it-hides)
[![Runs offline](https://img.shields.io/badge/runs-100%25%20offline-d9d6d0?style=flat-square&labelColor=1c1b19)](#features)
[![Release](https://img.shields.io/github/v/release/saijishnup/SneakPeek?style=flat-square&labelColor=1c1b19&color=f6f5f3)](https://github.com/saijishnup/SneakPeek/releases)

---

## What it is

A small teleprompter pill that sits on top of everything and does not show up in screen shares, screenshots or recordings. Read your script on a Meet call without anyone seeing it.

<p align="center">
  <img src="docs/screenshots/read.png" alt="Reading view" width="440" />
</p>

## Features

- **Hidden from capture:** Meet, Zoom, Teams, OBS, PrintScreen, Win+Shift+S, Game Bar.
- **Always on top:** above full-screen apps, re-pins itself if bumped.
- **Auto-scroll:** 30–300 wpm, play button or <kbd>Space</kbd>, global <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Space</kbd>.
- **Import:** TXT, PDF (text layer) and DOCX.
- **Adjustable:** size 60–140%, font 6–40 px, opacity, light/dark, narrow text width.
- **Mini pill:** <kbd>Esc</kbd> collapses it, <kbd>Esc</kbd> again restores.

| Settings | Help |
|---|---|
| <img src="docs/screenshots/settings.png" alt="Settings" width="260" /> | <img src="docs/screenshots/help.png" alt="Help" width="460" /> |

## How it hides

```
BrowserWindow ──► setContentProtection(true)
              ──► SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)
              ──► compositor drops the window from every capture path
```

A phone camera pointed at the screen still sees it.

## Shortcuts

| Key | Action |
|---|---|
| <kbd>Space</kbd> | Start / stop scrolling |
| <kbd>+</kbd> / <kbd>-</kbd> | Speed ±10 wpm |
| <kbd>Ctrl</kbd>+<kbd>R</kbd> | Back to top |
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Space</kbd> | Start / stop from any app |
| Double-click | Edit script |
| <kbd>Esc</kbd> | Leave edit / mini pill |

## Install

Download `SneakPeek Setup x.y.z.exe` from [Releases](https://github.com/saijishnup/SneakPeek/releases) and run it. It installs per user, no admin needed.

## Run from source

```bash
git clone https://github.com/saijishnup/SneakPeek.git
cd SneakPeek
npm install
npm start
```

| Command | Does |
|---|---|
| `npm test` | Importer unit tests |
| `npm run smoke` | Window flags (on top, protected) |
| `npm run e2e` | Drives the real app end to end |
| `npm run dist` | Builds the installer into `dist/` |
