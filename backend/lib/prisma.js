// Shared PrismaClient instance so every route reuses one connection pool.
const { PrismaClient } = require('../generated/prisma/client.mts');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
