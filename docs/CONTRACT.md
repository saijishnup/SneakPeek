# SneakPeek build contract (shared by all build agents)

Spec: docs/PRD.html. GOTCHA: never declare top-level `sneak` in page scripts (clashes with contextBridge global); use `const api = window.sneak || stub`. Voice mode is OUT. Electron, plain HTML/CSS/vanilla JS, no bundler, no framework.
Dependencies are already installed (do not add new ones without need): electron, electron-builder, playwright-core,
pdfjs-dist, mammoth, @fontsource-variable/plus-jakarta-sans, @fontsource-variable/inter.

## File ownership
| Owner | Files |
|---|---|
| Shell agent | main.js, preload.js, assets/icon.png (+ any generated icons), test/smoke.mjs |
| Importer agent | src/importer.js, test/importer.test.js, test/fixtures/* |
| UI agent | renderer/** (index.html, style.css, app.js, settings.html, settings.js, help.html, help.js, fonts) |
Never edit another agent's files. package.json is owned by the orchestrator: do not edit it.

## Windows (created by main.js)
All windows: frame:false, alwaysOnTop level 'screen-saver', skipTaskbar:true, maximizable:false, fullscreenable:false,
setContentProtection(true) (re-applied after every show()), setVisibleOnAllWorkspaces(true),
NOT transparent. Use backgroundMaterial:'acrylic' (Win11 frosted glass); backgroundColor '#00000000' is not needed.
contextIsolation:true, nodeIntegration:false, preload: preload.js. Pages may use `-webkit-app-region: drag` for moving.
The OS draws rounded corners; pages must NOT draw their own outer border-radius/shadow (fill the whole window).

| Window | Page | Size | Notes |
|---|---|---|---|
| main | renderer/index.html | pill 440x112 x scale (min 240x72), edit 760x300, mini 240x44 | resizable; position persisted to userData/bounds.json; re-pinned on top on blur + every 2s |
| settings | renderer/settings.html | 300x420 | pre-created hidden at startup, shown after ready-to-show; hides on blur |
| help | renderer/help.html | 720x460 | created on demand, shown on ready-to-show; only via Help button / tray |

## preload API: `window.sneak`
```js
sneak.resize(mode)          // 'pill' | 'edit' | 'mini'  -> main resizes main window (keeps top-center anchored)
sneak.setScale(n)           // 0.6..1.4 -> pill size = 440x112 * n
sneak.setOpacity(n)         // 0.3..1 -> main window setOpacity
sneak.openFile()            // Promise<{ name, text } | { error } | null>  (dialog + importer in main; null = cancelled)
sneak.openSettings()        // toggle settings window
sneak.openHelp()
sneak.closeSelf()           // close/hide the calling window (help, settings)
sneak.hide()                // hide main window (restore from tray)
sneak.quit()
sneak.onToggleScroll(cb)    // fired by global shortcut Ctrl+Alt+Space
```
IPC channels: 'resize','set-opacity','open-file','open-settings','open-help','close-self','hide','quit' (renderer->main),
'toggle-scroll' (main->renderer).

## Shared state (no IPC): localStorage, same file:// origin for all windows
- `sp.script`: string
- `sp.settings`: JSON `{ scale:1, wpm:140, fontSize:15, font:'Plus Jakarta Sans', theme:'light', opacity:1, width:'full' }`
Windows listen to the `storage` event to pick up changes made in other windows (settings -> main live update).
Main renderer calls `sneak.setOpacity(settings.opacity)` when opacity changes.

## Importer (main process, CommonJS)
`const { importFile } = require('./src/importer')`
`importFile(path: string): Promise<string>` returns clean plain text (paragraphs separated by one blank line,
no hyphenation artifacts, trimmed). Supports .txt (utf8, strip BOM), .pdf (pdfjs-dist legacy build, dynamic import),
.docx (mammoth.extractRawText). Throws Error with a user-facing message for: unsupported extension,
PDF with no extractable text ("This PDF has no text layer (scanned?)"), unreadable file.

## Shortcuts (renderer, main window focused)
Space start/stop scroll · + / - speed ±10 (60..300) · Ctrl+R restart · Esc leave edit / collapse to mini (Esc or click in mini restores pill) ·
Ctrl+F find in edit mode (textarea search, simple) · double-click script area = edit mode.
Global (main process): Ctrl+Alt+Space -> 'toggle-scroll'.

## Design tokens
Light tint over acrylic: rgba(246,245,241,0.82); dark: rgba(24,24,26,0.82). Ink #26262a / #ecebe6. Muted #77756f.
Green #2f9e5b (active/scrolling), red #d64545 (quit). Font Plus Jakarta Sans (bundled via @fontsource-variable, offline).
Inline SVG icons, 1.6 stroke. No gradients except bottom fade mask on script. No glow, no emoji.
Logo: assets/brand/logo-mark.png (bars), assets/brand/logo-wordmark.png (with name); sources in assets/brand/source/. Icons: assets/icon.png (1024, builder), icon-256.png (windows), tray.png/@2x/@3x. Product name "SneakPeek", tagline "Just Right There!" (italic).
