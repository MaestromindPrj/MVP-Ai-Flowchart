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
Module._load = function (id, parent, isMain) {
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
    assert.deepEqual(JSON.parse(body.messages.at(-1).content).currentProcess, graph);
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
    process: { findUnique: async () => processRecord },
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
(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log('PASS ' + name); } catch (e) { failed++; console.error('FAIL ' + name, e); }
  }
  console.log(`${tests.length - failed}/${tests.length} tests passed`);
  process.exitCode = failed ? 1 : 0;
})();

