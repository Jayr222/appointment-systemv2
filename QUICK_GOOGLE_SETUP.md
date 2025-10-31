# 🔐 Quick Google Sign-In Setup

## ✅ Packages Installed Successfully!

The Google Sign-In feature has been fully implemented in your code!

---

## 🔧 To Enable Google Sign-In:

### Step 1: Get Google Credentials (Required)

1. Visit: https://console.cloud.google.com
2. Create/Select a project
3. Enable **Google+ API** or **Google Identity Services**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Set as **Web application**
6. Add authorized origins: `http://localhost:5173`
7. Copy your **Client ID**

### Step 2: Update Your .env Files

**Update `backend/.env`:**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

**Create `frontend/.env`:**
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Step 3: Restart Servers

```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

---

## ✅ That's It!

Once you add the Google credentials, the **"Sign in with Google"** button will appear on your login page and work automatically!

---

**See `GOOGLE_AUTH_COMPLETE.md` for full details! 📚**

