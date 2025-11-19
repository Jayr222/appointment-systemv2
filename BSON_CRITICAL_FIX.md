# Critical BSON NumberUtils Fix

## Problem
Persistent error: `Cannot read properties of undefined (reading 'NumberUtils')` at `/var/task/backend/node_modules/mongodb/lib/bson.js:36:43`

This happens when MongoDB driver loads but can't find BSON's NumberUtils property.

## Latest Fixes Applied

### 1. Downgraded MongoDB Driver
- Changed from `6.3.0` to `6.2.0` (more stable with Vercel)
- Updated in both root and backend package.json

### 2. Enhanced BSON Preload (`api/bson-preload.js`)
- Added global assignment
- Added module cache assignment
- Added process assignment
- Logs confirmation with NumberUtils check

### 3. Added Vercel Include Files
- Added `"includeFiles": "node_modules/bson/**"` to vercel.json
- Ensures BSON files are included in the bundle

### 4. Multiple BSON Imports
- `api/index.js` - imports preload first
- `backend/src/config/db.js` - imports BSON
- `backend/src/services/storageService.js` - imports BSON

## Next Steps

1. **Commit and Push:**
   ```bash
   git add package.json backend/package.json vercel.json api/bson-preload.js
   git commit -m "Fix: Downgrade MongoDB to 6.2.0 and enhance BSON preload"
   git push origin main
   ```

2. **Clear Vercel Build Cache** (IMPORTANT!)
   - Go to Vercel project → Settings → General
   - Click "Clear Build Cache"
   - This ensures fresh dependency installation

3. **Redeploy**
   - After clearing cache, redeploy manually or push again

4. **Check Logs**
   - Should see: "✅ BSON preloaded successfully { hasNumberUtils: true }"
   - Should NOT see: NumberUtils errors

## If Still Failing

### Option 1: Try MongoDB 6.1.0
If 6.2.0 doesn't work, try even older version:
```json
"mongodb": "6.1.0"
```

### Option 2: Check Vercel Build Logs
Look for:
- Which package.json is being used (root vs backend)
- Where BSON is being installed
- Any BSON version conflicts

### Option 3: Contact Vercel Support
This might be a Vercel bundling issue that requires their support.

## Root Cause Hypothesis

The error path `/var/task/backend/node_modules/` suggests:
1. Vercel might be installing dependencies in backend folder
2. Or bundling is creating module resolution issues
3. MongoDB driver can't find BSON when it needs it

The fixes above should address all these possibilities.

