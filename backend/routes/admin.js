const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

const ASSIGNABLE_ROLES = ['farmer', 'buyer', 'coop_admin', 'super_admin'];

// Never leak the password hash to the client.
const USER_FIELDS = {
  user_id: true,
  full_name: true,
  email: true,
  role: true,
  district: true,
  language_pref: true,
  created_at: true,
};

// Every route here is super_admin only.
router.use(authenticate, requireRole('super_admin'));

// GET /api/admin/users?page=1&limit=20&role=farmer
// Paginated list of all users, optionally filtered by role.
router.get('/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { role } = req.query;

  const where = {};
  if (role) {
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role filter' });
    }
    where.role = role;
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_FIELDS,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total, page, limit });
  } catch (err) {
    console.error('GET /api/admin/users failed:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role
// Change a user's role. Body: { role }.
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'role must be one of ' + ASSIGNABLE_ROLES.join(', ') });
  }

  try {
    const user = await prisma.user.update({
      where: { user_id: req.params.id },
      data: { role },
      select: USER_FIELDS,
    });
    res.json(user);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('PUT /api/admin/users/:id/role failed:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// DELETE /api/admin/users/:id
// Remove a user account. Guards against deleting yourself and against
// removing a user who still owns prices, listings, diagnoses, or enquiries.
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.user_id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  try {
    await prisma.user.delete({ where: { user_id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: 'This user still has prices, listings, or enquiries and cannot be deleted',
      });
    }
    console.error('DELETE /api/admin/users/:id failed:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
