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

const { DELETE } = require('../src/app/api/processes/[id]/route.ts');

(async () => {
  console.log('Testing DELETE /api/processes/[id]');

  // Test 1: Not found returns 404
  db = {
    process: {
      findUnique: async () => null,
    },
  };

  const req1 = new Request('http://localhost/api/processes/p-missing', { method: 'DELETE' });
  const res1 = await DELETE(req1, { params: Promise.resolve({ id: 'p-missing' }) });
  assert.equal(res1.status, 404);
  const data1 = await res1.json();
  assert.equal(data1.error, 'Process not found');
  console.log('PASS: DELETE non-existent process returns 404');

  // Test 2: Success deletes child records and process
  const deleted = [];
  db = {
    process: {
      findUnique: async ({ where }) => ({ id: where.id, name: 'Sample' }),
      delete: async ({ where }) => { deleted.push(`process:${where.id}`); return { id: where.id }; },
    },
    processMessage: {
      deleteMany: async ({ where }) => { deleted.push(`messages:${where.processId}`); return { count: 2 }; },
    },
    processParticipant: {
      deleteMany: async ({ where }) => { deleted.push(`participants:${where.processId}`); return { count: 1 }; },
    },
    processVersion: {
      deleteMany: async ({ where }) => { deleted.push(`versions:${where.processId}`); return { count: 3 }; },
    },
    $transaction: async (ops) => Promise.all(ops),
  };

  const req2 = new Request('http://localhost/api/processes/p-123', { method: 'DELETE' });
  const res2 = await DELETE(req2, { params: Promise.resolve({ id: 'p-123' }) });
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.success, true);
  assert.deepEqual(deleted, [
    'messages:p-123',
    'participants:p-123',
    'versions:p-123',
    'process:p-123',
  ]);
  console.log('PASS: DELETE existing process cleanly cascades via transaction and returns 200');
})();
