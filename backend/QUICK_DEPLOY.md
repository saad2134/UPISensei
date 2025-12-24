# 🚀 Quick Deployment Guide - 5 Minutes

## Easiest Free Setup: Vercel + Railway

### Backend (Railway) - 3 minutes

1. **Go to [railway.app](https://railway.app)** and sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set root directory: `backend`

3. **Add Environment Variables**
   - Click on your service → Variables tab
   - Add these (get from your `.env` file):
     ```
     SUPABASE_URL=...
     SUPABASE_KEY=...
     SUPABASE_SERVICE_KEY=...
     GEMINI_API_KEY=...
     GEMINI_ENABLED=true
     CORS_ORIGINS=https://your-frontend.vercel.app
     ```

4. **Deploy**
   - Railway auto-deploys
   - Wait for "Deployed" status
   - Copy the URL (e.g., `https://upisensei-production.up.railway.app`)

### Frontend (Vercel) - 2 minutes

1. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Set root directory: `frontend_web`

3. **Add Environment Variable**
   - In project settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app/api
     ```
   - Replace with your actual Railway URL

4. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Get your URL (e.g., `https://upisensei.vercel.app`)

5. **Update Backend CORS**
   - Go back to Railway
   - Update `CORS_ORIGINS` variable:
     ```
     CORS_ORIGINS=https://your-vercel-app.vercel.app
     ```
   - Redeploy backend

### ✅ Done!

Your app is now live 24/7:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`

---

## Alternative: Render (Fully Free)

### Backend on Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Name: `upisensei-backend`
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

**Note**: Render free tier spins down after 15min inactivity (first request takes ~30s)

### Frontend on Netlify

1. Go to [netlify.com](https://netlify.com)
2. Add new site → Import from GitHub
3. Settings:
   - Base directory: `frontend_web`
   - Build command: `npm run build`
   - Publish: `frontend_web/.next`
4. Add env var: `NEXT_PUBLIC_API_URL`
5. Deploy

---

## 🎯 Recommended: Vercel + Railway

**Why?**
- ✅ Both have generous free tiers
- ✅ No spin-down (always running)
- ✅ Fast performance
- ✅ Easy setup
- ✅ Auto-deploy from GitHub

**Cost**: $0/month (within free tier limits)

---

## 📝 Pre-Deployment Checklist

- [ ] Push code to GitHub
- [ ] Supabase database set up
- [ ] Environment variables ready
- [ ] Test locally first
- [ ] Update CORS origins after getting URLs

---

## 🔧 Post-Deployment

1. Test file upload
2. Test chat functionality
3. Check logs for errors
4. Monitor performance
5. Set up custom domain (optional)

---

## 💡 Pro Tips

1. **Use Railway for backend** - Most reliable free tier
2. **Use Vercel for frontend** - Best Next.js hosting
3. **Enable auto-deploy** - Push to main = auto deploy
4. **Monitor logs** - Check both platforms for errors
5. **Set up alerts** - Get notified of issues

---

## 🆘 Troubleshooting

**Backend not starting?**
- Check Railway logs
- Verify all env vars are set
- Check Python version

**CORS errors?**
- Update `CORS_ORIGINS` in Railway
- Include full frontend URL with `https://`

**Frontend can't connect?**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running (Railway dashboard)
- Test backend URL directly in browser

---

## 📊 Free Tier Limits

### Railway
- $5 credit/month (~500 hours)
- Enough for 24/7 operation
- Auto-scales

### Vercel
- Unlimited deployments
- 100GB bandwidth/month
- Perfect for most apps

---

**Your app will be live in under 5 minutes!** 🎉

