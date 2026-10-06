const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
require.extensions['.ts'] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  module._compile(code, filename);
};
const originalLoad = Module._load;
let db;
let userId = "test-user";
Module._load = function (id, parent, isMain) {
  if (id === '@/lib/auth') return { getUser: async () => ({ id: userId }), authorizeProcess: async () => null };
  if (id === '@/lib/db/prisma') return { get prisma() { return db; } };
  if (id.startsWith('@/')) id = path.join(__dirname, '../src', id.slice(2));
  return originalLoad.call(this, id, parent, isMain);
};
const { parseProcessData, parseAIResponse, AIServiceError } = require('../src/lib/ai/validation.ts');
const { GroqAIProcessService } = require('../src/lib/ai/groq-process-service.ts');
const factory = require('../src/lib/ai/process-service.ts');
const graph = {
  nodes: [
    { id: 'start', type: 'start', label: 'Start', position: { x: 100, y: 200 } },
    { id: 'end', type: 'end', label: 'Done', position: { x: 100, y: 400 } }
  ], edges: [{ id: 'e1', source: 'start', target: 'end' }]
};
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const success = (body, finish = 'stop') => new Response(JSON.stringify({ choices: [{ finish_reason: finish, message: { content: JSON.stringify(body) } }] }));
const service = new GroqAIProcessService();
test('rejects invalid node types, duplicate IDs, dangling edges, and nonfinite coordinates', () => {
  for (const mutate of [
    g => g.nodes[0].type = 'script', g => g.nodes[1].id = 'start',
    g => g.edges[0].target = 'missing', g => g.nodes[0].position.x = Infinity
  ]) { const g = structuredClone(graph); mutate(g); assert.throws(() => parseProcessData(g)); }
});
test('accepts clarification replies but rejects empty generated graphs and invalid suggestions', () => {
  assert.equal(parseAIResponse({ responseMessage: 'Which manager?', processUpdate: null }).processUpdate, undefined);
  assert.throws(() => parseAIResponse({ responseMessage: 'Done', processUpdate: { nodes: [], edges: [] } }));
  assert.throws(() => parseAIResponse({ responseMessage: 'Done', suggestedPrompts: [123] }));
});
test('missing key fails before any provider call', async () => {
  delete process.env.GROQ_API_KEY;
  global.fetch = () => { throw Error('must not call'); };
  await assert.rejects(service.sendMessage('p', 'Create a workflow', graph), e => e.status === 503);
});
test('sends server credentials, current graph, and bounded conversation; preserves positions', async () => {
  process.env.GROQ_API_KEY = 'test-only-key';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer test-only-key');
    const body = JSON.parse(options.body);
    assert.equal(body.response_format.type, 'json_object');
    assert.equal(body.messages.length, 10);
    assert.deepEqual(JSON.parse(body.messages.at(-1).content).currentProcess, { ...graph, nodes: graph.nodes.map(({ position, ...node }) => node) });
    const changed = structuredClone(graph); changed.nodes[0].label = 'Receive order';
    changed.nodes.forEach(n => delete n.position);
    return success({ responseMessage: 'Updated', processUpdate: changed });
  };
  const result = await service.sendMessage('p', 'Rename start', graph, Array.from({ length: 12 }, () => ({ role: 'user', content: 'Previous request' })));
  assert.equal(result.processUpdate.nodes[0].label, 'Receive order');
  assert.deepEqual(result.processUpdate.nodes[0].position, graph.nodes[0].position);
});
test('lays out newly generated graphs', async () => {
  global.fetch = async () => success({ responseMessage: 'Created', processUpdate: graph });
  const result = await service.sendMessage('p', 'Create workflow', { nodes: [], edges: [] });
  assert.ok(result.processUpdate.nodes.every(n => Number.isFinite(n.position.x) && Number.isFinite(n.position.y)));
  assert.notEqual(result.processUpdate.nodes[0].position.y, result.processUpdate.nodes[1].position.y);
});
test('maps quota, credentials, timeout, malformed JSON, and truncated output to safe errors', async () => {
  for (const [status, expected] of [[429, 429], [401, 503], [403, 503], [500, 502]]) {
    global.fetch = async () => new Response('secret provider detail', { status });
    await assert.rejects(service.sendMessage('p', 'Edit', graph), e => e.status === expected && !e.message.includes('secret'));
  }
  global.fetch = async () => { const e = Error(); e.name = 'TimeoutError'; throw e; };
  await assert.rejects(service.sendMessage('p', 'Edit', graph), e => e.status === 504);
  global.fetch = async () => new Response('{"choices":[{"finish_reason":"stop","message":{"content":"bad json"}}]}');
  await assert.rejects(service.sendMessage('p', 'Edit', graph), e => e.status === 502);
  global.fetch = async () => success({ responseMessage: 'Done', processUpdate: graph }, 'length');
  await assert.rejects(service.sendMessage('p', 'Edit', graph), e => e.status === 502);
});
let processRecord, writes, providerCalls;
function resetDb() {
  processRecord = { id: 'p', status: 'Draft', currentVersionId: 'v1', versions: [{ id: 'v1', processData: JSON.stringify(graph) }] };
  writes = []; providerCalls = 0;
  db = {
    process: { findUnique: async () => processRecord, findFirst: async () => ({ id: 'p' }) },
    processMessage: { findMany: async () => [], create: async ({ data }) => { writes.push(data); return data; } },
    processVersion: { updateMany: async ({ data }) => { writes.push(data); return { count: 1 }; } },
    $transaction: async fn => fn(db),
  };
}
const { POST } = require('../src/app/api/ai/process-message/route.ts');
const request = (body) => new Request('http://localhost/api/ai/process-message', { method: 'POST', body: JSON.stringify(body) });
const body = { processId: 'p', message: 'Create a process', currentProcess: graph };
test('API rejects malformed requests, missing processes and finalized processes without AI calls', async () => {
  resetDb(); factory.setAIProcessService({ sendMessage: async () => { providerCalls++; return {}; } });
  assert.equal((await POST(request({ ...body, message: 42 }))).status, 400);
  assert.equal((await POST(request({ ...body, currentProcess: {} }))).status, 400);
  processRecord = null; assert.equal((await POST(request(body))).status, 404);
  resetDb(); processRecord.status = 'Finalized'; assert.equal((await POST(request(body))).status, 409);
  assert.equal(providerCalls, 0); assert.equal(writes.length, 0);
});
test('API saves a successful graph and both messages', async () => {
  resetDb(); factory.setAIProcessService({ sendMessage: async () => ({ responseMessage: 'Done', processUpdate: graph }) });
  assert.equal((await POST(request(body))).status, 200);
  assert.equal(writes.length, 3);
  assert.deepEqual(writes.slice(1).map(w => w.senderType), ['USER', 'AI']);
});
test('API leaves data untouched on provider failure and releases pending lock', async () => {
  resetDb(); factory.setAIProcessService({ sendMessage: async () => { throw new AIServiceError('Quota reached', 429); } });
  assert.equal((await POST(request(body))).status, 429); assert.equal(writes.length, 0);
  factory.setAIProcessService({ sendMessage: async () => ({ responseMessage: 'Which team?' }) });
  assert.equal((await POST(request(body))).status, 200); assert.equal(writes.length, 2);
});
test('API detects concurrent diagram changes before saving messages', async () => {
  resetDb(); db.processVersion.updateMany = async () => ({ count: 0 });
  factory.setAIProcessService({ sendMessage: async () => ({ responseMessage: 'Done', processUpdate: graph }) });
  assert.equal((await POST(request(body))).status, 409); assert.equal(writes.length, 0);
});
const { parseImageInput } = require('../src/lib/ai/image-input.ts');
const image = { name: 'workflow.png', dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP9sAAAAASUVORK5CYII=' };
test('validates image types, signatures, encoding and size', () => {
  assert.deepEqual(parseImageInput(image), image);
  for (const dataUrl of ['https://example.com/image.png', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,aGVsbG8=', 'data:image/png;base64,' + 'A'.repeat(4_200_000)]) {
    assert.throws(() => parseImageInput({ ...image, dataUrl }), AIServiceError);
  }
});
test('sends actual image content to the vision model', async () => {
  process.env.GROQ_VISION_MODEL = 'test-vision-model';
  global.fetch = async (_url, options) => {
    const sent = JSON.parse(options.body);
    assert.equal(sent.model, 'test-vision-model');
    assert.equal(sent.messages.at(-1).content[1].image_url.url, image.dataUrl);
    return success({ responseMessage: 'Which branch is approved?' });
  };
  await service.sendMessage('p', 'Read this diagram', graph, [], [image]);
  delete process.env.GROQ_VISION_MODEL;
});
test('API accepts image-only input and persists attachment name without image bytes', async () => {
  resetDb();
  factory.setAIProcessService({ sendMessage: async (_id, message, _graph, _history, attachment) => {
    assert.deepEqual(attachment, [image]);
    assert.match(message, /from the attached images/);
    return { responseMessage: 'Created', processUpdate: graph };
  } });
  assert.equal((await POST(request({ ...body, message: '', image }))).status, 200);
  assert.match(writes[1].message, /workflow.png/);
  assert.ok(!JSON.stringify(writes).includes('base64'));
  assert.equal((await POST(request({ ...body, message: '' }))).status, 400);
  assert.equal((await POST(request({ ...body, image: { ...image, dataUrl: 'invalid' } }))).status, 400);
});

test('two images reach the vision model in order', async () => {
  const second = { ...image, name: 'second.png' };
  global.fetch = async (_url, options) => {
    const parts = JSON.parse(options.body).messages.at(-1).content;
    assert.equal(parts.length, 3);
    assert.deepEqual(parts.slice(1).map(part => part.image_url.url), [image.dataUrl, second.dataUrl]);
    return success({ responseMessage: 'Read both' });
  };
  await service.sendMessage('p', 'Combine', graph, [], [image, second]);
});
test('API accepts two images and rejects excess, malformed, and mixed attachments', async () => {
  resetDb(); const second = { ...image, name: 'second.png' };
  factory.setAIProcessService({ sendMessage: async (_id, _message, _graph, _history, images) => {
    assert.deepEqual(images, [image, second]);
    return { responseMessage: 'Read both' };
  } });
  assert.equal((await POST(request({ ...body, message: '', images: [image, second] }))).status, 200);
  assert.match(writes[0].message, /workflow.png/);
  assert.match(writes[0].message, /second.png/);
  assert.ok(!JSON.stringify(writes).includes('base64'));
  for (const extra of [{ images: [image, image, image] }, { images: [null] }, { images: {} }, { images: [image], image }]) {
    assert.equal((await POST(request({ ...body, ...extra }))).status, 400);
  }
});
test('retries a temporary throttle and server failure once', async () => {
  for (const status of [429, 503]) {
    let calls = 0;
    global.fetch = async () => ++calls === 1 ? new Response('', { status, headers: { 'retry-after': '0' } }) : success({ responseMessage: 'Recovered' });
    assert.equal((await service.sendMessage('p', 'Edit', graph)).responseMessage, 'Recovered');
    assert.equal(calls, 2);
  }
});
test('long quota waits are returned without retrying or exposing provider text', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; return new Response('secret', { status: 429, headers: { 'retry-after': '120' } }); };
  await assert.rejects(service.sendMessage('p', 'Edit', graph), error => error.status === 429 && error.retryAfter === 120 && !error.message.includes('secret'));
  assert.equal(calls, 1);
});
test('request limits are isolated per user and expire', async () => {
  resetDb();
  factory.setAIProcessService({ sendMessage: async () => ({ responseMessage: 'Done' }) });
  const realNow = Date.now;
  try {
    userId = 'busy-user';
    for (let index = 0; index < 20; index++) assert.equal((await POST(request(body))).status, 200);
    assert.equal((await POST(request(body))).status, 429);
    userId = 'other-user';
    assert.equal((await POST(request(body))).status, 200);
    userId = 'busy-user';
    Date.now = () => realNow() + 61000;
    assert.equal((await POST(request(body))).status, 200);
  } finally { Date.now = realNow; userId = 'test-user'; }
});
(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log('PASS ' + name); } catch (e) { failed++; console.error('FAIL ' + name, e); }
  }
  console.log(`${tests.length - failed}/${tests.length} tests passed`);
  process.exitCode = failed ? 1 : 0;
})();

