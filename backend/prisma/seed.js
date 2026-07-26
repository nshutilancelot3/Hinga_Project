require('dotenv/config');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

// Seeds the first admin account and a handful of market prices so a fresh
// production database isn't empty for the demo (issue #28). Idempotent: safe to
// run more than once — the admin is upserted by email (and its password kept in
// sync with SEED_ADMIN_PASSWORD), and prices are only added when the table is empty.

const SALT_ROUNDS = 12;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@hinga.rw';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

// A spread across the five markets and common crops (price in RWF/kg).
const DEMO_PRICES = [
  { market_name: 'Kimironko', crop_type: 'Maize', price_rwf: 450 },
  { market_name: 'Kimironko', crop_type: 'Beans', price_rwf: 900 },
  { market_name: 'Nyabugogo', crop_type: 'Irish potato', price_rwf: 380 },
  { market_name: 'Nyabugogo', crop_type: 'Rice', price_rwf: 1300 },
  { market_name: 'Musanze', crop_type: 'Irish potato', price_rwf: 350 },
  { market_name: 'Huye', crop_type: 'Cassava', price_rwf: 300 },
  { market_name: 'Rubavu', crop_type: 'Tomato', price_rwf: 700 },
];

async function main() {
  // No public default: refuse to seed without an explicit password, so the admin
  // can never end up with a guessable password that lives in the repo.
  if (!ADMIN_PASSWORD || !ADMIN_PASSWORD.trim()) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required. Set it (a strong value) before seeding.'
    );
  }

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    // Keep the password in sync with SEED_ADMIN_PASSWORD on re-run, so rotating it
    // is just "change the env var and re-seed" even when the admin already exists.
    update: { role: 'super_admin', password_hash },
    create: {
      full_name: 'Hinga Admin',
      email: ADMIN_EMAIL,
      password_hash,
      role: 'super_admin',
      district: 'Gasabo',
      language_pref: 'rw',
    },
  });
  console.log(`✓ Admin ready: ${admin.email} (role: ${admin.role})`);

  const existingPrices = await prisma.marketPrice.count();
  if (existingPrices > 0) {
    console.log(`✓ Prices already present (${existingPrices}); skipping price seed.`);
  } else {
    await prisma.marketPrice.createMany({
      data: DEMO_PRICES.map((p) => ({ ...p, admin_id: admin.user_id })),
    });
    console.log(`✓ Seeded ${DEMO_PRICES.length} market prices.`);
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
