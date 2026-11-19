// Administrator-only command. Never expose this script through a public API.
const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scrypt } = require('node:crypto');
const { promisify } = require('node:util');
const { createInterface } = require('node:readline');
const { Writable } = require('node:stream');

class InputError extends Error {}

function promptPassword(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return Promise.reject(new InputError('Run this command in an interactive terminal to enter the password securely.'));
  }
  return new Promise((resolve, reject) => {
    let muted = false;
    const output = new Writable({ write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding);
      callback();
    } });
    const rl = createInterface({ input: process.stdin, output, terminal: true });
    let answered = false;
    rl.on('close', () => {
      process.stdout.write('\n');
      if (!answered) reject(new InputError('Password reset cancelled. Nothing was changed.'));
    });
    rl.on('SIGINT', () => rl.close());
    rl.question(label, answer => {
      answered = true;
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

async function main(askPassword = promptPassword) {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (process.argv.length !== 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run user:reset-password -- user@example.com');
  }
  loadEnvConfig(process.cwd());
  const db = new PrismaClient();
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error('No account found for that email. Nothing was changed.');
    const password = await askPassword('New password (12-128 characters, hidden): ');
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      throw new InputError('Use a password of 12-128 characters. Nothing was changed.');
    }
    const confirmation = await askPassword('Confirm new password (hidden): ');
    if (password !== confirmation) throw new InputError('Passwords do not match. Nothing was changed.');
    const salt = randomBytes(16).toString('hex');
    const hash = await promisify(scrypt)(password, salt, 64);
    await db.$transaction(async tx => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: `${salt}:${hash.toString('hex')}` } });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    console.log(`Password reset for ${email}. All existing sessions were revoked.`);
    console.log('Share this password privately with the verified account owner. Ask them to change it in Settings after signing in.');
  } finally { await db.$disconnect(); }
}

if (require.main === module) main().catch(error => {
  console.error(error instanceof InputError || error.message?.startsWith('Usage:') || error.message?.startsWith('No account') ? error.message : 'Password reset failed. Check database connectivity and configuration.');
  process.exitCode = 1;
});
module.exports = { main };
