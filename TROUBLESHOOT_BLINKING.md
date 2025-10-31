# 🔧 Troubleshooting: Terms/Privacy Page Blinking

## The Error
```
ERR_BLOCKED_BY_CLIENT :5173/src/pages/PrivacyPolicy.jsx:1
```

## ✅ Quick Fix

**This is 99% caused by browser extensions (ad blockers)!**

### Try This First:
1. **Open Incognito/Private Window** (`Ctrl + Shift + N` or `Cmd + Shift + N`)
2. Navigate to `http://localhost:5173/login`
3. Click Terms/Privacy links
4. **If it works** → Your ad blocker is blocking it!

### Permanent Fix:
Add localhost to your ad blocker's whitelist:
- **uBlock Origin**: Click icon → Click power button → "Turn off for this site"
- **AdBlock**: Click icon → Settings → Manage → Add `localhost:5173`
- **Privacy Badger**: Click icon → Disable for this site

---

## Alternative Causes (Less Likely)

### If it still doesn't work after disabling extensions:

1. **Clear Browser Cache**
   - `Ctrl + Shift + Delete` (Windows)
   - `Cmd + Shift + Delete` (Mac)
   - Select "Cached images and files"
   - Clear

2. **Restart Dev Server**
   ```bash
   # Kill the process (Ctrl+C)
   cd frontend
   npm run dev
   ```

3. **Check Console for Real Errors**
   - Press `F12`
   - Go to Console tab
   - Look for actual errors (not blocked by client)

4. **Try Different Browser**
   - Chrome → Firefox
   - Firefox → Chrome
   - See if issue persists

---

## Verification Checklist

- ✅ Incognito mode works → Extension issue
- ✅ Incognito doesn't work → Check console for real errors
- ✅ No errors in console → Dev server issue, restart it
- ✅ Still blinking → Check network tab for failed requests

---

**99% of the time, it's an ad blocker! Try incognito first! 🎯**

