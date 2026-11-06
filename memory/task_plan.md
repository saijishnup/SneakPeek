# Task Plan: Personal Notch (teleprompter overlay) clone

## Goal
Windows desktop teleprompter overlay like "Notch": always on top, invisible to screen share / screenshots, voice-follow + manual scroll. Ship v1 fast.

## Current Phase
Phase 1

## Phases

### Phase 1: Research + PRD
- [ ] Research Notch app (subagent)
- [ ] Write docs/PRD.html (arch, stack, design, mockup, tests)
- [ ] User approves PRD
**Status:** complete

### Phase 2: Build (subagents, test each module)
- [ ] Window shell: always-on-top, content protection, frameless, resize, pill
- [ ] Script view + edit + import (txt/pdf/docx)
- [ ] Manual mode scroll + speed
- [x] Voice mode: DROPPED by user (2026-11-07), maybe later
- [ ] Settings panel + persistence
- [ ] Shortcuts (local + global mic mute)
**Status:** complete

### Phase 3: User testing
- [ ] User runs acceptance tests (Meet share, screenshots, OBS)
**Status:** complete

### Phase 4: Fix + confirm v1
**Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Electron | Node 24 present, no Rust. setContentProtection = WDA_EXCLUDEFROMCAPTURE |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| renderer `const sneak` clashed with contextBridge global (SyntaxError, app.js dead) | 1 | renamed local to `api` |
| npm test `node --test test/` MODULE_NOT_FOUND on Node 24 | 1 | glob "test/**/*.test.*" |
| planning-with-files init-session.ps1 missing | 1 | Created files manually |
