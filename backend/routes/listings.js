const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/listings

router.get('/', async (req, res) => {
  const { crop, district } = req.query;

  const where = { status: 'active' };
  if (crop) {
    where.crop_type = { equals: crop, mode: 'insensitive' };
  }
  if (district) {
    where.district = { equals: district, mode: 'insensitive' };
  }

  try {
    const listings = await prisma.listing.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        farmer: { select: { full_name: true } },
      },
    });
    res.json(listings);
  } catch (err) {
    console.error('GET /api/listings failed:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

module.exports = router;
