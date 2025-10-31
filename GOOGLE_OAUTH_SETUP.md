# 🔐 Google OAuth 2.0 Sign-In Setup Guide

## 📋 Overview

This guide will help you set up Google Sign-In for your healthcare system.

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit: https://console.cloud.google.com
2. Create a new project or select existing one
3. Name it: "Barangay Health Center"

### 1.2 Enable Google+ API

1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 1.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **Barangay Health Center**
   - User support email: **your-email@gmail.com**
   - Developer contact: **your-email@gmail.com**
   - Save and Continue
   - Scopes: Add `email`, `profile`
   - Test users: Add your email
   - Back to Dashboard

4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: **Barangay Health Center Web Client**
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:5000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5173/auth/google/callback
     http://localhost:5000/api/auth/google/callback
     ```
   - Click **Create**

5. Copy your credentials:
   - **Client ID**: (starts with xxxxxx.apps.googleusercontent.com)
   - **Client Secret**: (long random string)

---

## Step 2: Install Dependencies

### Backend:
```bash
cd backend
npm install google-auth-library
```

### Frontend:
```bash
cd frontend
npm install @react-oauth/google
```

---

## Step 3: Configure Environment Variables

Add to `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

---

## Step 4: Implementation Files

The following files will be created:

### Backend:
- `backend/src/services/googleAuthService.js` - Google OAuth service
- `backend/src/routes/googleAuthRoutes.js` - Google auth routes
- Updates to `backend/src/controllers/authController.js` - Google sign-in logic

### Frontend:
- `frontend/src/components/auth/GoogleSignIn.jsx` - Google button component
- Updates to `frontend/src/pages/auth/Login.jsx` - Add Google button
- Updates to `frontend/src/main.jsx` - Wrap app with GoogleOAuthProvider

---

## Step 5: How It Works

### User Flow:
1. User clicks "Sign in with Google"
2. Redirects to Google login page
3. User approves and grants permissions
4. Google redirects back with auth code
5. Backend exchanges code for user info
6. System creates/logs in user account
7. JWT token generated
8. User logged in

### Security:
- OAuth 2.0 standard
- Secure token exchange
- No password storage for Google users
- JWT authentication maintained
- Role assigned on first login (default: patient)

---

## Step 6: Database Schema Updates

Users will have:
- `googleId`: Google user ID
- `authProvider`: "local" or "google"
- Other fields remain the same

---

## ✅ Testing Checklist

- [ ] Google credentials created
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Backend routes working
- [ ] Frontend button visible
- [ ] Google login flow working
- [ ] User data saved correctly
- [ ] JWT token generated
- [ ] Redirect after login working
- [ ] Role assignment working

---

## 🎯 Next Steps

After setup:
1. Test with your Google account
2. Verify user creation in database
3. Test role assignment
4. Verify JWT token generation
5. Test logout functionality

---

**Follow this guide step by step for complete Google Sign-In integration! 🚀**

