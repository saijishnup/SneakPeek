import { _electron } from 'playwright-core';

const app = await _electron.launch({ env: { ...process.env, SNEAKPEEK_PROFILE: (await import('node:path')).join((await import('node:os')).tmpdir(), 'sneakpeek-test') }, args: ['.'] });
let failed = 0;
try {
  await new Promise(r => setTimeout(r, 1500));
  const r = await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0];
    return {
      count: BrowserWindow.getAllWindows().length,
      onTop: w.isAlwaysOnTop(),
      protected: w.isContentProtected(),
      skipTaskbar: global.sneakFlags?.skipTaskbar === true,
      notMaximizable: !w.isMaximizable(),
    };
  });
  const checks = [
    ['main window exists', r.count >= 1],
    ['isAlwaysOnTop', r.onTop],
    ['isContentProtected', r.protected],
    ['skipTaskbar', r.skipTaskbar],
    ['not maximizable', r.notMaximizable],
  ];
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
    if (!ok) failed++;
  }
} catch (e) {
  console.log('FAIL', e.message);
  failed++;
} finally {
  await app.close();
}
process.exit(failed ? 1 : 0);
