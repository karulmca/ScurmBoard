# Authentication System Setup Guide

## Overview
A complete authentication system has been created for the Scrum Board application, including:
- User registration and login pages
- Password hashing and JWT token authentication (backend)
- Team and project assignment after registration/login
- Authentication state management in the frontend
- API gateway routing for auth endpoints

## Files Created/Modified

### Backend Changes

#### New Files:
- **`backend/app/core/security.py`** - Password hashing, JWT token generation and verification

#### Modified Files:
1. **`backend/requirements.txt`** - Added:
   - `bcrypt==4.1.2` - Password hashing
   - `python-jose[cryptography]==3.3.0` - JWT handling
   - `passlib==1.7.4` - Password utilities

2. **`backend/app/models/user.py`** - Added:
   - `password_hash` field to User model

3. **`backend/app/schemas/user.py`** - Added:
   - `UserLogin` schema for login requests
   - `UserCreate` schema updated to include password
   - `Token` schema for login response

4. **`backend/app/services/user_service.py`** - Added:
   - `get_user_by_email()` - Look up user by email
   - `authenticate_user()` - Verify email/password
   - Password hashing in `create_user()`

5. **`backend/app/controllers/user_controller.py`** - Added:
   - `POST /register` endpoint - Register new user
   - `POST /login` endpoint - Login user and return JWT token

### Frontend Changes

#### New Files:
1. **`frontend/src/services/auth.js`** - Authentication service with:
   - `registerUser()` - Register new user
   - `loginUser()` - Login user
   - `logoutUser()` - Logout and clear session
   - `getAuthToken()` - Get stored JWT token
   - `getAuthUser()` - Get logged-in user info
   - `isAuthenticated()` - Check if user is authenticated

2. **`frontend/src/components/Login.jsx`** - Login page component
   - Email and password input fields
   - Error handling and loading states
   - Link to registration page

3. **`frontend/src/components/Register.jsx`** - Registration page component
   - Full name, email, and password input fields
   - Password confirmation validation
   - Error handling and loading states
   - Link to login page

4. **`frontend/src/components/TeamProjectAssignment.jsx`** - Team/Project assignment page
   - Multi-select checkboxes for teams
   - Multi-select checkboxes for projects
   - Assignment completion button

5. **`frontend/src/styles/auth.css`** - Styling for login/register pages
   - Gradient background
   - Card-based layout
   - Responsive design

6. **`frontend/src/styles/assignment.css`** - Styling for assignment page
   - Grid layout for team/project selection
   - Responsive design

#### Modified Files:
1. **`frontend/src/App.jsx`** - Updated with:
   - Authentication flow integration
   - Login/Register page display when not authenticated
   - Team/Project assignment page after register/login
   - Logout button in topbar
   - Auth state management using auth service

### API Gateway Changes

#### New Files:
- **`gateway/src/routes/users.js`** - Auth endpoint routing
  - `POST /api/users/login`
  - `POST /api/users/register`
  - User CRUD endpoints
  - Project role endpoints

#### Modified Files:
- **`gateway/src/index.js`** - Added users router to gateway routes

## How to Use

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Update Database
The backend automatically runs migrations and creates tables on startup. However, since you're adding a password field to existing users, you may need to:

Option A: Delete existing database to start fresh (if development only):
```bash
# Remove the database file if SQLite
```

Option B: Run a migration script to add password_hash to existing users:
```bash
# Run a migration or update script
# For now, recommend starting fresh
```

### 3. Start the Backend Server
The backend should already be running. If not:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start the API Gateway
```bash
cd gateway
npm install  # if not already done
npm start    # or: node src/index.js
```

### 5. Start the Frontend
```bash
cd frontend
npm install  # if not already done
npm run dev  # starts on http://localhost:5173
```

## Usage Flow

1. **First Time User:**
   - Navigate to `http://localhost:5173`
   - Click "Register" link or select "Register" tab
   - Enter name, email, password
   - Submit registration form
   - Upon successful registration, redirected to Team/Project assignment page
   - Select teams and projects to assign to
   - Click "Get Started" to access the main board

2. **Returning User:**
   - Navigate to `http://localhost:5173`
   - Enter email and password
   - Click "Login"
   - Upon successful login, redirected to Team/Project assignment page if new
   - Otherwise, directed to main dashboard

3. **Logout:**
   - Click "Logout" button in top right of the governance screen
   - Returns to login page
   - Session and auth token are cleared

## API Endpoints (via Gateway on Port 3000)

### Authentication
- `POST /api/users/register` - Register new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
  
- `POST /api/users/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
  Response:
  ```json
  {
    "access_token": "eyJhbGci...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "settings": null,
      "created_at": "2026-03-16T10:30:00",
      "updated_at": "2026-03-16T10:30:00"
    }
  }
  ```

### Users
- `GET /api/users` - List all users
- `GET /api/users/{userId}` - Get user details
- `POST /api/users` - Create user
- `PATCH /api/users/{userId}` - Update user profile
- `DELETE /api/users/{userId}` - Delete user

## Security Notes

⚠️ **Important for Production**

1. **Change the SECRET_KEY in `backend/app/core/security.py`**
   - Current: `"your-secret-key-change-in-production"`
   - Use a strong, random string (e.g., from `secrets` module)

2. **HTTPS Only**
   - Always use HTTPS in production (not HTTP)

3. **CORS Settings**
   - Update `CORS_ORIGINS` in backend (`main.py`)
   - Should only allow your frontend domain, not "*"

4. **Password Requirements**
   - Minimum 6 characters (can increase)
   - Consider adding complexity requirements

5. **Rate Limiting**
   - Already implemented on gateway (200 requests/minute)
   - Consider stricter limits for login endpoint

6. **JWT Token Expiration**
   - Currently 30 minutes (configured in `security.py`)
   - Update `ACCESS_TOKEN_EXPIRE_MINUTES` as needed

## Troubleshooting

### "Email already registered" error
- The email is already in use
- Use a different email or login if you have credentials

### "Invalid email or password" error
- Check that email and password are correct
- Passwords are case-sensitive

### Dependencies not found
- Run `pip install -r requirements.txt` in backend folder
- Run `npm install` in gateway and frontend folders

### Port already in use
- Backend trying to use 8000: Kill process or change port in `uvicorn` command
- Gateway trying to use 3000: Change in `.env` or gateway code
- Frontend trying to use 5173: Vite will suggest alternate port

### CORS errors in browser console
- Make sure gateway is running and forwarding requests properly
- Check gateway routes are correctly configured

## Next Steps

1. **Session Persistence**: Add JWT token refresh mechanism
2. **Email Verification**: Add email verification before account activation
3. **Password Reset**: Implement forgot password functionality
4. **Two-Factor Authentication**: Add optional 2FA
5. **Role-Based Access Control**: Implement permission system for team/project assignments
6. **Social Login**: Add Google/GitHub OAuth options (optional)

## Testing

You can test the endpoints using:

1. **Using curl:**
```bash
# Register
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Using Postman:**
   - Import the endpoints
   - Test registration and login flows

3. **Using the Web UI:**
   - Navigate to http://localhost:5173
   - Test registration and login through the UI

## Support

For issues or questions:
1. Check the browser console for error messages
2. Check backend server logs for API errors
3. Ensure all services are running (backend on 8000, gateway on 3000, frontend on 5173)
4. Check database connectivity and migrations
