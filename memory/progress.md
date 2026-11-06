# Progress Log

## 2026-11-07
- Env: Windows 11, Node v24.15.0, npm 12.0.2, git 2.51.1, no Rust/cargo.
- Project dir empty at start.
- Created memory/task_plan.md, findings.md, progress.md (skill init script missing, manual copy).
- Research subagent dispatched for Notch app behavior + capture-exclusion facts + offline STT options.
- User dropped voice mode. PRD rewritten as docs/PRD.html with live mockups. CLAUDE.md created. Added global Ctrl+Alt+Space scroll toggle + Text width setting (pending approval).
- Renamed SneakPeek (tagline 'Just Right There!'), logo assets/logo.svg, Help window added to v1. docs/CONTRACT.md = build contract. Deps installed (electron 45.2.3, pdfjs-dist 6.5, mammoth, playwright-core, fontsource). 3 build agents running in parallel: shell, importer, UI.
- Build done. Shell (main.js, preload.js, tray, bounds, Ctrl+Alt+Space), importer (src/importer.js, 6 tests), UI (renderer/*, unslop pass). Acrylic + content protection OK.
- Tests: npm test 6/6, npm run smoke 5/5, npm run e2e 7/7 (help on first launch, scroll, edit resize, settings, no console errors).
- Packaged: dist/SneakPeek 1.0.0.exe (portable, ~125MB). Packaged importer verified for pdf/docx/txt.
- Next: user runs PRD section 7 acceptance tests (Meet share, screenshots, OBS).

## 2026-11-07 round 2 (user feedback)
- Feedback: too big, settings blank, slow start, not always on top, autoscroll not working, new logos, help only on demand, smooth animation.
- Diagnosis: capture hiding verified live (GetWindowDisplayAffinity=0x11, absent from GDI capture). Topmost flag set but can be bumped. Slow start = portable exe unpacking 125MB each launch. Settings blank = window shown before page loaded. Autoscroll = Space needs focus, no visible button.
- Fixes: pill 440x112 + Size slider (setScale IPC), re-pin on blur + 2s loop, settings pre-created hidden, help on demand + ready-to-show, play button, animations, new logo-mark/wordmark SVGs + icon.png, NSIS one-click installer.
- Tests: e2e 11/11, unit 6/6, smoke 5/5. Installer: dist/SneakPeek Setup 1.0.0.exe.
