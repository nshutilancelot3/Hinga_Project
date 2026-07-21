const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

const SALT_ROUNDS = 12;
// super_admin accounts are created by an existing super admin, never self-registered.
const REGISTERABLE_ROLES = ['farmer', 'buyer', 'coop_admin'];

router.post('/register', async (req, res) => {
  const { full_name, email, password, role, district, language_pref } = req.body;

  const required = { full_name, email, password, role, district };
  for (const [field, value] of Object.entries(required)) {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ error: 'MISSING_FIELD', field });
    }
  }

  if (!REGISTERABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'INVALID_ROLE' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'EMAIL_TAKEN' });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      full_name,
      email,
      password_hash,
      role,
      district,
      language_pref,
    },
  });

  res.status(201).json({
    user_id: user.user_id,
    email: user.email,
    role: user.role,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role, district: user.district },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      role: user.role,
      district: user.district,
      language_pref: user.language_pref,
    },
  });
});

module.exports = router;
