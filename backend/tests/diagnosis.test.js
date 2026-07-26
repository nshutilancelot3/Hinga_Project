const request = require('supertest');
const { app, prisma, authToken, resetDb } = require('./helpers');

// Plant.id is mocked — no key, no credits, no network, deterministic result.
const fakePlantId = {
  result: {
    is_healthy: { binary: false },
    disease: {
      suggestions: [
        {
          name: 'Leaf blight',
          probability: 0.92,
          details: { treatment: { chemical: ['Apply fungicide X'] } },
        },
      ],
    },
  },
};

const body = { image: 'data:image/jpeg;base64,QUJDRA==', crop_type: 'Maize' };

beforeEach(async () => {
  await resetDb();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => fakePlantId,
  });
});

afterEach(() => {
  delete global.fetch;
});

afterAll(() => prisma.$disconnect());

describe('POST /api/diagnosis', () => {
  it('returns a diagnosis result with a farmer token', async () => {
    const { token } = await authToken('farmer');
    const res = await request(app)
      .post('/api/diagnosis')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    // The route responds 201 (a diagnosis session is created); issue #27 loosely
    // says "200", so assert on the 2xx success shape rather than the exact code.
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body.disease_name).toBe('Leaf blight');
    expect(res.body.confidence).toBeCloseTo(0.92);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns 403 with a buyer token', async () => {
    const { token } = await authToken('buyer');
    const res = await request(app)
      .post('/api/diagnosis')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(403);
  });

  it('returns 400 when the image is missing', async () => {
    const { token } = await authToken('farmer');
    const res = await request(app)
      .post('/api/diagnosis')
      .set('Authorization', `Bearer ${token}`)
      .send({ crop_type: 'Maize' });
    expect(res.status).toBe(400);
  });
});
