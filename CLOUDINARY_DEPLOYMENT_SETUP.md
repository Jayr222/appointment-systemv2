# Cloudinary Setup for Production Deployment ☁️

## Problem: File Uploads on Serverless Platforms

When deploying to serverless platforms like **Vercel** or **Netlify**, file uploads to the local filesystem **don't work** because:
- ❌ Filesystems are **read-only**
- ❌ Uploaded files are **deleted on restart**
- ❌ Files can't persist between function executions

## Solution: Cloudinary Cloud Storage ✅

The system now supports **both**:
- **Local storage** for development (files saved to `backend/uploads/`)
- **Cloudinary** for production (files saved to cloud)

The system **automatically detects** which to use based on environment variables!

---

## Step 1: Create Free Cloudinary Account

### 1. Sign Up
1. Go to: https://cloudinary.com/users/register_free
2. Create a free account (no credit card required)
3. Verify your email

### 2. Get Your Credentials
After logging in, you'll see your **Dashboard** with:
- **Cloud Name:** e.g., `dxyz123abc`
- **API Key:** e.g., `123456789012345`
- **API Secret:** e.g., `abcdefghijklmnopqrstuvwxyz123`

**Keep these safe!** You'll need them for deployment.

---

## Step 2: Local Development (Optional)

### Test Cloudinary Locally

If you want to test Cloudinary on your local machine:

1. **Create `.env` file** in `backend/` directory (if not exists)

2. **Add Cloudinary credentials:**
```env
# Cloudinary Configuration
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. **Restart backend server**
4. **Upload a document** - it will go to Cloudinary instead of local storage

### Keep Using Local Storage

To keep using local storage during development, **don't add** the Cloudinary variables or set:
```env
USE_CLOUDINARY=false
```

---

## Step 3: Production Deployment (REQUIRED)

### For Vercel Deployment

1. **Open your Vercel project**
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:

| Name | Value | Example |
|------|-------|---------|
| `USE_CLOUDINARY` | `true` | `true` |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | `dxyz123abc` |
| `CLOUDINARY_API_KEY` | Your API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Your API secret | `abcdefgh...` |

4. **Redeploy your application**

### For Netlify Deployment

1. **Open your Netlify site**
2. Go to **Site settings** → **Environment variables**
3. Add the same 4 variables as above
4. **Redeploy**

### For Heroku/Railway Deployment

1. **Go to your app dashboard**
2. Find **Config Vars** or **Variables** section
3. Add the same 4 variables
4. **Restart/Redeploy**

---

## How It Works

### Automatic Detection

The system checks for Cloudinary credentials on startup:

```javascript
// If all Cloudinary vars are set and USE_CLOUDINARY=true:
✅ Using Cloudinary for file storage

// Otherwise:
✅ Using local filesystem for file storage
```

### Upload Flow

**Development (Local):**
```
User uploads file → Multer → backend/uploads/document-123.pdf
```

**Production (Cloudinary):**
```
User uploads file → Multer → Cloudinary → URL: https://res.cloudinary.com/.../document-123.pdf
```

### What Files Are Uploaded?

- 📄 **Patient documents:** Lab results, medical certificates, prescriptions, X-rays
- 📝 **Document types:** PDFs, images (JPG, PNG), Word documents
- 📦 **Folder:** All files stored in `healthcare-documents/` folder on Cloudinary

---

## Verifying It Works

### Check Backend Logs

When your backend starts, you'll see:

**Local mode:**
```
📁 Using local filesystem for file storage
```

**Cloud mode:**
```
📁 Using Cloudinary for file storage
```

### Test Upload

1. **Login as Doctor** or **Admin**
2. **Go to Patient Documents**
3. **Upload a document**
4. **Success!** ✅

### Check Cloudinary Dashboard

1. **Login to Cloudinary**
2. **Go to Media Library**
3. **Open `healthcare-documents` folder**
4. **See your uploaded files!** 🎉

---

## Cloudinary Free Tier Limits

✅ **25 GB storage**  
✅ **25 GB bandwidth/month**  
✅ **Unlimited transformations**  
✅ **Perfect for small to medium apps!**

If you need more, Cloudinary has affordable paid plans.

---

## File Management

### Download Files

Files download automatically from either:
- **Local:** Server serves from `uploads/` folder
- **Cloudinary:** Browser downloads from Cloudinary URL

### Delete Files

When a document is deleted:
- **Local:** File removed from `backend/uploads/`
- **Cloudinary:** File removed from Cloudinary storage

**Automatic cleanup!** No orphaned files.

---

## Environment Variables Summary

### Required for Production:

```env
# Enable Cloudinary
USE_CLOUDINARY=true

