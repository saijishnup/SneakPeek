# Findings

## Notch (trynotch.net, Socia-dev/Notch releases v1.3.3)
- Current app = Electron (electron-builder latest.yml artifacts). v1.0 beta open source: github.com/SultanAlshehhi/Notch (PyQt5 + Vosk + thefuzz).
- Hiding: SetWindowDisplayAffinity WDA_EXCLUDEFROMCAPTURE (0x11), fallback WDA_MONITOR.
- Window: frameless, always on top, tool window (no taskbar), rounded pill, fade-in 400ms.
- Double-click toggles edit mode: window grows ~860x320, mic stops, text editable; exit reloads matcher + resumes listening.
- No click-through. Drag moves window. Right-click menu.
- Voice follow matcher: last 1-5 spoken words vs window [pos-2, pos+30]; fuzz ratio >= 55; single words need >=3 chars and >=65% of script word length; forward only; jump cap 5 (partial) / 12-20 (final); catch-up scan 150 words ahead at >=65. Spoken text bright, rest dim; keep ~4 lines below current word; auto-follow pauses 2.5s after manual wheel.
- Manual scroll: (wpm/60)*12 px/s.

## Offline STT
- Vosk small en-us 0.15 (~40MB), vosk-browser WASM worker = best fit, streaming partials.
- sherpa-onnx = better accuracy, alt. whisper.cpp not streaming. Web Speech API dead in Electron.

## Content protection
- Electron setContentProtection(true) = WDA_EXCLUDEFROMCAPTURE on Win10 2004+.
- Covers DXGI dup, Windows.Graphics.Capture, GDI: Meet/Chrome share, Snipping Tool, Win+Shift+S, PrtSc, OBS. Meet not directly confirmed, must test.
- Gotchas: use recent Electron (PR #47020 fix, May 2025); re-call after show(); transparent window hide/show bugs (#2170). Phone camera still sees it.
