# BSON NumberUtils Error Fix

## Problem
Error: `Cannot read properties of undefined (reading 'NumberUtils')` at `/var/task/backend/node_modules/mongodb/lib/bson.js:36:43`

This error occurs when MongoDB driver tries to access BSON's `NumberUtils` but BSON isn't properly loaded or there's a version mismatch.

## Root Cause
- MongoDB driver 6.3.0 expects BSON 5.x
- Vercel bundling might be creating dependency conflicts
- BSON module not properly resolved during serverless function bundling

## Fixes Applied

### 1. Pinned Exact BSON Version
Changed from `^5.5.1` (allows patch updates) to `5.5.1` (exact version):

**Root `package.json`:**
```json
"bson": "5.5.1"
"overrides": {
  "bson": "5.5.1"
}
```

**Backend `package.json`:**
```json
"bson": "5.5.1"
"overrides": {
  "bson": "5.5.1"
}
```

### 2. Added resolutions (for yarn if used)
Added `resolutions` field to force BSON version in all nested dependencies.

### 3. Added Install Command
Added to `vercel.json`:
```json
"installCommand": "npm install --legacy-peer-deps"
```

This ensures npm doesn't fail on peer dependency conflicts.

## Next Steps

### 1. Commit and Push
```bash
git add package.json backend/package.json vercel.json
git commit -m "Fix: Pin exact BSON version 5.5.1 to resolve NumberUtils error"
git push origin main
```

### 2. Redeploy on Vercel
After pushing, Vercel will automatically redeploy. Wait 1-2 minutes.

### 3. Verify Fix
Check Vercel function logs:
- Should NOT see `NumberUtils` errors
- Function should load successfully
- API endpoints should work

## If Issue Persists

### Option 1: Check if MongoDB driver version is compatible
Try downgrading MongoDB driver to a known stable version:

```json
"mongodb": "^6.2.0"
```

### Option 2: Clear Vercel build cache
1. Go to Vercel project → Settings → General
2. Clear Build Cache
3. Redeploy

### Option 3: Update to latest compatible versions
```bash
npm install mongodb@latest mongoose@latest bson@5.5.1
```

### Option 4: Use npm ci for clean install
Update `vercel.json`:
```json
"installCommand": "npm ci --legacy-peer-deps"
```

## Verification

After deployment, the error should be resolved. Check:
- ✅ No `NumberUtils` errors in logs
- ✅ Function loads without crashing
- ✅ Health endpoint works: `/health`
- ✅ API endpoints respond correctly

## Additional Notes

- The `--legacy-peer-deps` flag helps with dependency resolution
- Pinning exact version prevents unexpected updates
- `overrides` and `resolutions` ensure all packages use same BSON version
- This fix works for both npm and yarn package managers

