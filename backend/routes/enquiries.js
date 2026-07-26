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

// GET /api/enquiries/received
// Farmers only. Returns every enquiry across all of the farmer's listings,
// most recent first, with the buyer name and the listing it refers to.

router.get('/received', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      where: { listing: { farmer_id: req.user.user_id } },
      orderBy: { created_at: 'desc' },
      include: {
        buyer: { select: { full_name: true, email: true } },
        listing: { select: { listing_id: true, crop_type: true, district: true } },
      },
    });
    res.json(enquiries);
  } catch (err) {
    console.error('GET /api/enquiries/received failed:', err);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

const ENQUIRY_STATUSES = ['pending', 'resolved'];

// PUT /api/enquiries/:id
// Farmers only, and only for enquiries on their own listings. Lets a farmer
// mark an enquiry as resolved once they've followed up with the buyer.

router.put('/:id', authenticate, requireRole('farmer'), async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }
  const { status } = req.body;
  if (!ENQUIRY_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${ENQUIRY_STATUSES.join(', ')}` });
  }

  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { enquiry_id: req.params.id },
      include: { listing: { select: { farmer_id: true } } },
    });
    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    if (enquiry.listing.farmer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.enquiry.update({
      where: { enquiry_id: req.params.id },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/enquiries/:id failed:', err);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

module.exports = router;
