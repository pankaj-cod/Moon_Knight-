# Railway Deployment Instructions

## Quick Deploy to Railway

### Option 1: Deploy from GitHub (Recommended)

1. **Commit and push the railway.json file:**
   ```bash
   git add railway.json moon_backend/.gitignore
   git commit -m "Add Railway configuration"
   git push
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `Moon_Knight-` repository
   - Railway will detect the `railway.json` configuration

3. **Add Environment Variables:**
   In Railway dashboard, add these variables:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_zoexlBIG46Qf@ep-jolly-bar-ah4jhd5o-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   JWT_SECRET=your-production-secret-key-change-this
   PORT=5001
   FRONTEND_URL=https://moonlight-frontend.vercel.app
   NODE_ENV=production
   ```

4. **Get your Railway URL:**
   - After deployment, Railway will give you a URL like: `https://your-app.railway.app`
   - Copy this URL

5. **Update Vercel Environment Variable:**
   - Go to Vercel dashboard
   - Select your moonlight project
   - Settings → Environment Variables
   - Add/Update:
     ```
     VITE_APP_API_URL=https://your-app.railway.app/api
     ```
   - Redeploy frontend

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project (if already created)
railway link

# Add environment variables
railway variables set DATABASE_URL="your-database-url"
railway variables set JWT_SECRET="your-secret"
railway variables set FRONTEND_URL="https://moonlight-frontend.vercel.app"

# Deploy
railway up
```

## Verify Deployment

1. Check Railway logs for any errors
2. Test the health endpoint: `https://your-railway-url.railway.app/api/health`
3. Test album creation on your deployed frontend

## Troubleshooting

### If migrations fail:
```bash
railway run npx prisma migrate deploy
```

### If you see "Prisma Client not generated":
```bash
railway run npx prisma generate
```

### Check logs:
```bash
railway logs
```
