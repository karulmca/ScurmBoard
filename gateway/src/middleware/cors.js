const cors = require('cors');

const ALLOWED_ORIGINS = [
  'http://localhost:8081',   // Expo web (metro bundler default)
  'http://localhost:19006',  // Expo web (older)
  'http://localhost:3000',   // gateway itself (for browser tests)
  'http://localhost:5173',   // Vite dev server (frontend)
  'http://localhost:5174',   // Vite dev server (frontend - alternate port)
  'http://10.0.2.2:3000',    // Android emulator → host machine
  'http://10.0.2.2:5173',    // Android emulator → frontend
  'http://10.0.2.2:5174',    // Android emulator → frontend (alternate port)
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Also allow whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'X-Total-Count',
  ],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browsers
  maxAge: 3600, // Cache preflight requests for 1 hour
};

module.exports = cors(corsOptions);
