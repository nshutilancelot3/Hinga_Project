const request = require('supertest');
const { app, prisma, authToken, resetDb } = require('./helpers');

const priceBody = { market_name: 'Kimironko', crop_type: 'Maize', price_rwf: 450 };

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('GET /api/prices', () => {
  it('returns 200 with an array (no auth required)', async () => {
    const res = await request(app).get('/api/prices');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/prices', () => {
  it('returns 201 with a coop_admin token', async () => {
    const { token } = await authToken('coop_admin');
    const res = await request(app)
      .post('/api/prices')
      .set('Authorization', `Bearer ${token}`)
      .send(priceBody);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ market_name: 'Kimironko', crop_type: 'Maize' });
  });

  it('returns 403 with a farmer token', async () => {
    const { token } = await authToken('farmer');
    const res = await request(app)
      .post('/api/prices')
      .set('Authorization', `Bearer ${token}`)
      .send(priceBody);
    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/prices').send(priceBody);
    expect(res.status).toBe(401);
  });
});
