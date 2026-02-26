const cors = require('cors');

const ALLOWED_ORIGINS = [
  'http://localhost:8081',   // Expo web (metro bundler default)
  'http://localhost:19006',  // Expo web (older)
  'http://localhost:3000',   // gateway itself (for browser tests)
  'http://localhost:5173',   // Vite dev server (legacy frontend)
  'http://10.0.2.2:3000',    // Android emulator → host machine
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow mobile apps (no origin) + whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};

module.exports = cors(corsOptions);
