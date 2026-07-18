require('dotenv/config');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const pricesRouter = require('./routes/prices');
const listingsRouter = require('./routes/listings');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hinga-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/prices', pricesRouter);
app.use('/api/listings', listingsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Hinga backend listening on port ${PORT}`);
});
