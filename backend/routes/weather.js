const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

// All 30 Rwanda districts mapped to their approximate centre coordinates.
// OpenWeatherMap has no notion of Rwandan districts, so we query by lat/lon.
const DISTRICT_COORDS = {
  // Kigali City
  gasabo: { name: 'Gasabo', lat: -1.9, lon: 30.1 },
  kicukiro: { name: 'Kicukiro', lat: -1.98, lon: 30.1 },
  nyarugenge: { name: 'Nyarugenge', lat: -1.95, lon: 30.06 },
  // Eastern Province
  bugesera: { name: 'Bugesera', lat: -2.14, lon: 30.09 },
  gatsibo: { name: 'Gatsibo', lat: -1.58, lon: 30.42 },
  kayonza: { name: 'Kayonza', lat: -1.88, lon: 30.62 },
  kirehe: { name: 'Kirehe', lat: -2.22, lon: 30.7 },
  ngoma: { name: 'Ngoma', lat: -2.15, lon: 30.5 },
  nyagatare: { name: 'Nyagatare', lat: -1.3, lon: 30.32 },
  rwamagana: { name: 'Rwamagana', lat: -1.95, lon: 30.43 },
  // Northern Province
  burera: { name: 'Burera', lat: -1.47, lon: 29.87 },
  gakenke: { name: 'Gakenke', lat: -1.69, lon: 29.78 },
  gicumbi: { name: 'Gicumbi', lat: -1.58, lon: 30.07 },
  musanze: { name: 'Musanze', lat: -1.5, lon: 29.63 },
  rulindo: { name: 'Rulindo', lat: -1.77, lon: 30.06 },
  // Southern Province
  gisagara: { name: 'Gisagara', lat: -2.55, lon: 29.83 },
  huye: { name: 'Huye', lat: -2.6, lon: 29.74 },
  kamonyi: { name: 'Kamonyi', lat: -2.01, lon: 29.9 },
  muhanga: { name: 'Muhanga', lat: -2.08, lon: 29.75 },
  nyamagabe: { name: 'Nyamagabe', lat: -2.46, lon: 29.56 },
  nyanza: { name: 'Nyanza', lat: -2.35, lon: 29.75 },
  nyaruguru: { name: 'Nyaruguru', lat: -2.72, lon: 29.52 },
  ruhango: { name: 'Ruhango', lat: -2.23, lon: 29.78 },
  // Western Province
  karongi: { name: 'Karongi', lat: -2.0, lon: 29.39 },
  ngororero: { name: 'Ngororero', lat: -1.87, lon: 29.63 },
  nyabihu: { name: 'Nyabihu', lat: -1.65, lon: 29.51 },
  nyamasheke: { name: 'Nyamasheke', lat: -2.33, lon: 29.15 },
  rubavu: { name: 'Rubavu', lat: -1.68, lon: 29.32 },
  rusizi: { name: 'Rusizi', lat: -2.48, lon: 28.9 },
  rutsiro: { name: 'Rutsiro', lat: -1.94, lon: 29.32 },
};

// GET /api/weather/:district

router.get('/:district', authenticate, async (req, res) => {
  const entry = DISTRICT_COORDS[req.params.district.trim().toLowerCase()];
  if (!entry) {
    return res.status(404).json({ error: 'Unknown district' });
  }

  try {
    const cached = await prisma.weatherCache.findUnique({
      where: { district: entry.name },
    });

    if (cached && cached.expires_at > new Date()) {
      return res.json({
        district: entry.name,
        cached: true,
        fetched_at: cached.fetched_at,
        forecast: JSON.parse(cached.forecast_json),
      });
    }

    const url =
      'https://api.openweathermap.org/data/2.5/forecast' +
      `?lat=${entry.lat}&lon=${entry.lon}&units=metric&appid=${process.env.OPENWEATHERMAP_KEY}`;
    const owmRes = await fetch(url);

    if (!owmRes.ok) {
      // OpenWeatherMap is down or rate-limited: serve the stale cache if we have one.
      if (cached) {
        return res.json({
          district: entry.name,
          cached: true,
          stale: true,
          fetched_at: cached.fetched_at,
          forecast: JSON.parse(cached.forecast_json),
        });
      }
      console.error(`OpenWeatherMap responded ${owmRes.status} for ${entry.name}`);
      return res.status(502).json({ error: 'Weather service unavailable' });
    }

    const forecast = await owmRes.json();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

    await prisma.weatherCache.upsert({
      where: { district: entry.name },
      update: {
        forecast_json: JSON.stringify(forecast),
        fetched_at: now,
        expires_at: expiresAt,
      },
      create: {
        district: entry.name,
        forecast_json: JSON.stringify(forecast),
        fetched_at: now,
        expires_at: expiresAt,
      },
    });

    res.json({ district: entry.name, cached: false, fetched_at: now, forecast });
  } catch (err) {
    console.error('GET /api/weather/:district failed:', err);
    res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
});

module.exports = router;
