const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/enquiries

router.post('/', authenticate, requireRole('buyer'), async (req, res) => {
  const { listing_id } = req.body;
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

  if (!listing_id || !message) {
    return res.status(400).json({ error: 'listing_id and message are required' });
  }
  if (typeof listing_id !== 'string' || !UUID_PATTERN.test(listing_id)) {
    return res.status(400).json({ error: 'listing_id must be a valid UUID' });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { listing_id },
    });

    if (!listing || listing.status !== 'active') {
      return res.status(404).json({ error: 'Listing not found or no longer active' });
    }
    if (listing.farmer_id === req.user.user_id) {
      return res.status(400).json({ error: 'You cannot enquire about your own listing' });
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        listing_id,
        message,
        buyer_id: req.user.user_id,
      },
    });
    res.status(201).json(enquiry);
  } catch (err) {
    console.error('POST /api/enquiries failed:', err);
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

// GET /api/enquiries?listing_id=

router.get('/', authenticate, async (req, res) => {
  const { listing_id } = req.query;

  if (!listing_id) {
    return res.status(400).json({ error: 'listing_id query parameter is required' });
  }
  if (!UUID_PATTERN.test(listing_id)) {
    return res.status(400).json({ error: 'listing_id must be a valid UUID' });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { listing_id },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.farmer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const enquiries = await prisma.enquiry.findMany({
      where: { listing_id },
      orderBy: { created_at: 'desc' },
      include: {
        buyer: { select: { full_name: true } },
      },
    });
    res.json(enquiries);
  } catch (err) {
    console.error('GET /api/enquiries failed:', err);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

module.exports = router;
