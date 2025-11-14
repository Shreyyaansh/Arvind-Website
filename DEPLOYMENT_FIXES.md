# Deployment Fixes - Frontend/Backend Connection Issues

## Issues Fixed

### 1. **CORS Configuration** ✅
- **Problem**: Backend CORS was too restrictive and might block frontend requests
- **Fix**: Updated CORS to:
  - Allow all origins if `FRONTEND_URL` environment variable is not set (useful for separate deployments)
  - Allow specific origins if `FRONTEND_URL` is set (comma-separated for multiple origins)
  - Added proper error logging for blocked CORS requests

### 2. **Vercel Serverless Function Handler** ✅
- **Problem**: Express app wasn't properly wrapped for Vercel serverless functions
- **Fix**: Added proper error handling in the serverless function handler

### 3. **Vercel Configuration** ✅
- **Problem**: `vercel.json` had incorrect routing configuration
- **Fix**: Updated to use modern Vercel configuration with:
  - Proper function configuration with timeout settings
  - Correct rewrite rules for API routes

## Required Vercel Environment Variables

### Backend Deployment
Set these environment variables in your **backend** Vercel project:

1. **MONGODB_URI** (Required)
   - Your MongoDB connection string
   - Example: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

2. **FRONTEND_URL** (Optional but Recommended)
   - Your frontend deployment URL
   - Example: `https://your-frontend.vercel.app`
   - If not set, CORS will allow all origins (works but less secure)

3. **SMTP Configuration** (Optional - for email notifications)
   - `SMTP_HOST` - Your SMTP server hostname
   - `SMTP_PORT` - SMTP port (usually 587 or 465)
   - `SMTP_USER` - SMTP username
   - `SMTP_PASS` - SMTP password
   - `MAIL_FROM` - Email address to send from
   - `ORDER_NOTIFY_TO` - Email address to receive order notifications

### Frontend Deployment
Set this environment variable in your **frontend** Vercel project:

1. **FRONTEND_API_BASE** (Required)
   - Your backend deployment URL
   - Example: `https://arvind-backend.vercel.app`
   - This will be used to generate `config.js` during build

2. **Build Command** (Required)
   - Set the build command to: `node ./scripts/inject-api-base.js`
   - Or if your project root is `frontend`: `node ./scripts/inject-api-base.js`
   - This generates the `config.js` file with the correct API base URL

## Testing the Connection

1. **Test Backend Health Endpoint**:
   ```
   https://your-backend.vercel.app/api/health
   ```
   Should return: `{"ok":true,"db":"connected","mail":true}`

2. **Test Products Endpoint**:
   ```
   https://your-backend.vercel.app/api/products
   ```
   Should return a JSON object with products array

3. **Test from Frontend**:
   - Open browser console on your frontend
   - Check for any CORS errors
   - Verify that products are loading from the API

## Common Issues & Solutions

### Issue: CORS Error
**Solution**: 
- Make sure `FRONTEND_URL` in backend is set to your frontend URL (including `https://`)
- Or remove `FRONTEND_URL` to allow all origins (for testing)

### Issue: 404 on API routes
**Solution**: 
- Verify `vercel.json` is in the backend root directory
- Check that `api/[...all].js` exists
- Redeploy the backend

### Issue: Frontend can't connect
**Solution**:
- Verify `FRONTEND_API_BASE` is set correctly in frontend Vercel project
- Check that build command runs the inject script
- Verify `config.js` is generated with correct backend URL
- Check browser console for specific error messages

### Issue: Database connection fails
**Solution**:
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas network access allows Vercel IPs (or allow all IPs for testing)
- Check MongoDB connection string format

## Next Steps

1. **Redeploy Backend**:
   - Push changes to your repository
   - Vercel will automatically redeploy
   - Or manually trigger a redeploy in Vercel dashboard

2. **Redeploy Frontend**:
   - Ensure `FRONTEND_API_BASE` environment variable is set
   - Ensure build command includes the inject script
   - Push changes or manually redeploy

3. **Verify**:
   - Test the health endpoint
   - Test products endpoint
   - Test from frontend in browser

## Files Modified

- `backend/app.js` - CORS configuration
- `backend/api/[...all].js` - Serverless function handler
- `backend/vercel.json` - Vercel configuration

