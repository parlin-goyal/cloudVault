const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { requireAjaxHeader } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1); // Runs behind Nginx on EC2
app.disable('x-powered-by');

// ---------- Security and logging ----------
app.use(helmet());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Only needed if React is served from a different origin than the API.
// With Nginx (production) and the Vite proxy (development), both share one origin.
if (env.clientOrigin) {
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
}

// ---------- Body parsing ----------
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ---------- Routes ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

app.use('/api', apiLimiter, requireAjaxHeader);
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// ---------- Errors ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
