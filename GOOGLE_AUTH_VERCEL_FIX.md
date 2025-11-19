# Google Auth Fix for Separate Vercel Deployments

## Problem
When deploying frontend and backend as separate Vercel projects, Google Sign-In fails with "An error occurred during sign-in. Please try again."

## Root Causes
1. **Incorrect API URL concatenation** - Frontend was using `${API_URL}${API_BASE_URL}` causing double URLs
2. **CORS not configured** - Backend wasn't allowing requests from frontend domain
3. **Missing environment variables** - Both projects need proper env vars set

## Fixes Applied

### 1. Fixed Frontend API URL (GoogleSignIn.jsx)
**Before:**
```javascript
const response = await fetch(`${API_URL}${API_BASE_URL}/auth/google/verify`, {
```

**After:**
```javascript
const response = await fetch(`${API_BASE_URL}/auth/google/verify`, {
```

### 2. Updated CORS Configuration (backend/src/server.js)
- Now properly allows frontend domain
- Allows Vercel preview URLs (*.vercel.app)
- Allows localhost for development

## Required Environment Variables

### Backend Vercel Project

Go to your **Backend** Vercel project → Settings → Environment Variables

**Required Variables:**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://your-frontend-project.vercel.app
GOOGLE_REDIRECT_URI=https://your-backend-project.vercel.app/api/auth/google/callback
NODE_ENV=production
```

**Optional (for email functionality):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**For role-based access (optional):**
```
ADMIN_DOMAINS=admin@yourdomain.com
DOCTOR_DOMAINS=doctor@yourdomain.com
```

### Frontend Vercel Project

Go to your **Frontend** Vercel project → Settings → Environment Variables

**Required Variables:**
```
VITE_API_URL=https://your-backend-project.vercel.app
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Important Notes:**
- `VITE_API_URL` should be your **backend** Vercel URL (without `/api`)
- Example: `https://appointment-system-backend.vercel.app`
- The frontend code will automatically add `/api` to the path

## Google Cloud Console Setup

### 1. Update Authorized JavaScript Origins
Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Your OAuth 2.0 Client ID

**Add these origins:**
```
https://your-frontend-project.vercel.app
https://your-backend-project.vercel.app
http://localhost:5173 (for local development)
```

### 2. Update Authorized Redirect URIs
**Add these redirect URIs:**
```
https://your-backend-project.vercel.app/api/auth/google/callback
http://localhost:5173 (for local development)
```

**Note:** The redirect URI should point to your **backend** URL, not frontend.

## Deployment Steps

### 1. Update Environment Variables
- Set all environment variables in both Vercel projects (see above)
- Make sure `FRONTEND_URL` in backend matches your frontend Vercel URL
- Make sure `VITE_API_URL` in frontend matches your backend Vercel URL

### 2. Redeploy Both Projects
After setting environment variables:

**Backend:**
1. Go to Backend Vercel project → Deployments
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**

**Frontend:**
1. Go to Frontend Vercel project → Deployments
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**

### 3. Test Google Sign-In
1. Go to your frontend URL
2. Click "Sign in with Google"
3. Select your Google account
4. Should successfully authenticate and redirect to dashboard

## Troubleshooting

### Error: "An error occurred during sign-in"
1. **Check browser console** - Open DevTools (F12) → Console tab
   - Look for fetch errors
   - Check if API URL is correct
   - Look for CORS errors

2. **Check Vercel Function Logs:**
   - Go to Backend Vercel project → Functions tab
   - Click on the function
   - View logs for errors

3. **Verify Environment Variables:**
   - Backend: Check that `FRONTEND_URL` matches frontend domain
   - Frontend: Check that `VITE_API_URL` matches backend domain (without `/api`)
   - Both: Verify `GOOGLE_CLIENT_ID` matches

4. **Test API endpoint directly:**
   ```bash
   curl -X POST https://your-backend-project.vercel.app/api/auth/google/verify \
     -H "Content-Type: application/json" \
     -H "Origin: https://your-frontend-project.vercel.app" \
     -d '{"idToken":"test"}'
   ```

### CORS Errors
- Make sure `FRONTEND_URL` in backend environment variables is set correctly
- Check that frontend domain is in allowed origins
- Verify CORS is configured to allow credentials

### 404 Not Found
- Verify the route exists: `/api/auth/google/verify`
- Check that backend is deployed correctly
- Ensure `vercel.json` rewrites are configured properly

### 401 Unauthorized
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check Google Cloud Console for authorized origins
- Ensure Google OAuth consent screen is configured

## Testing Locally

If you want to test with separate frontend/backend locally:

**Backend `.env`:**
```
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Google Cloud Console:**
- Add `http://localhost:5173` to Authorized JavaScript Origins
- Add `http://localhost:5000/api/auth/google/callback` to Redirect URIs

## Quick Checklist

- [ ] Backend `FRONTEND_URL` set to frontend Vercel URL
- [ ] Frontend `VITE_API_URL` set to backend Vercel URL (without `/api`)
- [ ] Both projects have `GOOGLE_CLIENT_ID` set
- [ ] Backend has `GOOGLE_CLIENT_SECRET` set
- [ ] Google Cloud Console has frontend URL in Authorized Origins
- [ ] Google Cloud Console has backend callback URL in Redirect URIs
- [ ] Both projects redeployed after setting env vars
- [ ] Browser console shows no errors
- [ ] Vercel function logs show no errors

## Next Steps

After fixing, your Google Sign-In should work! If you still have issues:

1. Check Vercel deployment logs for both projects
2. Check browser console for client-side errors
3. Check Vercel function logs for server-side errors
4. Verify all environment variables are set correctly
5. Test the API endpoint directly with curl or Postman

