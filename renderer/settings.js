const noop = () => {};
const api = window.sneak || { openHelp: noop, closeSelf: noop, quit: noop };
const $ = (id) => document.getElementById(id);
const DEF = { wpm: 140, fontSize: 15, font: 'Plus Jakarta Sans', theme: 'light', opacity: 1, width: 'full', scale: 1 };
const load = () => { try { return { ...DEF, ...JSON.parse(localStorage.getItem('sp.settings')) }; } catch { return { ...DEF }; } };
let S = load();

function render() {
  document.documentElement.dataset.theme = S.theme;
  $('scale').value = Math.round(S.scale * 100); $('scVal').textContent = Math.round(S.scale * 100) + '%';
  $('wpm').value = S.wpm; $('wpmVal').textContent = S.wpm + ' wpm';
  $('fs').textContent = S.fontSize;
  $('font').value = S.font;
  $('opacity').value = Math.round(S.opacity * 100); $('opVal').textContent = Math.round(S.opacity * 100) + '%';
  document.querySelectorAll('.seg').forEach((seg) =>
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.value === S[seg.dataset.key])));
}

function set(k, v) { S[k] = v; localStorage.setItem('sp.settings', JSON.stringify(S)); render(); }

$('scale').oninput = (e) => set('scale', e.target.value / 100);
$('wpm').oninput = (e) => set('wpm', +e.target.value);
$('opacity').oninput = (e) => set('opacity', e.target.value / 100);
$('font').onchange = (e) => set('font', e.target.value);
$('fsDown').onclick = () => set('fontSize', Math.max(6, S.fontSize - 1));
$('fsUp').onclick = () => set('fontSize', Math.min(40, S.fontSize + 1));
document.querySelectorAll('.seg').forEach((seg) =>
  seg.onclick = (e) => e.target.value && set(seg.dataset.key, e.target.value));
$('help').onclick = () => api.openHelp();
$('quit').onclick = () => api.quit();
addEventListener('keydown', (e) => e.key === 'Escape' && api.closeSelf());
addEventListener('storage', (e) => e.key === 'sp.settings' && (S = load(), render()));
render();
