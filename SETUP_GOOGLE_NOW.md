# 🔐 Setup Google Sign-In NOW

## ⚠️ "Google Sign-In Not Configured" Message

This means the Google Client ID is not set. Follow these steps:

---

## Quick Fix Steps

### Step 1: Get Your Google Client ID

1. Go to: **https://console.cloud.google.com**
2. Create/select a project
3. Enable **"Google Identity Services"** or **"Google+ API"**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client ID**
6. Select **Web application**
7. Add authorized origin: `http://localhost:5173`
8. Copy your **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### Step 2: Create `frontend/.env` File

**Create a new file** at: `frontend/.env`

**Add this content:**
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

**Replace** `your-google-client-id-here.apps.googleusercontent.com` with your actual Client ID from Step 1!

### Step 3: Restart Frontend Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

---

## ✅ Success!

Once you add the Client ID and restart, you'll see:
- ✅ Professional "Sign in with Google" button
- ✅ One-click Google authentication
- ✅ Automatic account creation
- ✅ Seamless login experience

---

## 🚫 Don't Have Google Credentials Yet?

**Option 1:** Get them now from Google Cloud Console (5 minutes)

**Option 2:** The traditional email/password login still works perfectly!

---

**Add your Google Client ID to enable the button! 🚀**

