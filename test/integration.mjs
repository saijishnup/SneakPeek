// Launches the real app and drives it end to end. Run: npm run e2e
import { _electron } from 'playwright-core';

const shots = process.env.SHOTS; // optional dir for screenshots
const app = await _electron.launch({ env: { ...process.env, SNEAKPEEK_PROFILE: (await import('node:path')).join((await import('node:os')).tmpdir(), 'sneakpeek-test') }, args: ['.'], timeout: 30000 });
const errors = [];
const watch = (p) => {
  p.on('console', (m) => m.type() === 'error' && errors.push(p.url().split('/').pop() + ': ' + m.text()));
  p.on('pageerror', (e) => errors.push(p.url().split('/').pop() + ' pageerror: ' + e.message));
};
app.on('window', watch);
const main = await app.firstWindow();
watch(main);
const ok = [];
const check = (name, v) => { ok.push(!!v); console.log((v ? 'PASS ' : 'FAIL ') + name); };
const wins = () => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map((w) => ({
  page: w.webContents.getURL().split('/').pop(), visible: w.isVisible(), prot: w.isContentProtected(), top: w.isAlwaysOnTop(), size: w.getContentSize(),
})));
const byPage = async (page) => (await wins()).find((w) => w.page === page);
const pageOf = (name) => app.windows().find((p) => p.url().endsWith(name));

await main.evaluate(() => localStorage.clear());
await main.reload();
await main.waitForTimeout(1500);

check('sneak api exposed (incl. setScale)', await main.evaluate(() => typeof window.sneak?.setScale === 'function'));
check('help NOT auto-opened', !(await byPage('help.html'))?.visible);
check('main window 440x112 at scale 1', String((await byPage('index.html')).size) === '440,112');
check('all windows protected + on top', (await wins()).every((w) => w.prot && w.top));

await main.evaluate(() => localStorage.setItem('sp.script', 'Good morning everyone. Today I want to walk you through the quarterly numbers.\nFirst, revenue grew eighteen percent, mostly from the enterprise tier.\n'.repeat(15)));
await main.reload();
await main.waitForTimeout(800);
if (shots) await main.screenshot({ path: shots + '/read.png' });
await main.click('[aria-label^="Play"], [title^="Play"]');
await main.waitForTimeout(1500);
check('play button scrolls', await main.evaluate(() => document.getElementById('hud').textContent.includes('scrolling')));
await main.keyboard.press('Space');

await main.mouse.dblclick(200, 80);
await main.waitForTimeout(600);
check('edit mode resizes to 760x300', String((await byPage('index.html')).size) === '760,300');
await main.keyboard.press('Escape');
await main.waitForTimeout(600);

await main.evaluate(() => window.sneak.openSettings());
await main.waitForTimeout(1000);
const st = pageOf('settings.html');
check('settings visible', (await byPage('settings.html'))?.visible);
check('settings has content', st && (await st.evaluate(() => document.body.innerText)).includes('Speed'));
if (shots && st) await st.screenshot({ path: shots + '/settings.png' });

await st.evaluate(() => { const s = JSON.parse(localStorage.getItem('sp.settings') || '{}'); s.scale = 0.8; localStorage.setItem('sp.settings', JSON.stringify(s)); });
await main.waitForTimeout(600);
check('scale 0.8 shrinks pill to 352x90', String((await byPage('index.html')).size) === '352,90');

await main.evaluate(() => window.sneak.openHelp());
await main.waitForTimeout(1500);
check('help opens on demand', (await byPage('help.html'))?.visible);
if (shots && pageOf('help.html')) await pageOf('help.html').screenshot({ path: shots + '/help.png' });

check('no console errors', errors.length === 0);
errors.forEach((e) => console.log('  ' + e));
await main.evaluate(() => localStorage.clear());
await app.close();
process.exit(ok.every(Boolean) ? 0 : 1);
