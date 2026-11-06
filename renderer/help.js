const api = window.sneak || { closeSelf: () => {} };
try { document.documentElement.dataset.theme = JSON.parse(localStorage.getItem('sp.settings')).theme; } catch {}

const tabs = document.querySelectorAll('[role=tab]');
tabs.forEach((t) => t.onclick = () => tabs.forEach((b) => {
  b.setAttribute('aria-selected', b === t);
  document.getElementById(b.dataset.tab).hidden = b !== t;
}));

document.getElementById('go').onclick = () => api.closeSelf();
addEventListener('keydown', (e) => e.key === 'Escape' && api.closeSelf());
