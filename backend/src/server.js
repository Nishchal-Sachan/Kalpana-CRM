require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.disable('x-powered-by');
app.set('etag', false);
app.use(compression());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Always allow any localhost / 127.0.0.1 origin in development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow explicitly listed production origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow Kalpana Solar production domains, Render app URLs, and Vercel deployments
    if (/^https?:\/\/([a-zA-Z0-9-]+\.)*(kalpanasolar\.com|onrender\.com|vercel\.app)$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  maxAge: 86400,
}));
app.use(express.json());

// API Router
const apiRouter = express.Router();

apiRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

apiRouter.use('/auth', require('./routes/auth'));
apiRouter.use('/users', require('./routes/users'));
apiRouter.use('/leads', require('./routes/leads'));
apiRouter.use('/stock', require('./routes/stock'));
apiRouter.use('/quotations', require('./routes/quotations'));
apiRouter.use('/complaints', require('./routes/complaints'));
apiRouter.use('/orders', require('./routes/orders'));
apiRouter.use('/dashboard', require('./routes/dashboard'));
apiRouter.use('/attendance', require('./routes/attendance'));
apiRouter.get('/health', (req, res) => res.json({ status: 'ok', app: 'Kalpana Solar API' }));

// Mount under both /api and root / so calls succeed whether VITE_API_URL includes /api or not
app.use('/api', apiRouter);
app.use(apiRouter);

// Fallback 404 handler returning JSON instead of raw HTML
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

const { sendError } = require('./utils/sendError');

app.use((err, req, res, next) => {
  sendError(res, err, 'Server error. Please try again.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Kalpana Solar API running on port ${PORT}`));
