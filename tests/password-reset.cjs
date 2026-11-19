const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const { promisify } = require('node:util');
const { scrypt } = require('node:crypto');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
let signedIn = true, changed = 1, updates = 0, revoked = 0, accountExists = true, storedHash;
const db = {
  user: {
    findUnique: async () => accountExists ? { id: 'u1', passwordHash: 'old-hash' } : null,
    updateMany: async ({ where }) => { assert.equal(where.id, 'u1'); assert.equal(where.passwordHash, 'old-hash'); updates++; return { count: changed }; },
    update: async ({ where, data }) => { assert.equal(where.id, 'u1'); storedHash = data.passwordHash; },
  },
  session: { deleteMany: async ({ where }) => { assert.equal(where.userId, 'u1'); revoked++; } },
  $transaction: async fn => fn(db),
  $disconnect: async () => {},
};
const original = Module._load;
Module._load = function(id, ...args) {
  if (id === '@/lib/db/prisma') return { prisma: db };
  if (id === '@/lib/auth') return { getUser: async () => signedIn ? { id: 'u1' } : null, verifyPassword: async p => p === 'current-password', hashPassword: async () => 'new-hash' };
  if (id === '@prisma/client') return { PrismaClient: function() { return db; } };
  if (id === '@next/env') return { loadEnvConfig: () => {} };
  return original.call(this, id, ...args);
};
const { POST } = require('../src/app/api/auth/change-password/route.ts');
const request = body => new Request('http://localhost/api/auth/change-password', { method: 'POST', body: JSON.stringify(body) });
const valid = { currentPassword: 'current-password', password: 'a-new-password-123' };
(async () => {
  signedIn = false;
  assert.equal((await POST(request(valid))).status, 401);
  signedIn = true;
  for (const body of [null, {}, { ...valid, password: 'short' }, { ...valid, password: 'x'.repeat(129) }, { ...valid, currentPassword: 'wrong' }, { ...valid, password: valid.currentPassword }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  assert.equal(updates, 0); assert.equal(revoked, 0);
  changed = 0;
  assert.equal((await POST(request(valid))).status, 409);
  assert.equal(revoked, 0);
  changed = 1;
  const response = await POST(request(valid));
  assert.equal(response.status, 200); assert.equal(revoked, 1);
  assert.match(response.headers.get('set-cookie'), /jv_session=;.*Max-Age=0/i);

  const { main } = require('../scripts/reset-user-password.cjs');
  const argv = process.argv, log = console.log;
  const output = [];
  try {
    console.log = line => output.push(line);
    process.argv = ['node', 'script', 'USER@example.com'];
    const password = 'Admin-chosen-password-123';
    await main(async () => password);
    assert.equal(revoked, 2);
    assert.ok(output.every(line => !line.includes(password)));
    const [salt, hash] = storedHash.split(':');
    assert.equal((await promisify(scrypt)(password, salt, 64)).toString('hex'), hash);
    for (const invalid of ['short', 'x'.repeat(129)]) {
      await assert.rejects(main(async () => invalid), /12-128 characters/);
    }
    let promptCount = 0;
    await assert.rejects(main(async () => ++promptCount === 1 ? password : 'different-password'), /do not match/);
    await assert.rejects(main(async () => { throw new Error('cancelled'); }), /cancelled/);
    assert.equal(revoked, 2);
    assert.equal(storedHash, `${salt}:${hash}`);
    accountExists = false;
    output.length = 0;
    await assert.rejects(main(), /No account found/);
    assert.equal(output.length, 0); assert.equal(revoked, 2);
    process.argv = ['node', 'script'];
    await assert.rejects(main(), /Usage:/);
  } finally { process.argv = argv; console.log = log; }
  console.log('Password reset checks passed: authentication, validation, concurrent change, session revocation, admin reset hashing, unknown account, and CLI usage.');
})().catch(error => { console.error(error); process.exitCode = 1; });
