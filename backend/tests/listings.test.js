const request = require('supertest');
const { app, prisma, authToken, resetDb } = require('./helpers');

const listingBody = {
  crop_type: 'Beans',
  district: 'Musanze',
  quantity_kg: 120,
  price_per_kg: 600,
  description: 'Fresh climbing beans',
};

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/listings', () => {
  it('returns 201 with a farmer token', async () => {
    const { token } = await authToken('farmer');
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${token}`)
      .send(listingBody);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ crop_type: 'Beans', district: 'Musanze', status: 'active' });
    expect(res.body.listing_id).toBeDefined();
  });

  it('returns 403 with a buyer token', async () => {
    const { token } = await authToken('buyer');
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${token}`)
      .send(listingBody);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/listings', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/listings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
