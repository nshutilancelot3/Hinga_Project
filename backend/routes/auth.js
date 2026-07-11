const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

const SALT_ROUNDS = 12;

router.post('/register', async (req, res) => {
  const { full_name, email, password, role, district, language_pref } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role },
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
