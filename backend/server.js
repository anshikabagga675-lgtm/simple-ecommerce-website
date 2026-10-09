require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const port = Number(process.env.PORT) || 5001;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random value of at least 32 characters.');
  process.exit(1);
}

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5501,http://localhost:5501')
  .split(',').map(origin => origin.trim()).filter(Boolean);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by the Simple Store API CORS policy.'));
  }
}));
app.use(express.json({ limit: '20kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use((req, res) => res.status(404).json({ message: 'Endpoint not found.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error.message);
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(item => item.message).join(' ');
    return res.status(400).json({ message });
  }
  if (error.name === 'CastError') return res.status(400).json({ message: 'A supplied identifier or value is invalid.' });
  return res.status(error.status || 500).json({ message: error.status ? error.message : 'The server could not complete the request.' });
});

connectDB().then(() => {
  app.listen(port, () => console.log(`Simple Store API listening at http://localhost:${port}`));
}).catch(error => {
  console.error(`Database connection failed: ${error.message}`);
  process.exit(1);
});

module.exports = app;
