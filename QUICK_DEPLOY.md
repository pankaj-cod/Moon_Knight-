# 🚀 Quick Deployment Guide

## Railway Deployment (5 minutes)

### 1️⃣ Deploy Backend
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `Moon_Knight-` repository
4. Wait for deployment to complete

### 2️⃣ Add Environment Variables
Click on your service → Variables tab → Add these:
```
DATABASE_URL=postgresql://neondb_owner:npg_zoexlBIG46Qf@ep-jolly-bar-ah4jhd5o-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=moonlight-production-secret-2024
PORT=5001
FRONTEND_URL=https://moonlight-frontend.vercel.app
NODE_ENV=production
```

### 3️⃣ Get Railway URL
Copy your Railway URL (e.g., `https://your-app.railway.app`)

### 4️⃣ Update Vercel
1. Go to [vercel.com](https://vercel.com) → Your project
2. Settings → Environment Variables
3. Add: `VITE_APP_API_URL=https://your-railway-url.railway.app/api`
4. Deployments → Redeploy latest

### 5️⃣ Test
Visit your deployed site and try creating an album!

---

## 🆘 Quick Fixes

**Migrations not running?**
```bash
npm i -g @railway/cli
railway login
railway link
railway run npx prisma migrate deploy
```

**Check logs:**
```bash
railway logs
```

**Test backend health:**
```
https://your-railway-url.railway.app/api/health
```

---

## ✅ Checklist
- [ ] Railway project created
- [ ] Environment variables added
- [ ] Backend deployed (green checkmark on Railway)
- [ ] Railway URL copied
- [ ] Vercel env variable updated
- [ ] Frontend redeployed
- [ ] Album creation tested ✨
