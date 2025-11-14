# Vercel Deployment Setup Guide

## Current Issue: Frontend Not Connecting to Backend

The error shows the frontend is trying to POST to `https://arvind-fashion.vercel.app/api/orders` instead of `https://arvind-backend.vercel.app/api/orders`. This means `config.js` is not being generated during the build.

## Quick Fix Steps

### Frontend Vercel Project Settings

1. **Go to your Frontend Vercel Project** → Settings → Environment Variables

2. **Add Environment Variable:**
   - **Name:** `FRONTEND_API_BASE`
   - **Value:** `https://arvind-backend.vercel.app`
   - **Environment:** Production, Preview, Development (select all)

3. **Go to Settings → Build & Development Settings**

4. **Set Build Command:**
   - If your Vercel project root is the **repository root**:
     ```
     node ./frontend/scripts/inject-api-base.js
     ```
   - If your Vercel project root is the **`frontend` folder**:
     ```
     node ./scripts/inject-api-base.js
     ```

5. **Set Output Directory:**
   - If project root is repository root: `frontend`
   - If project root is `frontend` folder: `.` (or leave empty)

6. **Redeploy the Frontend**

### Backend Vercel Project Settings

1. **Go to your Backend Vercel Project** → Settings → Environment Variables

2. **Required Environment Variables:**
   - **MONGODB_URI** - Your MongoDB connection string
   - **FRONTEND_URL** (Optional but recommended) - `https://arvind-fashion.vercel.app`

3. **Redeploy the Backend**

## Verify the Fix

After redeploying:

1. **Check Frontend Console:**
   - Open browser DevTools → Console
   - You should see:
     ```
     [API Config] window.__API_BASE__: "https://arvind-backend.vercel.app"
     [API Config] Final API_BASE: "https://arvind-backend.vercel.app"
     ```

2. **Test Backend:**
   - Visit: `https://arvind-backend.vercel.app/api/health`
   - Should return: `{"ok":true,"db":"connected",...}`

3. **Test Frontend:**
   - Visit your frontend URL
   - Open DevTools → Network tab
   - Try submitting an order
   - Check that the request goes to `https://arvind-backend.vercel.app/api/orders`

## If Still Not Working

### Check Build Logs

1. In Vercel Dashboard → Your Frontend Project → Deployments
2. Click on the latest deployment
3. Check the build logs for:
   - `Wrote frontend/config.js -> https://arvind-backend.vercel.app`
   - If you see errors, the build command path might be wrong

### Manual Fix (Temporary)

If the build command isn't working, you can manually create `config.js`:

1. In your frontend folder, create/edit `config.js`:
   ```javascript
   // Auto-generated at build time
   window.__API_BASE__ = "https://arvind-backend.vercel.app";
   ```

2. Commit and push this file
3. Redeploy

### Check Project Root

**Important:** Make sure your Vercel project root is set correctly:

- **Option 1:** Project root = Repository root
  - Build command: `node ./frontend/scripts/inject-api-base.js`
  - Output directory: `frontend`

- **Option 2:** Project root = `frontend` folder
  - Build command: `node ./scripts/inject-api-base.js`
  - Output directory: `.` (or empty)

## Common Mistakes

1. ❌ **Forgot to set `FRONTEND_API_BASE` environment variable**
2. ❌ **Build command path is wrong** (check if project root is `frontend` or repo root)
3. ❌ **Environment variable not set for all environments** (Production, Preview, Development)
4. ❌ **Didn't redeploy after setting environment variables**
5. ❌ **config.js is in .gitignore** (it shouldn't be, or it should be generated during build)

## Testing Locally

To test locally before deploying:

```powershell
cd frontend
$env:FRONTEND_API_BASE='https://arvind-backend.vercel.app'
node .\scripts\inject-api-base.js
```

Then open `frontend/index.html` in a browser and check the console.

