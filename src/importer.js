const fs = require('node:fs/promises');
const path = require('node:path');

// Merge lines into one paragraph, undoing end-of-line hyphenation ("exam-" + "ple").
const joinLines = (lines) =>
  lines.reduce((acc, l) => (/[a-z]-$/i.test(acc) && /^[a-z]/.test(l) ? acc.slice(0, -1) + l : acc ? acc + ' ' + l : l), '');

const clean = (text) =>
  text
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n\n')
    .trim();

async function pdfText(buf) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(buf), disableWorker: true, isEvalSupported: false, verbosity: 0 });
  const doc = await task.promise;
  const paras = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const { items } = await (await doc.getPage(p)).getTextContent();
    // Rebuild lines: [{ y, h, text }]
    const lines = [];
    let cur = null;
    for (const it of items) {
      const y = it.transform[5], h = it.height || Math.abs(it.transform[3]) || 12;
      if (!cur || (Math.abs(y - cur.y) > h / 2 && it.str.trim())) lines.push((cur = { y, h, text: '' }));
      cur.text += it.str;
      if (it.hasEOL) cur = null;
    }
    // Group lines into paragraphs by vertical gap.
    let para = [], prev = null;
    for (const l of lines) {
      const t = l.text.trim();
      if (!t) continue;
      if (prev && prev.y - l.y > prev.h * 1.6) paras.push(joinLines(para)), (para = []);
      para.push(t);
      prev = l;
    }
    if (para.length) paras.push(joinLines(para));
  }
  await task.destroy();
  if (!paras.join('').trim()) throw new Error('This PDF has no text layer (scanned?)');
  return paras.join('\n\n');
}

async function importFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (!['.txt', '.pdf', '.docx'].includes(ext)) throw new Error(`Unsupported file type: ${ext || 'none'}. Use .txt, .pdf or .docx.`);
  let buf;
  try {
    buf = await fs.readFile(file);
  } catch {
    throw new Error(`Could not read file: ${path.basename(file)}`);
  }
  try {
    if (ext === '.txt') return clean(buf.toString('utf8'));
    if (ext === '.pdf') return clean(await pdfText(buf));
    const { value } = await require('mammoth').extractRawText({ buffer: buf });
    return clean(value);
  } catch (e) {
    if (e.message.startsWith("This PDF")) throw e;
    throw new Error(`Could not read file: ${path.basename(file)} (damaged or not a valid ${ext.slice(1).toUpperCase()})`);
  }
}

module.exports = { importFile };
