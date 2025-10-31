# 🔧 Fix Google Sign-In 403 Error

## ⚠️ Error: "The given origin is not allowed for the given client ID"

This means your Google OAuth credentials don't have the correct origin configured!

---

## 🔍 Your Client ID Found

I can see your Google Client ID: `275840736066-rahvivdhs11r0s15quq3o7fr5ivprkvk.apps.googleusercontent.com`

---

## ✅ Fix Steps

### Step 1: Go to Google Cloud Console

1. Visit: **https://console.cloud.google.com**
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one above)
5. Click **Edit** (pencil icon)

### Step 2: Add Authorized Origins

Under **Authorized JavaScript origins**, ADD:
```
http://localhost:5173
http://localhost:3000
```

Under **Authorized redirect URIs**, ADD:
```
http://localhost:5173
http://localhost:5000/api/auth/google/callback
http://localhost:3000
```

### Step 3: Save Changes

Click **Save** at the bottom

### Step 4: Wait 5-10 Minutes

Google changes can take a few minutes to propagate

### Step 5: Restart Your Frontend

```bash
cd frontend
npm run dev
```

---

## ✅ Button Width Fixed

I've also fixed the button width from `100%` to `400` pixels (the correct value for Google's button).

---

## 🎉 Success!

After adding the origins and restarting, Google Sign-In will work perfectly!

---

**The 403 error will disappear once you add `http://localhost:5173` to your Google OAuth settings! 🔐**

