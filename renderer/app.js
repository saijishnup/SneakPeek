// Main window: read / edit / mini states, scroll loop, shortcuts.
const noop = () => {};
const api = window.sneak || { resize: noop, setScale: noop, setOpacity: noop, openFile: async () => null, openSettings: noop,
  openHelp: noop, closeSelf: noop, hide: noop, quit: noop, onToggleScroll: noop };

const $ = (id) => document.getElementById(id);
const DEF = { wpm: 140, fontSize: 15, font: 'Plus Jakarta Sans', theme: 'light', opacity: 1, width: 'full', scale: 1 };
const FONTS = { 'Plus Jakarta Sans': '"Plus Jakarta Sans"', Inter: '"Inter"', System: 'system-ui' };
const loadSettings = () => { try { return { ...DEF, ...JSON.parse(localStorage.getItem('sp.settings')) }; } catch { return { ...DEF }; } };

let S = loadSettings();
let mode = 'read';           // 'read' | 'edit' | 'mini'
let pos = 0, playing = false, last = 0;
let tops = [], maxP = 0, lineAt = 0, active = -2;   // cached layout: read in measure(), never per frame
const inner = $('inner'), stage = $('stage'), ta = $('ta');

function applySettings() {
  const r = document.documentElement;
  r.dataset.theme = S.theme;
  r.dataset.width = S.width;
  r.style.setProperty('--fs', S.fontSize + 'px');
  r.style.setProperty('--font', FONTS[S.font] || FONTS['Plus Jakarta Sans']);
  api.setOpacity(S.opacity);
  api.setScale(Math.min(1.4, Math.max(0.6, +S.scale || 1)));
  measure(); hud();
}

function saveSettings() { localStorage.setItem('sp.settings', JSON.stringify(S)); }

function renderScript() {
  const text = (localStorage.getItem('sp.script') || '').trim();
  // every non-empty line is a paragraph: works for blank-line and single-newline scripts
  inner.replaceChildren(...text.split(/\n/).map((t) => t.trim()).filter(Boolean).map((t) => {
    const p = document.createElement('p'); p.textContent = t; return p;
  }));
  $('empty').hidden = !!text;
  $('script').hidden = !text;
  if (!text) setPlaying(false);
  active = -2;
  measure();
}

function measure() {
  const ps = inner.children;
  tops = [...ps].map((p) => p.offsetTop);
  const lastP = ps[ps.length - 1];
  // scroll until the last line reaches the top, even when the script fits the stage
  maxP = lastP ? lastP.offsetTop + lastP.offsetHeight - S.fontSize * 1.55 : 0;
  lineAt = stage.clientHeight * 0.4;   // reading line: 40% down the stage
  active = -2;
  draw();
}

function draw() {
  pos = Math.min(Math.max(pos, 0), maxP);
  inner.style.transform = `translate3d(0,${-pos}px,0)`;
  const line = pos + lineAt;
  let i = -1;
  while (i + 1 < tops.length && tops[i + 1] <= line) i++;
  if (i === active) return;
  active = i;
  [...inner.children].forEach((p, k) => p.classList.toggle('past', k <= i));
}

function loop(t) {
  if (!playing) return;
  pos += (S.wpm / 60) * 12 * (S.fontSize / 16) * (t - last) / 1000;
  last = t;
  if (pos >= maxP) setPlaying(false);
  draw();
  requestAnimationFrame(loop);
}

function setPlaying(p) {
  playing = p && mode === 'read' && !$('script').hidden;
  if (playing) {
    if (pos >= maxP) { pos = 0; draw(); }   // play at the end = start over
    last = performance.now(); requestAnimationFrame(loop);
  }
  $('play').classList.toggle('on', playing);
  const lbl = (playing ? 'Pause' : 'Play') + ' (Space)';
  $('play').title = lbl; $('play').setAttribute('aria-label', lbl);
  hud();
}

const toggle = () => { if (mode === 'mini') setMode('read'); setPlaying(!playing); };

