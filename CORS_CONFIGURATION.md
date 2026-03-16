# CORS Configuration Guide

## Overview
Complete CORS (Cross-Origin Resource Sharing) configuration has been implemented across all layers of the Scrum Board application to ensure secure cross-origin communication between frontend, gateway, and backend services.

## Architecture
```
Frontend (http://localhost:5173)
    ↓ (CORS enabled)
API Gateway (http://localhost:3000)
    ↓ (CORS enabled)
FastAPI Backend (http://localhost:8000)
```

## CORS Configuration Details

### 1. Backend (FastAPI) - port 8000

**File:** `backend/app/main.py`

**Configuration:**
```python
CORS_ORIGINS = [
    "http://localhost:3000",   # API Gateway
    "http://localhost:5173",   # Vite dev server (frontend)
    "http://localhost:8081",   # Expo web
    "http://localhost:19006",  # Expo web (older)
    "http://10.0.2.2:3000",    # Android emulator
    "http://10.0.2.2:5173",    # Android emulator (frontend)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Range", "X-Content-Range"],
    max_age=3600,  # Cache preflight requests for 1 hour
)
```

**Key Features:**
- ✅ Specific origin whitelist (no wildcards)
- ✅ Authorization header support
- ✅ Credentials allowed (cookies, authorization)
- ✅ Preflight caching for performance
- ✅ Custom headers exposed for pagination

### 2. API Gateway (Express) - port 3000

**File:** `gateway/src/middleware/cors.js`

**Configuration:**
```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:8081',   // Expo web (metro bundler default)
  'http://localhost:19006',  // Expo web (older)
  'http://localhost:3000',   // gateway itself (for browser tests)
  'http://localhost:5173',   // Vite dev server (frontend)
  'http://10.0.2.2:3000',    // Android emulator → host machine
  'http://10.0.2.2:5173',    // Android emulator → frontend
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
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
```

**Key Features:**
- ✅ Whitelist-based origin validation
- ✅ Allows requests without origin (mobile apps, curl)
- ✅ All HTTP methods supported
- ✅ Authorization header forwarding
- ✅ Custom headers exposed
- ✅ Credentials support (cookies)
- ✅ CORS preflight caching

### 3. Frontend (React/Vite)

**File:** `frontend/src/services/auth.js`

**Auth Requests:**
```javascript
const response = await fetch(`${API_BASE_URL}/users/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
  credentials: 'include', // ✅ Include cookies in cross-origin requests
});
```

**File:** `frontend/src/services/api.js`

**All API Requests Include:**
```javascript
// Helper function for auth headers
function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`; // ✅ JWT token
  }
  
  return headers;
}

// All fetch calls include these options
async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
    credentials: 'include', // ✅ Cross-origin credentials
  });
  // ...
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    credentials: 'include', // ✅ Cross-origin credentials
  });
  // ...
}

async function patchJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    credentials: 'include', // ✅ Cross-origin credentials
  });
  // ...
}

async function deleteJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: 'include', // ✅ Cross-origin credentials
  });
  // ...
}
```

**Key Features:**
- ✅ Automatic JWT token injection
- ✅ `credentials: 'include'` for cookie support
- ✅ Consistent error handling
- ✅ Content-Type header for JSON
- ✅ File upload support with proper auth headers

## Request Flow

### 1. Login Request
```
Frontend (5173) 
  → OPTIONS request to Gateway (3000) - Preflight
  → POST /api/users/login with credentials
  → Gateway forwards to FastAPI (8000)
  → FastAPI validates credentials
  → Returns JWT token
  → Frontend stores in localStorage
```

### 2. Authenticated API Request
```
Frontend (5173)
  → Authorization: Bearer <JWT_TOKEN>
  → Gateway (3000) forwards with auth header
  → FastAPI (8000) validates token
  → Returns protected resource
```

### 3. CORS Preflight (Automatic)
```
Browser sends OPTIONS request:
  Origin: http://localhost:5173
  Access-Control-Request-Method: POST
  
Gateway responds:
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Methods: POST, PATCH, DELETE, etc.
  Access-Control-Allow-Headers: Authorization, Content-Type
  Access-Control-Allow-Credentials: true
  
Actual request is then sent...
```

## Supported Headers

### Request Headers (Allowed)
- `Content-Type` - Application/JSON for API calls
- `Authorization` - JWT token (`Bearer <token>`)
- `X-Requested-With` - XHR marker
- `Accept` - Content type preferences
- `Origin` - Origin verification

