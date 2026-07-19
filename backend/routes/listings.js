const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

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

// POST /api/listings

router.post('/', authenticate, requireRole('farmer'), async (req, res) => {
  const crop_type = typeof req.body.crop_type === 'string' ? req.body.crop_type.trim() : '';
  const district = typeof req.body.district === 'string' ? req.body.district.trim() : '';
  const { quantity_kg, price_per_kg, description } = req.body;

  if (!crop_type || !district || quantity_kg === undefined || price_per_kg === undefined) {
    return res
      .status(400)
      .json({ error: 'crop_type, quantity_kg, price_per_kg and district are required' });
  }
  if (crop_type.length > 80) {
    return res.status(400).json({ error: 'crop_type must be 80 characters or fewer' });
  }
  if (district.length > 50) {
    return res.status(400).json({ error: 'district must be 50 characters or fewer' });
  }

  const parsedQuantity = Number(quantity_kg);
  if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ error: 'quantity_kg must be a positive number' });
  }

  const parsedPrice = Number(price_per_kg);
  if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'price_per_kg must be a positive number' });
  }

  if (description !== undefined && (typeof description !== 'string' || !description.trim())) {
    return res.status(400).json({ error: 'description must be a non-empty string' });
  }

  try {
    const listing = await prisma.listing.create({
      data: {
        crop_type,
        district,
        quantity_kg: parsedQuantity,
        price_per_kg: parsedPrice,
        ...(description !== undefined && { description: description.trim() }),
        farmer_id: req.user.user_id,
      },
    });
    res.status(201).json(listing);
  } catch (err) {
    console.error('POST /api/listings failed:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

const LISTING_STATUSES = ['active', 'sold', 'cancelled'];

// Loads the listing and rejects with 404/403 unless the caller owns it.
async function loadOwnListing(req, res, next) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { listing_id: req.params.id },
    });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.farmer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.listing = listing;
    next();
  } catch (err) {
    if (err.code === 'P2023') {
      return res.status(404).json({ error: 'Listing not found' });
    }
    console.error(`${req.method} /api/listings/:id failed:`, err);
    res.status(500).json({ error: 'Failed to load listing' });
  }
}

// PUT /api/listings/:id

router.put('/:id', authenticate, requireRole('farmer'), loadOwnListing, async (req, res) => {
  const { quantity_kg, price_per_kg, description, status } = req.body;

  const data = {};
  if (quantity_kg !== undefined) {
    const parsed = Number(quantity_kg);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ error: 'quantity_kg must be a positive number' });
    }
    data.quantity_kg = parsed;
  }
  if (price_per_kg !== undefined) {
    const parsed = Number(price_per_kg);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ error: 'price_per_kg must be a positive number' });
    }
    data.price_per_kg = parsed;
  }
  if (description !== undefined) {
    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'description must be a non-empty string' });
    }
    data.description = description.trim();
  }
  if (status !== undefined) {
    if (!LISTING_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${LISTING_STATUSES.join(', ')}` });
    }
    data.status = status;
  }

  if (Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ error: 'Provide at least one of quantity_kg, price_per_kg, description, status' });
  }

  try {
    const listing = await prisma.listing.update({
      where: { listing_id: req.params.id },
      data,
    });
    res.json(listing);
  } catch (err) {
    console.error('PUT /api/listings/:id failed:', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// DELETE /api/listings/:id

router.delete('/:id', authenticate, requireRole('farmer'), loadOwnListing, async (req, res) => {
  try {
    await prisma.listing.delete({
      where: { listing_id: req.params.id },
    });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/listings/:id failed:', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

module.exports = router;
