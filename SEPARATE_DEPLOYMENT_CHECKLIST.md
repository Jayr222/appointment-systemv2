# Separate Deployment Checklist ✅

Since you've deployed frontend and backend as **separate Vercel projects**, here's what needs to be configured:

## Your Setup
- **Frontend**: `https://appointment-systemv2.vercel.app`
- **Backend**: `https://sunvalleymegahealthcenter.vercel.app`

---

## ✅ Backend Vercel Project Configuration

### Environment Variables Required:
Go to **Backend** Vercel project → Settings → Environment Variables

**Required:**
```
FRONTEND_URL=https://appointment-systemv2.vercel.app
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://sunvalleymegahealthcenter.vercel.app/api/auth/google/callback
NODE_ENV=production
```

**Optional (for email):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Important Notes:
- `FRONTEND_URL` should be your **frontend** domain (where users access your app)
- `GOOGLE_REDIRECT_URI` should be your **backend** domain (where OAuth callback is handled)

---

## ✅ Frontend Vercel Project Configuration

### Environment Variables Required:
Go to **Frontend** Vercel project → Settings → Environment Variables

**Required:**
```
VITE_API_URL=https://sunvalleymegahealthcenter.vercel.app
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Important Notes:
- `VITE_API_URL` should be your **backend** domain (without `/api` at the end)
- Example: `https://sunvalleymegahealthcenter.vercel.app` ✅
- NOT: `https://sunvalleymegahealthcenter.vercel.app/api` ❌
- The frontend code automatically adds `/api` to all requests

---

## ✅ Google Cloud Console Configuration

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Your OAuth 2.0 Client ID

### Authorized JavaScript Origins:
Add these URLs:
```
https://appointment-systemv2.vercel.app
https://sunvalleymegahealthcenter.vercel.app
http://localhost:5173 (for local development)
```

### Authorized Redirect URIs:
Add these URLs:
```
https://sunvalleymegahealthcenter.vercel.app/api/auth/google/callback
http://localhost:5173 (for local development)
```

**Important:** The redirect URI must point to your **backend** domain, not frontend!

---

## ✅ Verify Configuration

### 1. Test Backend Health
Open in browser:
```
https://sunvalleymegahealthcenter.vercel.app/health
```
Should return: `{"status":"OK","message":"Healthcare System API is running",...}`

### 2. Test CORS from Frontend
1. Open `https://appointment-systemv2.vercel.app`
2. Open browser DevTools (F12) → Console tab
3. Try to use the app
4. **Should NOT see CORS errors** ✅

### 3. Test API Endpoints
In browser console on frontend:
```javascript
fetch('https://sunvalleymegahealthcenter.vercel.app/api/site-content')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```
Should return site content without CORS errors.

### 4. Test Google Sign-In
1. Go to login page
2. Click "Sign in with Google"
3. Should successfully authenticate ✅

---

## ✅ Current Status After Fixes

With the recent fixes, you should have:

✅ **CORS Fixed** - OPTIONS preflight requests handled correctly  
✅ **API URLs Fixed** - Frontend uses correct backend URL  
✅ **BSON Fixed** - Version conflicts resolved  
✅ **Google Auth Fixed** - Correct endpoint URLs  

---

## 🔧 If Something Doesn't Work

### CORS Errors Still Appearing?
1. Check that `FRONTEND_URL` is set in backend environment variables
2. Clear browser cache (Ctrl+Shift+R)
3. Verify backend is redeployed with latest code

### Google Sign-In Fails?
1. Check `GOOGLE_CLIENT_ID` matches in both frontend and backend
2. Verify Google Cloud Console has correct redirect URI (backend domain)
3. Check browser console for specific error messages

### API Calls Fail?
1. Verify `VITE_API_URL` in frontend points to backend domain (without `/api`)
2. Check Vercel function logs for errors
3. Test backend health endpoint directly

---

## 📝 Quick Reference

**Frontend Environment Variables:**
- `VITE_API_URL` = Backend URL (without `/api`)
- `VITE_GOOGLE_CLIENT_ID` = Google Client ID

**Backend Environment Variables:**
- `FRONTEND_URL` = Frontend URL (where users go)
- `GOOGLE_REDIRECT_URI` = Backend URL + `/api/auth/google/callback`
- `GOOGLE_CLIENT_ID` = Same as frontend
- `GOOGLE_CLIENT_SECRET` = Google Client Secret

**Google Cloud Console:**
- JavaScript Origins: Frontend URL, Backend URL
- Redirect URIs: Backend URL + `/api/auth/google/callback`

---

## ✅ Checklist

- [ ] Backend `FRONTEND_URL` environment variable set
- [ ] Frontend `VITE_API_URL` environment variable set
- [ ] Both projects have `GOOGLE_CLIENT_ID` set
- [ ] Backend has `GOOGLE_CLIENT_SECRET` set
- [ ] Google Cloud Console has frontend URL in Authorized Origins
- [ ] Google Cloud Console has backend callback URL in Redirect URIs
- [ ] Both projects redeployed after setting env vars
- [ ] Backend health endpoint works
- [ ] No CORS errors in browser console
- [ ] Google Sign-In works
- [ ] Site content loads

---

## 🚀 You're All Set!

After verifying all checkboxes above, your separate deployments should be working perfectly! 

If you encounter any issues, check:
1. Vercel function logs (Backend → Functions → View logs)
2. Browser console (F12 → Console tab)
3. Network tab (F12 → Network tab) for failed requests

