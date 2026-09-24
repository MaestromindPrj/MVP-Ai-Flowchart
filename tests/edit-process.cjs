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

const { PATCH } = require('../src/app/api/processes/[id]/route.ts');

(async () => {
  console.log('Testing PATCH /api/processes/[id]');

  // Test 1: Not found returns 404
  db = {
    process: {
      findUnique: async () => null,
    },
  };

  const req1 = new Request('http://localhost/api/processes/p-missing', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Updated Name' }),
  });
  const res1 = await PATCH(req1, { params: Promise.resolve({ id: 'p-missing' }) });
  assert.equal(res1.status, 404);
  const data1 = await res1.json();
  assert.equal(data1.error, 'Process not found');
  console.log('PASS: PATCH non-existent process returns 404');

  // Test 2: Empty process name validation returns 400
  db = {
    process: {
      findUnique: async () => ({ id: 'p-1', versions: [] }),
    },
  };

  const req2 = new Request('http://localhost/api/processes/p-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '   ' }),
  });
  const res2 = await PATCH(req2, { params: Promise.resolve({ id: 'p-1' }) });
  assert.equal(res2.status, 400);
  const data2 = await res2.json();
  assert.equal(data2.error, 'Process name cannot be empty');
  console.log('PASS: Empty process name returns 400 validation error');

  // Test 3: Empty owner name returns 400
  const req3 = new Request('http://localhost/api/processes/p-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerName: '   ' }),
  });
  const res3 = await PATCH(req3, { params: Promise.resolve({ id: 'p-1' }) });
  assert.equal(res3.status, 400);
  const data3 = await res3.json();
  assert.equal(data3.error, 'Owner name cannot be empty');
  console.log('PASS: Empty owner name returns 400 validation error');

  // Test 4: Successful update of metadata and status
  let savedData = null;
  db = {
    process: {
      findUnique: async () => ({
        id: 'p-1',
        name: 'Old Name',
        versions: [],
      }),
      update: async ({ where, data }) => {
        savedData = data;
        return {
          id: where.id,
          ...data,
          currentVersionNumber: 1,
        };
      },
    },
  };

  const req4 = new Request('http://localhost/api/processes/p-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '  Modernized Checkout Flow  ',
      description: 'Streamlined checkout steps',
      department: 'Logistics',
      ownerName: 'Sarah Connor',
      ownerEmail: 'sarah@acme.com',
      status: 'Under Review',
    }),
  });
  const res4 = await PATCH(req4, { params: Promise.resolve({ id: 'p-1' }) });
  assert.equal(res4.status, 200);
  const data4 = await res4.json();
  assert.equal(data4.process.name, 'Modernized Checkout Flow');
  assert.equal(savedData.name, 'Modernized Checkout Flow');
  assert.equal(savedData.department, 'Logistics');
  assert.equal(savedData.ownerName, 'Sarah Connor');
  assert.equal(savedData.ownerEmail, 'sarah@acme.com');
  assert.equal(savedData.status, 'Under Review');
  console.log('PASS: Successful PATCH updates all metadata fields and trims strings');
})();
