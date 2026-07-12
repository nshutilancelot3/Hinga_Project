const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// GET /api/prices

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

// POST /api/prices

router.post('/', authenticate, requireRole('coop_admin', 'super_admin'), async (req, res) => {
  const { market_name, crop_type, price_rwf, unit } = req.body;

  if (!market_name || !crop_type || price_rwf === undefined) {
    return res.status(400).json({ error: 'market_name, crop_type and price_rwf are required' });
  }

  try {
    const price = await prisma.marketPrice.create({
      data: {
        market_name,
        crop_type,
        price_rwf,
        ...(unit !== undefined && { unit }),
        admin_id: req.user.user_id,
      },
    });
    res.status(201).json(price);
  } catch (err) {
    console.error('POST /api/prices failed:', err);
    res.status(500).json({ error: 'Failed to create market price' });
  }
});

// PUT /api/prices/:id

router.put('/:id', authenticate, requireRole('coop_admin', 'super_admin'), async (req, res) => {
  const { price_rwf, unit, market_name } = req.body;

  const data = {};
  if (price_rwf !== undefined) {
    const parsed = Number(price_rwf);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ error: 'price_rwf must be a positive number' });
    }
    data.price_rwf = parsed;
  }
  if (unit !== undefined) {
    data.unit = unit;
  }
  if (market_name !== undefined) {
    data.market_name = market_name;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Provide at least one of price_rwf, unit, market_name' });
  }

  try {
    const price = await prisma.marketPrice.update({
      where: { price_id: req.params.id },
      data,
    });
    res.json(price);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Price record not found' });
    }
    console.error('PUT /api/prices/:id failed:', err);
    res.status(500).json({ error: 'Failed to update market price' });
  }
});

// DELETE /api/prices/:id

router.delete('/:id', authenticate, requireRole('coop_admin', 'super_admin'), async (req, res) => {
  try {
    await prisma.marketPrice.delete({
      where: { price_id: req.params.id },
    });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Price record not found' });
    }
    console.error('DELETE /api/prices/:id failed:', err);
    res.status(500).json({ error: 'Failed to delete market price' });
  }
});

module.exports = router;
