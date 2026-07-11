require('dotenv/config');
const express = require('express');
const cors = require('cors');

const pricesRouter = require('./routes/prices');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/prices', pricesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Hinga backend listening on port ${PORT}`);
});
