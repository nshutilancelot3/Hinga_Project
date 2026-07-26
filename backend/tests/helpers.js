const jwt = require('jsonwebtoken');
const app = require('../server');
const prisma = require('../lib/prisma');

// Create a user directly in the DB. Skips bcrypt/registration so tests that only
// need an authenticated caller of a given role stay fast; auth.test.js exercises
// the real register/login path separately.
async function createUser(role, overrides = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return prisma.user.create({
    data: {
      full_name: overrides.full_name || `Test ${role}`,
      email: overrides.email || `${role}-${unique}@test.dev`,
      password_hash: overrides.password_hash || 'not-a-real-hash',
      role,
      district: overrides.district || 'Gasabo',
      language_pref: overrides.language_pref || 'rw',
    },
  });
}

// Mirror the payload shape auth.js signs, so authenticate.js accepts it.
function tokenFor(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role, district: user.district },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function authToken(role, overrides = {}) {
  const user = await createUser(role, overrides);
  return { user, token: tokenFor(user) };
}

// Wipe all tables in FK-safe order between tests.
async function resetDb() {
  await prisma.enquiry.deleteMany();
  await prisma.diagnosisSession.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.weatherCache.deleteMany();
  await prisma.user.deleteMany();
}

module.exports = { app, prisma, createUser, tokenFor, authToken, resetDb };
