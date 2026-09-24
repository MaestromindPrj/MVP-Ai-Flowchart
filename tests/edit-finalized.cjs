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

const { POST: createVersion } = require('../src/app/api/processes/[id]/versions/route.ts');
const { PATCH: updateProcess } = require('../src/app/api/processes/[id]/route.ts');

(async () => {
  console.log('Testing Editing of Finalized Process...');

  // Test 1: Creating a new revision sets status to Draft and increments version
  let updatedProcessData = null;
  db = {
    process: {
      findUnique: async () => ({
        id: 'proc-final',
        ownerName: 'Lead',
        status: 'Finalized',
        versions: [{ versionNumber: 2 }],
      }),
      update: async ({ where, data }) => {
        updatedProcessData = data;
        return {
          id: where.id,
          ...data,
        };
      },
    },
    processVersion: {
      create: async ({ data }) => ({
        id: 'ver-3',
        ...data,
      }),
    },
  };

  const req1 = new Request('http://localhost/api/processes/proc-final/versions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      processData: { nodes: [{ id: 'n1', label: 'Step 1' }], edges: [] },
      changeSummary: 'Revision after approval',
    }),
  });
  const res1 = await createVersion(req1, { params: Promise.resolve({ id: 'proc-final' }) });
  assert.equal(res1.status, 201);
  const data1 = await res1.json();
  assert.equal(data1.version.versionNumber, 3);
  assert.equal(updatedProcessData.currentVersionNumber, 3);
  assert.equal(updatedProcessData.status, 'Draft');
  assert.equal(data1.process.status, 'Draft');
  console.log('PASS: Creating new revision from finalized process creates v3 and sets status to Draft');

  // Test 2: Directly unlocking current version switches status to Draft
  let patchedData = null;
  db = {
    process: {
      findUnique: async () => ({
        id: 'proc-final',
        status: 'Finalized',
        versions: [{ id: 'ver-2', versionNumber: 2 }],
      }),
      update: async ({ where, data }) => {
        patchedData = data;
        return {
          id: where.id,
          ...data,
          currentVersionNumber: 2,
        };
      },
    },
  };

  const req2 = new Request('http://localhost/api/processes/proc-final', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'Draft',
    }),
  });
  const res2 = await updateProcess(req2, { params: Promise.resolve({ id: 'proc-final' }) });
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.process.status, 'Draft');
  assert.equal(patchedData.status, 'Draft');
  console.log('PASS: Directly unlocking finalized process switches status back to Draft');
})();
