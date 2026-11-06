const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { importFile } = require('../src/importer');

const fx = (f) => path.join(__dirname, 'fixtures', f);

test('txt: strips BOM, CRLF, collapses spaces and blank runs', async () => {
  assert.strictEqual(await importFile(fx('sample.txt')), 'First line\nof para one.\n\nSecond para.');
});

test('pdf: rebuilds paragraphs and fixes hyphenation', async () => {
  assert.strictEqual(
    await importFile(fx('sample.pdf')),
    'This is the first paragraph, a small example of a teleprompter script.\n\nSecond paragraph here.'
  );
});

test('pdf without text layer throws', async () => {
  await assert.rejects(importFile(fx('empty.pdf')), { message: 'This PDF has no text layer (scanned?)' });
});

test('docx: extracts paragraphs', async () => {
  assert.strictEqual(await importFile(fx('sample.docx')), 'Docx paragraph one.\n\nDocx paragraph two.');
});

test('unsupported extension throws', async () => {
  await assert.rejects(importFile(fx('x.rtf')), /Unsupported file type/);
});

test('missing file throws readable error', async () => {
  await assert.rejects(importFile(fx('nope.txt')), /Could not read file/);
});
