require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
const corsMiddleware = require('./middleware/cors');
const workitemsRouter = require('./routes/workitems');
const tasksRouter     = require('./routes/tasks');
const reportsRouter   = require('./routes/reports');
const importRouter    = require('./routes/import');
const projectsRouter  = require('./routes/projects');
const configRouter    = require('./routes/config');
const teamsRouter     = require('./routes/teams');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(corsMiddleware);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate-limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use(limiter);

// ── Root info ─────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Scrum Board API Gateway',
    version: '1.0.0',
    status: 'running',
    webUI: 'http://localhost:5173',
    mobileWeb: 'http://localhost:8081',
    endpoints: {
      health:    'GET  /health',
      workitems: 'GET|POST|DELETE /api/workitems',
      tasks:     'GET|PATCH /api/tasks',
      reports:   'GET /api/reports/daily|weekly|monthly',
      import:    'POST /api/import',
    },
  });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', gateway: 'scrum-board', uptime: process.uptime() });
});

// ── API routes (all proxied to FastAPI) ───────────────────────────────────────
app.use('/api/workitems', workitemsRouter);
app.use('/api/tasks',     tasksRouter);
app.use('/api/reports',   reportsRouter);
app.use('/api/import',    importRouter);
app.use('/api',           teamsRouter);
app.use('/api',           projectsRouter);
app.use('/api/config',    configRouter);

// ── Catch-all ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Gateway Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal gateway error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Scrum Board Gateway running on http://localhost:${PORT}`);
  console.log(`   → Proxying to FastAPI at ${process.env.FASTAPI_URL}\n`);
});