# Cloudinary Credentials (get from dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Optional for Development:

```env
# Use local storage (default if not set)
USE_CLOUDINARY=false
```

---

## Troubleshooting

### ❌ "Server error" when uploading
**Cause:** Cloudinary credentials not set or incorrect  
**Fix:** Double-check environment variables in deployment platform

### ❌ Files not appearing in Cloudinary
**Cause:** `USE_CLOUDINARY` not set to `true`  
**Fix:** Set `USE_CLOUDINARY=true` in environment variables

### ❌ "403 Forbidden" errors
**Cause:** Incorrect API key or secret  
**Fix:** Copy credentials exactly from Cloudinary dashboard

### ❌ Still using local storage in production
**Cause:** Environment variables not loaded  
**Fix:** Redeploy after adding variables

---

## Code Changes Summary

### Files Modified:

1. **`backend/src/services/documentService.js`**
   - Added Cloudinary configuration
   - Auto-detects local vs cloud storage
   - Handles both upload methods

2. **`backend/src/controllers/patientDocumentController.js`**
   - Updated to handle Cloudinary file metadata
   - Stores Cloudinary public ID for deletion
   - Supports both local and cloud paths

3. **`backend/src/models/PatientDocument.js`**
   - Added `cloudinaryPublicId` field
   - Tracks cloud-stored files

4. **`backend/package.json`**
   - Added `cloudinary` package
   - Added `multer-storage-cloudinary` package

### New Packages Installed:

```json
"cloudinary": "latest"
"multer-storage-cloudinary": "latest"
```

---

## Migration from Local to Cloud

### Existing Files on Local Server

If you have files already uploaded to local storage:
- **They will continue to work** ✅
- **New uploads go to Cloudinary** ✅
- **No migration needed** - both systems work side-by-side

### Full Migration (Optional)

If you want to migrate old files to Cloudinary:
1. Download files from `backend/uploads/`
2. Upload them manually to Cloudinary
3. Update database records with new URLs

*This is optional and not required for the system to work!*

---

## Security Best Practices

### ✅ DO:
- Use environment variables for credentials
- Never commit `.env` files to git
- Keep API secrets private
- Use Cloudinary's access control features

### ❌ DON'T:
- Hardcode credentials in source code
- Share API secrets publicly
- Commit credentials to GitHub
- Use production credentials in development

---

## Summary Checklist

### For Local Development:
- ✅ `backend/uploads/` directory exists
- ✅ Backend server running
- ✅ Documents upload successfully

### For Production Deployment:
- ✅ Cloudinary account created
- ✅ Credentials copied from dashboard
- ✅ Environment variables set in deployment platform:
  - `USE_CLOUDINARY=true`
  - `CLOUDINARY_CLOUD_NAME=...`
  - `CLOUDINARY_API_KEY=...`
  - `CLOUDINARY_API_SECRET=...`
- ✅ Application redeployed
- ✅ Upload tested and working
- ✅ Files visible in Cloudinary dashboard

---

## Quick Start Commands

### Install Dependencies (Already Done):
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

### Test Local Storage:
```bash
# No Cloudinary env vars needed
npm run dev
# Upload a document → Saved to backend/uploads/
```

### Test Cloudinary:
```bash
# Add Cloudinary vars to backend/.env
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

npm run dev
# Upload a document → Saved to Cloudinary
```

---

## Support

### Cloudinary Documentation:
- https://cloudinary.com/documentation
- https://cloudinary.com/documentation/node_integration

### Need Help?
Check the backend logs for storage mode:
```
📁 Using Cloudinary for file storage  ← Production mode
📁 Using local filesystem for file storage  ← Development mode
```

---

## ✅ You're All Set!

**Local Development:** Works out of the box ✅  
**Production Deployment:** Just add Cloudinary credentials ✅  
**File Uploads:** Working everywhere! 🎉

