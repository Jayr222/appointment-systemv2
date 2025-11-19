# CORS Fix for Separate Vercel Deployments

## Problem
CORS errors when accessing backend from separate frontend deployment:
- Frontend: `https://appointment-systemv2.vercel.app`
- Backend: `https://sunvalleymegahealthcenter.vercel.app`

Error: "Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present"

## Root Cause
In Vercel serverless functions, OPTIONS preflight requests need to be handled explicitly before the request reaches Express. The CORS middleware wasn't properly handling preflight requests in the serverless context.

## Fixes Applied

### 1. Added Explicit OPTIONS Handling in `api/index.js`
- Added `setCorsHeaders()` function to set CORS headers manually
- Handle OPTIONS preflight requests immediately and return
- Set CORS headers for all requests before passing to Express

**Key Changes:**
```javascript
// Handle OPTIONS preflight request
if (req.method === 'OPTIONS') {
  setCorsHeaders(res, origin);
  return res.status(200).end();
}

// Set CORS headers for all requests
setCorsHeaders(res, origin);
```

### 2. Enhanced CORS Configuration in `backend/src/server.js`
- Added `https://appointment-systemv2.vercel.app` explicitly to allowed origins
- Added more allowed headers: `Accept`, `Origin`
- Added `exposedHeaders` for proper header exposure
- Added `maxAge` for preflight caching (24 hours)
- Added explicit `app.options('*', cors(corsOptions))` route handler

### 3. Allowed Origins
The following origins are now allowed:
- `https://appointment-systemv2.vercel.app` (your frontend)
- `https://sunvalleymegahealthcenter.vercel.app` (your backend - if needed)
- All `*.vercel.app` domains (for preview deployments)
- `http://localhost:5173`, `http://localhost:3000`, `http://localhost:5174` (local development)
- `FRONTEND_URL` from environment variables

## How It Works

1. **Preflight Request (OPTIONS):**
   - Browser sends OPTIONS request with `Origin` header
   - `api/index.js` catches it immediately
   - Sets CORS headers and returns 200
   - Browser then sends actual request

2. **Actual Request:**
   - CORS headers are set in `api/index.js` before Express
   - Express CORS middleware adds additional headers
   - Response includes proper CORS headers

## Required Environment Variables

### Backend Vercel Project
Set in Backend Vercel project → Settings → Environment Variables:

```
FRONTEND_URL=https://appointment-systemv2.vercel.app
```

This ensures the frontend domain is always allowed.

## Testing

After deploying, test these endpoints from your frontend:

1. **Site Content:**
   ```
   GET https://sunvalleymegahealthcenter.vercel.app/api/site-content
   ```

2. **Auth Check:**
   ```
   GET https://sunvalleymegahealthcenter.vercel.app/api/auth/me
   ```

3. **Google Sign-In:**
   ```
   POST https://sunvalleymegahealthcenter.vercel.app/api/auth/google/verify
   ```

All should work without CORS errors.

## Verification

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a request from your frontend
4. Check the response headers - you should see:
   - `Access-Control-Allow-Origin: https://appointment-systemv2.vercel.app`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin`
   - `Access-Control-Allow-Credentials: true`

## Next Steps

1. **Commit and Push:**
   ```bash
   git add api/index.js backend/src/server.js
   git commit -m "Fix: Add explicit CORS handling for Vercel serverless functions"
   git push origin main
   ```

2. **Wait for Deployment:**
   - Vercel will automatically deploy the backend
   - Wait 1-2 minutes for deployment to complete

3. **Test:**
   - Try accessing your frontend
   - Check browser console - CORS errors should be gone
   - Test Google Sign-In
   - Test other API calls

## If CORS Errors Persist

1. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Check Vercel Function Logs:**
   - Go to Backend Vercel project → Functions tab
   - Click on the function
   - Check logs for CORS-related errors

3. **Verify Environment Variables:**
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Should match your frontend domain exactly

4. **Check Allowed Headers:**
   - If you're sending custom headers, add them to `allowedHeaders` in both `api/index.js` and `server.js`

## Additional Notes

- CORS headers are set at multiple levels for redundancy:
  1. In `api/index.js` (serverless wrapper) - handles OPTIONS immediately
  2. In Express CORS middleware - handles all requests
  3. Explicit OPTIONS route - fallback handler

- Preflight caching: Browsers will cache preflight responses for 24 hours (86400 seconds)

- Credentials: CORS is configured to allow credentials (cookies, authorization headers)

## Success Indicators

✅ No CORS errors in browser console  
✅ API requests succeed from frontend  
✅ Google Sign-In works  
✅ Site content loads  
✅ User authentication works  

