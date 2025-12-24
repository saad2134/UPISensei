# 🚀 Quick Deployment Summary

## Best Free 24/7 Setup: Vercel + Railway

### ⏱️ Total Time: 5 minutes

---

## Step 1: Backend on Railway (3 min)

1. Go to **railway.app** → Sign up with GitHub
2. **New Project** → Deploy from GitHub
3. Select repo → Set root: `backend`
4. Add environment variables (from your `.env`)
5. Deploy → Copy URL: `https://xxx.railway.app`

---

## Step 2: Frontend on Vercel (2 min)

1. Go to **vercel.com** → Sign up with GitHub
2. **New Project** → Import from GitHub
3. Select repo → Set root: `frontend_web`
4. Add env var: `NEXT_PUBLIC_API_URL=https://xxx.railway.app/api`
5. Deploy → Copy URL: `https://xxx.vercel.app`

---

## Step 3: Update CORS (30 sec)

- Railway → Variables → Update `CORS_ORIGINS` with Vercel URL
- Redeploy backend

---

## ✅ Done!

Your app is now live 24/7:
- Frontend: `https://xxx.vercel.app`
- Backend: `https://xxx.railway.app`

---

## 📝 Environment Variables Needed

### Railway (Backend)
```
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...
GEMINI_API_KEY=...
GEMINI_ENABLED=true
CORS_ORIGINS=https://your-app.vercel.app
```

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://your-app.railway.app/api
```

---

## 💰 Cost: $0/month

Both platforms have generous free tiers that support 24/7 operation!

---

For detailed instructions, see `DEPLOYMENT.md` or `QUICK_DEPLOY.md`

