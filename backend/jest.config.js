/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // setup-env runs before any module (incl. Prisma) is imported, so it can point
  // DATABASE_URL at the test database first.
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 20000,
};
