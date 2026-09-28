const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { jsPDF } = require('jspdf');
const { PDFParse } = require('pdf-parse');
const { readPDFDocument } = require('../src/lib/ai/pdf-document.ts');
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const bytes = pdf => Buffer.from(pdf.output('arraybuffer'));
const reply = (content = 'Page 1: Start -> Review -> Done. Review is an approval.', finish_reason = 'stop') =>
  new Response(JSON.stringify({ choices: [{ finish_reason, message: { content } }] }));
process.env.GROQ_API_KEY = 'test-key';
process.env.AI_PROVIDER = 'groq';
let mixed;
test('renders text, vector diagrams and scan-only pages and sends all to vision', async () => {
  const diagram = new jsPDF();
  diagram.rect(60, 20, 80, 20); diagram.text('Start', 90, 32);
  diagram.line(100, 40, 100, 60); diagram.line(100, 60, 97, 55); diagram.line(100, 60, 103, 55);
  diagram.rect(60, 60, 80, 20); diagram.text('Review', 90, 72);
  const parser = new PDFParse({ data: new Uint8Array(bytes(diagram)) });
  let scan;
  try { scan = (await parser.getScreenshot({ desiredWidth: 900 })).pages[0].dataUrl; }
  finally { await parser.destroy(); }
  const pdf = new jsPDF(); pdf.text('Receive request, review, then approve.', 20, 20);
  pdf.addPage(); pdf.rect(30, 30, 80, 20); pdf.text('Vector diagram', 40, 42);
  pdf.addPage(); pdf.addImage(scan, 'PNG', 0, 0, 210, 297);
  pdf.addPage(); pdf.text('Page 4: archive approved request.', 20, 20);
  mixed = bytes(pdf);
  let calls = 0;
  global.fetch = async (_url, options) => {
    const request = JSON.parse(options.body); calls++;
    const content = request.messages[1].content;
    const images = content.filter(part => part.type === 'image_url');
    assert.equal(images.length, calls === 1 ? 3 : 1);
    assert.ok(images.every(part => part.image_url.url.startsWith('data:image/png;base64,')));
    assert.match(request.messages[0].content, /every directed connection/);
    if (calls === 1) {
      assert.match(content[0].text, /Receive request/);
      assert.match(content[2].text, /Vector diagram/);
      assert.match(content[4].text, /PDF page 3/);
      assert.ok(!content[4].text.includes('Review')); // No text layer in scan.
    } else assert.match(content[0].text, /PDF page 4/);
    return reply(`Batch ${calls}: Start -> Review -> Done.`);
  };
  const result = await readPDFDocument(mixed);
  assert.equal(result.pages, 4); assert.equal(calls, 2);
  assert.match(result.text, /Batch 1[\s\S]*Batch 2/);
});
test('rejects invalid and over-limit PDFs before vision', async () => {
  global.fetch = () => { throw Error('must not call'); };
  await assert.rejects(readPDFDocument(Buffer.from('not a pdf')), e => e.status === 422);
  const pdf = new jsPDF(); for (let i = 1; i < 31; i++) pdf.addPage();
  await assert.rejects(readPDFDocument(bytes(pdf)), e => e.status === 413);
});
test('returns quota errors and rejects incomplete or oversized extraction without partial success', async () => {
  global.fetch = async () => new Response('', { status: 429 });
  await assert.rejects(readPDFDocument(mixed), e => e.status === 429);
  global.fetch = async () => reply('Incomplete diagram', 'length');
  await assert.rejects(readPDFDocument(mixed), e => e.status === 422);
  global.fetch = async () => reply('x'.repeat(20001));
  await assert.rejects(readPDFDocument(mixed), e => e.status === 413);
});
test('rejects missing vision configuration and honours cancellation', async () => {
  delete process.env.GROQ_API_KEY;
  await assert.rejects(readPDFDocument(mixed), e => e.status === 503);
  process.env.GROQ_API_KEY = 'test-key';
  const controller = new AbortController(); controller.abort();
  await assert.rejects(readPDFDocument(mixed, controller.signal));
});
(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log('PASS ' + name); }
    catch (error) { failed++; console.error('FAIL ' + name, error); }
  }
  process.exitCode = failed ? 1 : 0;
})();