function hud() {
  S.wpm = +S.wpm || 140;
  $('hud').innerHTML = `${S.wpm} wpm · ${playing ? '<b>scrolling</b>' : 'paused'}`;
  $('miniTxt').innerHTML = `SneakPeek <span>· ${S.wpm} wpm</span>`;
}

function speed(d) { S.wpm = Math.min(300, Math.max(30, S.wpm + d)); saveSettings(); hud(); }
function restart() { pos = 0; draw(); }

function setMode(m) {
  mode = m;
  for (const v of ['read', 'edit', 'mini']) $(v).hidden = v !== m;
  api.resize(m === 'read' ? 'pill' : m);
  if (m === 'read') requestAnimationFrame(measure);
}

function openEdit() {
  setPlaying(false);
  ta.value = localStorage.getItem('sp.script') || '';
  note('');
  setMode('edit');
  ta.focus();
}

function closeEdit() {
  const old = localStorage.getItem('sp.script') || '';
  if (ta.value !== old) { localStorage.setItem('sp.script', ta.value); pos = 0; }
  $('find').hidden = true;
  setMode('read');
  renderScript();
}

function note(msg, err) { const n = $('note'); n.textContent = msg; n.classList.toggle('err', !!err); }

async function importFile() {
  const res = await api.openFile();
  if (!res) return;
  if (res.error) return note(res.error, true);
  ta.value = res.text;
  note('Imported ' + res.name);
  ta.focus();
}

function findNext() {
  const q = $('q').value.toLowerCase();
  if (!q) return;
  const hay = ta.value.toLowerCase();
  let i = hay.indexOf(q, ta.selectionEnd);
  if (i < 0) i = hay.indexOf(q);
  $('qInfo').textContent = i < 0 ? 'No match' : 'F3 for next match';
  if (i < 0) return;
  ta.focus();   // selection only paints in a focused textarea
  ta.setSelectionRange(i, i + q.length);
}

// ---- events ----
$('hide').onclick = () => api.hide();
$('gear').onclick = () => api.openSettings();
$('play').onclick = toggle;
$('hud').onclick = toggle;
$('restart').onclick = restart;
$('done').onclick = closeEdit;
$('import').onclick = importFile;
$('expand').onclick = (e) => { e.stopPropagation(); setMode('read'); };
$('miniTxt').onclick = () => setMode('read');
stage.ondblclick = openEdit;
stage.addEventListener('wheel', (e) => { pos += e.deltaY * 0.5; draw(); }, { passive: true });
$('q').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); findNext(); } };

const chip = (on) => {
  $('chip').classList.toggle('on', on);
  $('chipText').textContent = on ? 'Active' : 'Click to Activate';
};
addEventListener('focus', () => chip(true));
addEventListener('blur', () => chip(false));

addEventListener('keydown', (e) => {
  const k = e.key, ctrl = e.ctrlKey || e.metaKey;
  if (mode === 'edit') {
    if (ctrl && k.toLowerCase() === 'f') { e.preventDefault(); $('find').hidden = false; $('q').select(); $('q').focus(); }
    else if (k === 'F3') { e.preventDefault(); findNext(); }
    else if (k === 'Escape') { e.preventDefault(); if (!$('find').hidden) { $('find').hidden = true; ta.focus(); } else closeEdit(); }
    return;
  }
  if (mode === 'mini') { if (k === 'Escape') setMode('read'); return; }
  if (ctrl && k.toLowerCase() === 'r') { e.preventDefault(); restart(); }
  else if (k === ' ') { e.preventDefault(); setPlaying(!playing); }
  else if (k === '+' || k === '=') speed(10);
  else if (k === '-' || k === '_') speed(-10);
  else if (k === 'Escape') { setPlaying(false); setMode('mini'); }
});

addEventListener('storage', (e) => {
  if (e.key === 'sp.settings') { S = loadSettings(); applySettings(); }
  else if (e.key === 'sp.script' && mode !== 'edit') renderScript();
});
addEventListener('resize', measure);
api.onToggleScroll(toggle);

renderScript();
applySettings();
setPlaying(false);
chip(document.hasFocus());
document.fonts.ready.then(measure);
