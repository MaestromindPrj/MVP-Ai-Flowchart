// Administrator-only command. Never expose this script through a public API.
const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scrypt } = require('node:crypto');
const { promisify } = require('node:util');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (process.argv.length !== 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run user:reset-password -- user@example.com');
  }
  loadEnvConfig(process.cwd());
  const db = new PrismaClient();
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error('No account found for that email. Nothing was changed.');
    const password = randomBytes(18).toString('base64url');
    const salt = randomBytes(16).toString('hex');
    const hash = await promisify(scrypt)(password, salt, 64);
    await db.$transaction(async tx => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: `${salt}:${hash.toString('hex')}` } });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    console.log(`Password reset for ${email}. All existing sessions were revoked.`);
    console.log(`New password: ${password}`);
    console.log('Share this password privately with the verified account owner. Ask them to change it in Settings after signing in.');
  } finally { await db.$disconnect(); }
}

if (require.main === module) main().catch(error => {
  console.error(error.message?.startsWith('Usage:') || error.message?.startsWith('No account') ? error.message : 'Password reset failed. Check database connectivity and configuration.');
  process.exitCode = 1;
});
module.exports = { main };
