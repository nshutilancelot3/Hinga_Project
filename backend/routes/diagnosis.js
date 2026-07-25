const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const PLANTID_URL = 'https://plant.id/api/v3/health_assessment?details=treatment';

// POST /api/diagnosis
// Farmers only. Body: { image: <base64 string>, crop_type: <string> }.
// The image is forwarded to Plant.id and never written to disk or the database;
// only the diagnosis result is stored, per the data-minimisation commitment.

router.post('/', authenticate, requireRole('farmer'), async (req, res) => {
  const { image, crop_type } = req.body;

  if (typeof image !== 'string' || !image.trim()) {
    return res.status(400).json({ error: 'image (base64 string) is required' });
  }
  if (typeof crop_type !== 'string' || !crop_type.trim() || crop_type.length > 80) {
    return res.status(400).json({ error: 'crop_type is required (80 characters or fewer)' });
  }

  // Accept both raw base64 and data-URL form ("data:image/jpeg;base64,...").
  const base64 = image.includes(',') ? image.slice(image.indexOf(',') + 1) : image;

  try {
    const plantIdRes = await fetch(PLANTID_URL, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.PLANTID_KEY,
        'Content-Type': 'application/json',
      },
      // similar_images is opt-in only: Plant.id v3 rejects the request if it's
      // explicitly set to false instead of just being left out.
      body: JSON.stringify({ images: [base64] }),
    });

    if (!plantIdRes.ok) {
      const body = await plantIdRes.text();
      console.error(`Plant.id responded ${plantIdRes.status}: ${body}`);
      return res.status(502).json({ error: 'Diagnosis service unavailable' });
    }

    const result = await plantIdRes.json();
    const suggestion = result?.result?.disease?.suggestions?.[0];

    if (!suggestion) {
      return res.status(422).json({ error: 'Plant.id could not identify a disease in this image' });
    }

    const session = await prisma.diagnosisSession.create({
      data: {
        farmer_id: req.user.user_id,
        crop_type: crop_type.trim(),
        disease_name: String(suggestion.name).slice(0, 150),
        confidence: suggestion.probability ?? 0,
        treatment:
          suggestion.details?.treatment
            ? JSON.stringify(suggestion.details.treatment)
            : 'No treatment information returned. Consult an agronomist.',
      },
    });

    res.status(201).json({
      session_id: session.session_id,
      crop_type: session.crop_type,
      disease_name: session.disease_name,
      confidence: session.confidence,
      treatment: session.treatment,
      is_healthy: result?.result?.is_healthy?.binary ?? null,
      note: 'This is an automated diagnosis. Consult an agronomist for serious issues.',
    });
  } catch (err) {
    console.error('POST /api/diagnosis failed:', err);
    res.status(500).json({ error: 'Failed to run diagnosis' });
  }
});

module.exports = router;
