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

async function createPrice(ownerToken) {
  const res = await request(app)
    .post('/api/prices')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(priceBody);
  return res.body.price_id;
}

describe('PUT /api/prices/:id', () => {
  it("returns 403 when a different coop_admin tries to edit someone else's price", async () => {
    const owner = await authToken('coop_admin');
    const priceId = await createPrice(owner.token);

    const other = await authToken('coop_admin');
    const res = await request(app)
      .put(`/api/prices/${priceId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ price_rwf: 500 });
    expect(res.status).toBe(403);
  });

  it('returns 200 when the owning coop_admin edits their own price', async () => {
    const owner = await authToken('coop_admin');
    const priceId = await createPrice(owner.token);

    const res = await request(app)
      .put(`/api/prices/${priceId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ price_rwf: 500 });
    expect(res.status).toBe(200);
    expect(res.body.price_rwf).toBe('500');
  });

  it("returns 200 when a super_admin edits another admin's price", async () => {
    const owner = await authToken('coop_admin');
    const priceId = await createPrice(owner.token);

    const admin = await authToken('super_admin');
    const res = await request(app)
      .put(`/api/prices/${priceId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ price_rwf: 500 });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/prices/:id', () => {
  it("returns 403 when a different coop_admin tries to delete someone else's price", async () => {
    const owner = await authToken('coop_admin');
    const priceId = await createPrice(owner.token);

    const other = await authToken('coop_admin');
    const res = await request(app)
      .delete(`/api/prices/${priceId}`)
      .set('Authorization', `Bearer ${other.token}`);
    expect(res.status).toBe(403);
  });

  it('returns 204 when the owning coop_admin deletes their own price', async () => {
    const owner = await authToken('coop_admin');
    const priceId = await createPrice(owner.token);

    const res = await request(app)
      .delete(`/api/prices/${priceId}`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 for a nonexistent price record', async () => {
    const { token } = await authToken('coop_admin');
    const res = await request(app)
      .delete('/api/prices/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
