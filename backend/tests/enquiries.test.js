const request = require('supertest');
const { app, prisma, createUser, authToken, resetDb } = require('./helpers');

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

// A buyer enquires on a farmer's active listing.
async function seedListing() {
  const farmer = await createUser('farmer');
  return prisma.listing.create({
    data: {
      farmer_id: farmer.user_id,
      crop_type: 'Maize',
      quantity_kg: 100,
      price_per_kg: 450,
      district: 'Gasabo',
      status: 'active',
    },
  });
}

describe('POST /api/enquiries', () => {
  it('returns 201 with a buyer token', async () => {
    const listing = await seedListing();
    const { token } = await authToken('buyer');
    const res = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({ listing_id: listing.listing_id, message: 'Is this still available?' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ listing_id: listing.listing_id, status: 'pending' });
  });

  it('returns 403 with a farmer token', async () => {
    const { token } = await authToken('farmer');
    const res = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({ listing_id: '00000000-0000-0000-0000-000000000000', message: 'Hello' });
    expect(res.status).toBe(403);
  });
});
