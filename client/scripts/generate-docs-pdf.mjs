import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'PROJECT_DOCUMENTATION.md');
const target = path.join(root, 'PROJECT_DOCUMENTATION.pdf');

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT_MARGIN = 48;
const RIGHT_MARGIN = 48;
const TOP_MARGIN = 52;
const BOTTOM_MARGIN = 52;
const MAX_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function estimateTextWidth(text, fontSize) {
  return text.length * fontSize * 0.52;
}

function wrapText(text, fontSize) {
  const stripped = text.trimEnd();
  if (!stripped) return [''];

  const words = stripped.split(/\s+/);
  const lines = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    const trial = `${current} ${word}`;
    if (estimateTextWidth(trial, fontSize) <= MAX_WIDTH) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
    }
  }

  lines.push(current);
  return lines;
}

function tokenizeMarkdown(text) {
  const tokens = [];
  let inCode = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine;

    if (line.startsWith('```')) {
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      tokens.push(['code', line]);
      continue;
    }

    if (!line.trim()) {
      tokens.push(['blank', '']);
      continue;
    }

    if (line.startsWith('### ')) {
      tokens.push(['h3', line.slice(4).trim()]);
      continue;
    }

    if (line.startsWith('## ')) {
      tokens.push(['h2', line.slice(3).trim()]);
      continue;
    }

    if (line.startsWith('# ')) {
      tokens.push(['h1', line.slice(2).trim()]);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      tokens.push(['list', line.trim()]);
      continue;
    }

    if (line.startsWith('- ')) {
      tokens.push(['list', `• ${line.slice(2).trim()}`]);
      continue;
    }

    tokens.push(['p', line]);
  }

  return tokens;
}

function renderLines(tokens) {
  const rendered = [];
  const styles = {
    h1: ['F2', 20, 18],
    h2: ['F2', 14, 14],
    h3: ['F2', 12, 12],
    p: ['F1', 10, 9],
    list: ['F1', 10, 9],
    code: ['F3', 9, 9],
  };

  for (const [kind, value] of tokens) {
    if (kind === 'blank') {
      rendered.push(['blank', 0, '', 8]);
      continue;
    }

    const [fontName, fontSize, spacing] = styles[kind];
    for (const line of wrapText(value, fontSize)) {
      rendered.push([fontName, fontSize, line, spacing]);
    }

    if (kind === 'h1' || kind === 'h2' || kind === 'h3') {
      rendered.push(['blank', 0, '', 4]);
    }
  }

  return rendered;
}

function paginate(renderedLines) {
  const pages = [];
  let currentPage = [];
  let y = PAGE_HEIGHT - TOP_MARGIN;

  for (const entry of renderedLines) {
    const [fontName, fontSize, , spacing] = entry;
    const needed = fontName === 'blank' ? spacing : fontSize + spacing;

    if (y - needed < BOTTOM_MARGIN) {
      pages.push(currentPage);
      currentPage = [];
      y = PAGE_HEIGHT - TOP_MARGIN;
    }

    currentPage.push(entry);
    y -= needed;
  }

  if (currentPage.length) pages.push(currentPage);
  return pages;
}

function buildStream(pageLines) {
  let y = PAGE_HEIGHT - TOP_MARGIN;
  const chunks = [];

  for (const [fontName, fontSize, text, spacing] of pageLines) {
    if (fontName === 'blank') {
      y -= spacing;
      continue;
    }

    y -= fontSize;
    const escaped = escapePdfText(text);
    chunks.push(`BT /${fontName} ${fontSize} Tf 1 0 0 1 ${LEFT_MARGIN} ${y} Tm (${escaped}) Tj ET`);
    y -= spacing;
  }

  return Buffer.from(chunks.join('\n'), 'latin1');
}

function buildPdf(pageStreams) {
  const objects = [];

  const addObject = (buffer) => {
    objects.push(buffer);
    return objects.length;
  };

  const fontRegular = addObject(Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'));
  const fontBold = addObject(Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'));
  const fontCode = addObject(Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'));
  const pagesPlaceholder = addObject(Buffer.from('<<>>'));

  const pageEntries = [];

  for (const stream of pageStreams) {
    const streamObj = addObject(
      Buffer.concat([
        Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, 'latin1'),
        stream,
        Buffer.from('\nendstream', 'latin1'),
      ]),
    );

    const pageObj = addObject(
      Buffer.from(
        `<< /Type /Page /Parent ${pagesPlaceholder} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R /F3 ${fontCode} 0 R >> >> /Contents ${streamObj} 0 R >>`,
        'latin1',
      ),
    );

    pageEntries.push(pageObj);
  }

  objects[pagesPlaceholder - 1] = Buffer.from(
    `<< /Type /Pages /Count ${pageEntries.length} /Kids [${pageEntries.map((id) => `${id} 0 R`).join(' ')}] >>`,
    'latin1',
  );

  const catalog = addObject(Buffer.from(`<< /Type /Catalog /Pages ${pagesPlaceholder} 0 R >>`, 'latin1'));

  const pdf = [];
  pdf.push(Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary'));

  const offsets = [0];
  let currentLength = pdf[0].length;

  objects.forEach((obj, index) => {
    offsets.push(currentLength);
    const block = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`, 'latin1'),
      obj,
      Buffer.from('\nendobj\n', 'latin1'),
    ]);
    pdf.push(block);
    currentLength += block.length;
  });

  const xrefPosition = currentLength;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  pdf.push(Buffer.from(xref, 'latin1'));
  pdf.push(
    Buffer.from(
      `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`,
      'latin1',
    ),
  );

  return Buffer.concat(pdf);
}

const markdown = fs.readFileSync(source, 'utf8');
const tokens = tokenizeMarkdown(markdown);
const renderedLines = renderLines(tokens);
const pages = paginate(renderedLines);
const streams = pages.map(buildStream);

fs.writeFileSync(target, buildPdf(streams));
console.log(`Created ${target}`);
