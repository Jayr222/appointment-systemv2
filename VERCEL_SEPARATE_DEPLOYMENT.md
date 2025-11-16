# Vercel Separate Deployment Setup Guide

Since you've deployed the frontend and backend as separate Vercel projects, you need to configure the frontend to point to your backend URL.

## Step 1: Get Your Backend URL

Your backend is deployed at: `https://your-backend-project.vercel.app`

(Replace `your-backend-project` with your actual Vercel project name)

## Step 2: Set Environment Variable in Frontend Vercel Project

1. Go to your **Frontend** Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-project.vercel.app`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

## Step 3: Redeploy Frontend

After adding the environment variable, you need to redeploy:

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Step 4: Verify It Works

After redeployment, test the registration:
- The frontend should now make requests to: `https://your-backend-project.vercel.app/api/auth/register`
- Check the browser Network tab to confirm requests are going to the correct domain

## Alternative: Deploy Together (Recommended for Future)

If you want to deploy frontend and backend together in the same Vercel project:

1. Make sure your project structure has both `frontend/` and `api/` folders at the root
2. The `vercel.json` at the root will handle routing:
   - Frontend routes → serve static files
   - `/api/*` routes → serverless function
3. No environment variable needed - use relative `/api` paths

## Current Setup (Separate Deployments)

✅ **Frontend**: `https://your-frontend.vercel.app`  
✅ **Backend**: `https://your-backend.vercel.app`  
✅ **Environment Variable**: `VITE_API_URL=https://your-backend.vercel.app`

After setting the environment variable and redeploying, all API calls will go to your backend!