### Response Headers (Exposed)
- `Content-Range` - Pagination info
- `X-Content-Range` - Additional pagination
- `X-Total-Count` - Total items count

## Supported HTTP Methods
- GET ✅
- POST ✅
- PATCH ✅
- PUT ✅
- DELETE ✅
- OPTIONS ✅ (CORS preflight)
- HEAD ✅

## Supported Origins (Development)

### Desktop
- `http://localhost:3000` - API Gateway
- `http://localhost:5173` - Vite dev server
- `http://localhost:8081` - Expo web
- `http://localhost:19006` - Expo web (older)

### Mobile/Emulator
- `http://10.0.2.2:3000` - Android emulator accessing host (gateway)
- `http://10.0.2.2:5173` - Android emulator accessing host (frontend)

## Production Configuration

For production deployment, update these files:

### Backend
```python
# backend/app/main.py
CORS_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    # Only add your actual production domains
]
```

### Gateway
```javascript
// gateway/src/middleware/cors.js
const ALLOWED_ORIGINS = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  // Only add your actual production domains
];
```

### Security Settings
```python
# backend/app/core/security.py
# Change SECRET_KEY
SECRET_KEY = os.getenv("SECRET_KEY", "use-strong-random-key-in-production")

# Use environment variables
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    # Enforce HTTPS
    # Disable debug mode
    # Use secure cookies
```

## Troubleshooting

### 1. CORS Error in Browser Console
**Error:** `Access to XMLHttpRequest at 'http://localhost:8000/...' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution:**
- Ensure origin is in `CORS_ORIGINS` list (backend)
- Ensure origin is in `ALLOWED_ORIGINS` list (gateway)
- Check browser console for exact origin URL

### 2. Authorization Header Not Sent
**Problem:** API returns 401 Unauthorized

**Solution:**
- Check that token is stored in localStorage: `getAuthToken()`
- Verify token format: `Authorization: Bearer <token>`
- Check token expiration (default 30 minutes)
- Login again to refresh token

### 3. Preflight Request Failing
**Error:** OPTIONS request returns 403/405

**Solution:**
- Verify OPTIONS method is allowed
- Check `optionsSuccessStatus: 200` in gateway
- Clear browser cache and cookies

### 4. Credentials Not Included
**Problem:** Cookies not being sent with cross-origin requests

**Solution:**
- Add `credentials: 'include'` to fetch calls (already done)
- Backend must have `allow_credentials=True` (already done)
- Response must have `Access-Control-Allow-Credentials: true` (already done)

### 5. Missing Authorization Header in Forwarded Request
**Problem:** Backend receives request without Authorization header

**Solution:**
- Gateway middleware must forward headers (check proxy config)
- Frontend must include `Authorization` header (already done)
- Check gateway logs: `console.log(req.headers.authorization)`

## Testing CORS

### Using curl
```bash
# Test OPTIONS (preflight)
curl -i -X OPTIONS http://localhost:3000/api/users \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Test authenticated GET
curl -i http://localhost:3000/api/users \
  -H "Authorization: Bearer <your-token>" \
  -H "Origin: http://localhost:5173"

# Test POST with data
curl -i -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Using Postman
1. Set `Origin` header manually: `http://localhost:5173`
2. Add `Authorization: Bearer <token>` header
3. Test endpoints as normal
4. Check response headers for CORS info

### Browser DevTools
1. Open DevTools → Network tab
2. Make API request
3. Check response headers:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Credentials`

## Summary of Changes

| Component | Changes |
|-----------|---------|
| Backend | Added specific CORS origins, auth header support, preflight caching |
| Gateway | Enhanced CORS with logging, multiple origins, header forwarding |
| Frontend Auth | Added `credentials: 'include'` to login/register requests |
| Frontend API | Implemented centralized auth header injection in all API calls |

## Next Steps

1. ✅ CORS configured for development
2. ✅ Authentication headers properly set
3. ⚠️ **TODO:** Configure environment-specific CORS for staging/production
4. ⚠️ **TODO:** Add CORS monitoring and logging
5. ⚠️ **TODO:** Test with actual mobile apps
6. ⚠️ **TODO:** Set up security headers (CSP, X-Frame-Options, etc.)

## Related Documentation
- [Authentication Setup](./AUTHENTICATION_SETUP.md)
- [API Endpoints Documentation](./ENDPOINTS.md) (if exists)
- [Deployment Guide](./DEPLOYMENT.md) (if exists)
