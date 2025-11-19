# Vercel Serverless Function Crash Fix

## Problem
Backend deployed on Vercel was crashing with:
```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

## Root Cause
The server had **top-level `await` calls** for database connection that executed when the module was imported:

```javascript
// This ran when server.js was imported - causing crash on cold starts
await connectDB();
await ensureDefaultAdmin();
```

In Vercel serverless functions:
1. On cold start, `api/index.js` imports `server.js`
2. The top-level `await` tries to connect to database immediately
3. If `MONGODB_URI` is missing or invalid, `process.exit(1)` was called
4. This crashed the function before it could handle any requests

## Fixes Applied

### 1. Lazy Database Connection (`backend/src/config/db.js`)
- Changed from immediate connection to lazy connection
- Only connects when first needed, not on module import
- Prevents multiple connection attempts
- Gracefully handles errors without crashing in serverless context

**Key Changes:**
```javascript
// Now uses connection state tracking
let isConnected = false;
let connectionPromise = null;

// Doesn't call process.exit(1) in serverless context
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  throw error; // Throw instead of exit
} else {
  process.exit(1); // Only exit in non-serverless
}
```

### 2. Lazy Initialization (`backend/src/server.js`)
- Removed top-level `await` calls
- App is created immediately (can be exported)
- Database connects on first request via middleware
- Health check endpoint works without DB connection

**Key Changes:**
```javascript
// App created first (no await)
const app = express();

// Database connection happens lazily via middleware
const ensureDB = async (req, res, next) => {
  await initializeDB();
  next();
};

// Health check skips DB check
if (path === '/health' || path === '/api/test') {
  return next(); // Skip DB check
}
```

## How It Works Now

### Before (❌ Crashed):
1. `api/index.js` imports `server.js`
2. `server.js` runs `await connectDB()` immediately
3. If DB fails → `process.exit(1)` → Function crashes

### After (✅ Works):
1. `api/index.js` imports `server.js`
2. `server.js` exports app immediately (no await)
3. First request comes in
4. Middleware checks DB connection
5. If not connected, connects now
6. Request proceeds normally
7. Health check works even if DB is down

## Required Environment Variables

Make sure your **Backend Vercel Project** has these set:

### Critical:
```
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=https://appointment-systemv2.vercel.app
```

### Important:
```
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://sunvalleymegahealthcenter.vercel.app/api/auth/google/callback
```

## Testing

### 1. Test Health Endpoint (Should work without DB):
```
https://sunvalleymegahealthcenter.vercel.app/health
```
Should return JSON with status OK even if DB is down.

### 2. Test Database Connection:
After setting `MONGODB_URI`, make any API request and check logs:
- Should see: `✅ Database initialized successfully`
- Should see: `MongoDB Connected: [your-host]`

### 3. Test Regular Endpoints:
```
https://sunvalleymegahealthcenter.vercel.app/api/site-content
```
Should work if `MONGODB_URI` is set correctly.

## If Still Crashing

### Check Vercel Function Logs:
1. Go to Backend Vercel project
2. Functions tab → Click on function
3. View logs for specific errors

### Common Issues:

1. **Missing MONGODB_URI:**
   - Check environment variables in Vercel
   - Verify variable name is exactly `MONGODB_URI`

2. **Invalid MongoDB URI:**
   - Format: `mongodb+srv://user:password@cluster.mongodb.net/dbname`
   - Or: `mongodb://user:password@host:port/dbname`
   - Test connection string in MongoDB Compass first

3. **Network/Timeout Issues:**
   - Vercel functions have 10-second timeout (free tier)
   - MongoDB connection might be timing out
   - Check if MongoDB allows connections from Vercel IPs
   - Verify MongoDB Atlas network access settings

4. **BSON Version Conflicts:**
   - Already fixed with `overrides` in package.json
   - Should use BSON 5.5.1

## Next Steps

1. **Set Environment Variables:**
   - Go to Backend Vercel project → Settings → Environment Variables
   - Add all required variables (especially `MONGODB_URI`)

2. **Redeploy:**
   ```bash
   git add backend/src/server.js backend/src/config/db.js
   git commit -m "Fix: Lazy database connection for Vercel serverless"
   git push origin main
   ```

3. **Wait for Deployment:**
   - Vercel will automatically deploy
   - Wait 1-2 minutes

4. **Test:**
   - Health endpoint should work immediately
   - Other endpoints should work after DB connects

## Success Indicators

✅ Health endpoint returns 200 OK  
✅ No more FUNCTION_INVOCATION_FAILED errors  
✅ Function logs show "Database initialized successfully"  
✅ API endpoints work correctly  
✅ No crashes on cold starts  

## Additional Notes

- The function can now be imported without crashing
- Database connects on first request (not on import)
- Health check works even if DB is unavailable
- Other endpoints return 503 if DB is unavailable (graceful error)
- Connection is cached after first successful connection

