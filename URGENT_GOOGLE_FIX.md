# ⚠️ URGENT: Fix Google 403 Error NOW

## 🎯 Simple 3-Step Fix

---

## Step 1: Open Google Cloud Console

**Click here:** https://console.cloud.google.com/apis/credentials

Or manually:
1. Go to: https://console.cloud.google.com
2. Click **APIs & Services** (left menu)
3. Click **Credentials**

---

## Step 2: Find Your OAuth Client

1. Look for: **275840736066-rahvivdhs11r0s15quq3o7fr5ivprkvk**
2. Click the **pencil icon** (Edit) next to it

---

## Step 3: Add These Origins

### Scroll down to find these sections:

**Authorized JavaScript origins** - Click "ADD URI" and add:
```
http://localhost:5173
```

**Authorized redirect URIs** - Click "ADD URI" and add:
```
http://localhost:5173
```

### Then Click SAVE!

---

## Step 4: Wait & Restart

1. **Wait 2-5 minutes** (Google needs time to update)
2. **Restart frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

---

## ✅ Done!

Google Sign-In will work after this!

---

## 📸 Visual Guide

In Google Cloud Console, you'll see:

```
Authorized JavaScript origins (URI)
┌─────────────────────────────────┐
│ http://localhost:5173  ← ADD THIS!
└─────────────────────────────────┘

Authorized redirect URIs (URI)
┌─────────────────────────────────┐
│ http://localhost:5173  ← ADD THIS!
└─────────────────────────────────┘
```

---

**That's it! Just add `http://localhost:5173` to both sections! 🚀**

