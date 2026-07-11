const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/prices
// Public. Returns market prices ordered by most recent first.
// Optional filters: ?crop=<crop_type> and ?market=<market_name> (case-insensitive).
router.get('/', async (req, res) => {
  const { crop, market } = req.query;

  const where = {};
  if (crop) {
    where.crop_type = { equals: crop, mode: 'insensitive' };
  }
  if (market) {
    where.market_name = { equals: market, mode: 'insensitive' };
  }

  try {
    const prices = await prisma.marketPrice.findMany({
      where,
      orderBy: { recorded_at: 'desc' },
    });
    res.json(prices);
  } catch (err) {
    console.error('GET /api/prices failed:', err);
    res.status(500).json({ error: 'Failed to fetch market prices' });
  }
});

module.exports = router;
