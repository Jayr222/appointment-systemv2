# Vercel Redeployment Guide - Handling Failed Deployments

## How to Redeploy a Failed Deployment

### Method 1: Redeploy from Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com) and sign in
   - Navigate to your project

2. **Find the Failed Deployment**
   - Click on the **Deployments** tab
   - Look for the failed deployment (marked with ❌ red icon)

3. **Redeploy**
   - Click the **⋯** (three dots) menu on the failed deployment
   - Select **Redeploy**
   - Confirm the redeployment

### Method 2: Redeploy via Command Line

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Redeploy from your project directory
vercel --prod
```

### Method 3: Trigger New Deployment via Git

```bash
# Make a small change (like updating README) and commit
git add .
git commit -m "Trigger redeployment"
git push origin main
```

## Common Vercel Limit Issues & Solutions

### 1. Function Execution Timeout (Most Common)

**Free Tier:** 10 seconds max  
**Pro Tier:** 60 seconds max

**Symptoms:**
- `504 Gateway Timeout` errors
- `FUNCTION_INVOCATION_TIMEOUT` in logs

**Solutions:**

#### Option A: Optimize Your Code (Recommended)
- Break down long-running operations
- Use database indexes for faster queries
- Implement pagination for large data sets
- Cache frequently accessed data

#### Option B: Increase Function Timeout (Pro Plan Only)
Add to `vercel.json`:

```json
{
  "functions": {
    "api/index.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 60
    }
  }
}
```

#### Option C: Use Background Jobs
- Move heavy processing to background jobs
- Use Vercel Cron Jobs or external services (e.g., Upstash, BullMQ)

### 2. Build Time Limits

**Free Tier:** 45 minutes max  
**Pro Tier:** 45 minutes max

**Symptoms:**
- Build fails after 45 minutes
- Deployment stuck at "Building" stage

**Solutions:**
- Optimize your build process
- Reduce dependencies
- Use `.vercelignore` to exclude unnecessary files
- Consider splitting frontend/backend into separate projects

### 3. Memory Limits

**Free Tier:** 1024 MB  
**Pro Tier:** 3008 MB

**Symptoms:**
- `FUNCTION_MEMORY_LIMIT_EXCEEDED` errors
- Application crashes under load

**Solutions:**

Add to `vercel.json`:

```json
{
  "functions": {
    "api/index.js": {
      "runtime": "nodejs18.x",
      "memory": 3008
    }
  }
}
```

### 4. Request Body Size Limits

**Limit:** 4.5 MB for serverless functions

**Symptoms:**
- File uploads fail
- Large JSON payloads rejected

**Solutions:**
- Use Vercel Blob Storage for file uploads (recommended)
- Stream large files instead of buffering
- Compress data before sending

### 5. Environment Variable Limits

**Limit:** 4 KB per variable, 64 KB total

**Solutions:**
- Use Vercel's Environment Variable encryption for secrets
- Split large configs into multiple variables
- Use a secrets manager for sensitive data

## Optimizing Your Current Setup

### 1. Update `vercel.json` for Better Performance

```json
{
  "functions": {
    "api/index.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 10,
      "memory": 1024
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/uploads/(.*)", "destination": "/api/index.js" },
    { "source": "/health", "destination": "/api/index.js" }
  ]
}
```

### 2. Add `.vercelignore` (if not exists)

Create `.vercelignore` in your root directory:

```
node_modules
.git
.env.local
.env.development.local
.env.test.local
.env.production.local
backend/node_modules
frontend/node_modules
backend/src/scripts
*.log
```

### 3. Optimize Database Queries

- Add indexes to frequently queried fields
- Use `.lean()` in Mongoose for faster queries
- Implement query result caching
- Use connection pooling

### 4. Implement Response Caching

For static or semi-static data, use caching headers:

```javascript
// In your Express routes
res.set('Cache-Control', 'public, max-age=3600');
```

### 5. Use Vercel Edge Functions for Fast Responses

Move lightweight operations to Edge Functions for faster responses.

## Step-by-Step: Redeploy After Fixing Limits

1. **Identify the Issue**
   - Check Vercel dashboard → Deployments → Failed deployment → Logs
   - Look for specific error messages

2. **Fix the Issue**
   - Apply one of the solutions above
   - Test locally if possible

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "Fix: Optimize for Vercel limits"
   git push origin main
   ```

4. **Monitor Deployment**
   - Watch the deployment in Vercel dashboard
   - Check build logs for errors
   - Test the deployed application

5. **If Still Failing**
   - Check function logs in Vercel dashboard
   - Test individual endpoints
   - Consider upgrading to Pro plan for higher limits

## Quick Troubleshooting Checklist

- [ ] Check function timeout errors in logs
- [ ] Verify environment variables are set correctly
- [ ] Ensure database connection string is correct
- [ ] Check if file uploads exceed size limits
- [ ] Verify all dependencies are in `package.json`
- [ ] Check if build is taking too long
- [ ] Ensure API routes are properly configured in `vercel.json`
- [ ] Verify CORS settings for your frontend URL

## Getting Help

If you're still experiencing issues:

1. **Check Vercel Logs**
   - Dashboard → Your Project → Functions → Click on function → View logs

2. **Vercel Status Page**
   - Check [vercel-status.com](https://vercel-status.com) for service issues

3. **Vercel Support**
   - For Pro users: Contact support directly
   - For free tier: Community forums and Discord

## Recommended: Upgrade to Pro Plan

If you're frequently hitting limits, consider upgrading to Vercel Pro:
- 60-second function execution (vs 10 seconds)
- 3008 MB memory (vs 1024 MB)
- More build minutes
- Better support

## Next Steps

1. Identify which limit you're hitting
2. Apply the appropriate solution
3. Redeploy using Method 1 above
4. Monitor the deployment
5. Test your application thoroughly

