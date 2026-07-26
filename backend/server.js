require('dotenv/config');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const pricesRouter = require('./routes/prices');
const listingsRouter = require('./routes/listings');
const enquiriesRouter = require('./routes/enquiries');
const weatherRouter = require('./routes/weather');
const diagnosisRouter = require('./routes/diagnosis');
const adminRouter = require('./routes/admin');

const app = express();
app.use(cors());
// 10mb limit so base64-encoded plant photos fit through /api/diagnosis
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hinga-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/prices', pricesRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/diagnosis', diagnosisRouter);
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 4000;

// Only listen when run directly (node server.js). When imported — e.g. by the
// Supertest integration tests — export the app so it can be exercised in-process
// without binding a port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Hinga backend listening on port ${PORT}`);
  });
}

module.exports = app;
