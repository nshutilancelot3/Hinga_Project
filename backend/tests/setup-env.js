const path = require('path');

// Load test-only env (never committed). No-ops silently if the file is absent.
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });

// Hard stop: the suite runs destructive resets (deleteMany) between tests, so it
// must NEVER be pointed at the dev or production database. Require an explicit,
// throwaway TEST_DATABASE_URL and fail loudly if it is missing.
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Copy backend/.env.test.example to backend/.env.test ' +
      'and point it at a throwaway test database before running the tests.'
  );
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// The tests sign their own JWTs and mock every external API, so give these safe
// placeholders when a real value is not supplied.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.OPENWEATHERMAP_KEY = process.env.OPENWEATHERMAP_KEY || 'test-owm-key';
process.env.PLANTID_KEY = process.env.PLANTID_KEY || 'test-plantid-key';
