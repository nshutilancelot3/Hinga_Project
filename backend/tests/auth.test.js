const request = require('supertest');
const { app, prisma, resetDb } = require('./helpers');

const newUser = (over = {}) => ({
  full_name: 'Alice Farmer',
  email: 'alice@test.dev',
  password: 'password123',
  role: 'farmer',
  district: 'Gasabo',
  language_pref: 'rw',
  ...over,
});

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  it('returns 201 for a new email', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'alice@test.dev', role: 'farmer' });
    expect(res.body.user_id).toBeDefined();
  });

  it('returns 409 for a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(newUser());
    const res = await request(app).post('/api/auth/register').send(newUser());
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('EMAIL_TAKEN');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(newUser());
  });

  it('returns 200 + a JWT for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.dev', password: 'password123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ role: 'farmer' });
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.dev', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });
});
