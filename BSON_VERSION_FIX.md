# BSON Version Conflict Fix

## Problem
Error: "Unsupported BSON version, bson types must be from bson 5.x.x"

This happens when Mongoose and MongoDB driver depend on different versions of BSON, causing a version conflict.

## Solution Applied

Added `overrides` field to root `package.json` to force BSON 5.5.1 for all dependencies:

```json
{
  "overrides": {
    "bson": "^5.5.1"
  }
}
```

## Next Steps

### 1. Clean Install (Important!)

After updating package.json, you need to reinstall dependencies:

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with override
npm install
```

### 2. For Vercel Deployment

The `overrides` field is already in `package.json`, so Vercel will automatically use it when deploying.

**To redeploy:**
1. Commit the updated `package.json`
2. Push to trigger deployment
3. Or manually redeploy in Vercel dashboard

### 3. If Issue Persists

If you still get the error after clean install:

1. **Check for duplicate BSON installations:**
   ```bash
   npm list bson
   ```
   
   This will show all BSON versions. If you see multiple versions, the override should fix it.

2. **Force reinstall:**
   ```bash
   npm install --force
   ```

3. **Verify versions are compatible:**
   - MongoDB driver 6.x ✅ (requires BSON 5.x)
   - Mongoose 7.x ✅ (works with BSON 5.x)
   - BSON 5.5.1 ✅ (forced via override)

### 4. Alternative: Update Packages

If override doesn't work, try updating to latest compatible versions:

```bash
npm install mongoose@latest mongodb@latest bson@^5.5.1
```

## Root Cause

The error occurs because:
- Mongoose 7.x depends on a specific BSON version
- MongoDB driver 6.x also depends on BSON 5.x
- Sometimes npm installs different BSON versions for different packages
- The `overrides` field forces all packages to use the same BSON version

## Verification

After fixing, verify BSON is working:

```javascript
import mongoose from 'mongoose';
import { Types } from 'mongoose';

// This should work without errors
const testId = new Types.ObjectId();
console.log('BSON working!', testId);
```

## Additional Notes

- Always use `mongoose.Types.ObjectId` instead of importing from `bson` directly
- The override will ensure all nested dependencies use BSON 5.5.1
- This fix works for both local development and Vercel deployments

