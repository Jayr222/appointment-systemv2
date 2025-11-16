# Cloud Storage Setup Guide

This application supports multiple cloud storage providers for avatar uploads. The storage provider is automatically detected based on environment variables.

## Supported Storage Providers

### 1. Cloudinary (Recommended)
- Free tier: 25GB storage, 25GB bandwidth/month
- Automatic image optimization and transformations
- CDN included

**Setup:**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from the dashboard
3. Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Install package:**
```bash
npm install cloudinary
```

### 2. AWS S3
- Pay-as-you-go pricing
- Highly scalable
- Requires AWS account

**Setup:**
1. Create an S3 bucket in AWS
2. Create IAM user with S3 permissions
3. Add to `.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Install package:**
```bash
npm install @aws-sdk/client-s3
```

### 3. Vercel Blob Storage
- Integrated with Vercel
- Simple setup
- Good for Vercel deployments

**Setup:**
1. Get token from Vercel dashboard
2. Add to `.env`:
```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

**Install package:**
```bash
npm install @vercel/blob
```

### 4. Local Filesystem (Default for Development)
- No setup required
- Files stored in `backend/uploads/avatars/`
- Not suitable for production/serverless

### 5. Database Storage (Fallback)
- Base64 encoded in MongoDB
- Used when no cloud storage is configured
- Not recommended for production (increases database size)

## Storage Priority

The system automatically selects storage based on available environment variables:

1. **Cloudinary** - If `CLOUDINARY_CLOUD_NAME` is set
2. **AWS S3** - If `AWS_S3_BUCKET` is set
3. **Vercel Blob** - If `BLOB_READ_WRITE_TOKEN` is set
4. **Local Filesystem** - In development (if uploads directory exists)
5. **Database** - Fallback (base64 in MongoDB)

## Migration

When switching storage providers:
1. Old avatars will continue to work (URLs are preserved)
2. New uploads will use the new provider
3. To migrate existing avatars, you would need a migration script

## Notes

- Images are automatically optimized and resized (500x500px) when using Cloudinary
- Old avatars stored as filenames or base64 will continue to work
- Cloud storage URLs are stored directly in the database
- Local files are served via `/uploads/avatars/:filename` route

