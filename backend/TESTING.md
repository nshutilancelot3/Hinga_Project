# Backend testing & seeding

## Integration tests (issue #27)

Jest + Supertest exercise the API in-process against a **throwaway** Postgres.
External services (OpenWeatherMap, Plant.id) are **mocked**, so no API keys are
needed and the tests stay deterministic and free.

### One-time setup

1. Start a test database. Easiest is Docker:
   ```bash
   docker run -d --name hinga-test-pg \
     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hinga_test \
     -p 5433:5432 postgres:16
   ```
2. Point the tests at it:
   ```bash
   cp .env.test.example .env.test   # then edit if your DB differs
   ```
   `.env.test` is gitignored. The suite refuses to run without `TEST_DATABASE_URL`,
   so it can never touch the dev/prod database.
3. Apply the schema to the test DB:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/hinga_test?schema=public" \
     npx prisma migrate deploy
   ```

### Run

```bash
npm test           # one-off
npm run test:watch # watch mode
```

Coverage: register (201/409), login (200/401), GET/POST prices (200 / 201 / 403 /
401), POST/GET listings (201 / 403), POST enquiries (201 / 403), GET weather
(200 / 401 / 404, fetch mocked), POST diagnosis (2xx / 403 / 400, fetch mocked).

## Seeding (issue #28)

Creates the first admin and demo market prices so a fresh DB isn't empty.
Idempotent — safe to run twice.

```bash
SEED_ADMIN_EMAIL=admin@hinga.rw SEED_ADMIN_PASSWORD='<strong-password>' npm run seed
```

Runs against whatever `DATABASE_URL` points to. `SEED_ADMIN_PASSWORD` is
**required** — the seed refuses to run without it (no public default). Re-running
with a different value rotates the existing admin's password.
