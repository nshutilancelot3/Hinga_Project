const request = require('supertest');
const { app, prisma, authToken, resetDb } = require('./helpers');

// OpenWeatherMap is mocked — the test never leaves the process, needs no API key,
// and stays deterministic.
const fakeForecast = { list: [{ dt: 1, main: { temp: 22 }, weather: [{ icon: '01d' }] }] };

beforeEach(async () => {
  await resetDb();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => fakeForecast,
  });
});

afterEach(() => {
  delete global.fetch;
});

afterAll(() => prisma.$disconnect());

describe('GET /api/weather/:district', () => {
  it('returns 200 with forecast data for a valid district', async () => {
    const { token } = await authToken('farmer');
    const res = await request(app)
      .get('/api/weather/gasabo')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.district).toBe('Gasabo');
    expect(res.body.forecast).toEqual(fakeForecast);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/weather/gasabo');
    expect(res.status).toBe(401);
  });

  it('returns 404 for an unknown district', async () => {
    const { token } = await authToken('farmer');
    const res = await request(app)
      .get('/api/weather/atlantis')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
