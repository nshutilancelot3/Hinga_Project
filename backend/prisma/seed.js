// Seeds the first super_admin, which cannot be self-registered through /auth/register.
// Credentials come from env vars so real passwords never live in the repo:
//   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME, SEED_ADMIN_DISTRICT
// Run with: npm run seed
require('dotenv/config');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@hinga.rw';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const full_name = process.env.SEED_ADMIN_NAME || 'Hinga Super Admin';
  const district = process.env.SEED_ADMIN_DISTRICT || 'Gasabo';

  const password_hash = await bcrypt.hash(password, 10);

  // Idempotent: re-running promotes/repairs the account rather than erroring.
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'super_admin' },
    create: {
      full_name,
      email,
      password_hash,
      role: 'super_admin',
      district,
      language_pref: 'rw',
    },
  });

  console.log(`Seeded super_admin: ${admin.email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('WARNING: used the default password ChangeMe123! — set SEED_ADMIN_PASSWORD and re-run for anything real.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
