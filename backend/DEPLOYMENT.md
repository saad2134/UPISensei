# UPISensei Deployment Guide - Free 24/7 Hosting

This guide covers deploying both frontend and backend for free with 24/7 uptime.

## 🎯 Recommended Free Hosting Options

### Frontend (Next.js)
1. **Vercel** (Recommended) - Best for Next.js, free tier with excellent performance
2. **Netlify** - Great alternative, free tier available
3. **Cloudflare Pages** - Free, fast CDN

### Backend (FastAPI)
1. **Railway** (Recommended) - $5/month free credit, easy deployment
2. **Render** - Free tier with limitations (spins down after inactivity)
3. **Fly.io** - Free tier with 3 shared VMs
4. **PythonAnywhere** - Free tier for Python apps

---

## 🚀 Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED

### Frontend on Vercel

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/hacknovate-2025.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Set root directory to `frontend_web`
   - Add environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
     ```
   - Click "Deploy"

3. **Configure custom domain (optional)**
   - Vercel provides free `.vercel.app` domain
   - Can add custom domain for free

### Backend on Railway

1. **Create Railway account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Get $5 free credit monthly

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set root directory to `backend`

3. **Configure environment variables**
   - Go to Variables tab
   - Add all variables from `.env`:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     SUPABASE_SERVICE_KEY=your_service_key
     GEMINI_API_KEY=your_gemini_key
     GEMINI_ENABLED=true
     CORS_ORIGINS=https://your-frontend.vercel.app
     ```

4. **Configure build settings**
   - Railway auto-detects Python
   - Add start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Get your backend URL**
   - Railway provides: `https://your-app.railway.app`
   - Update frontend env var: `NEXT_PUBLIC_API_URL`

---

## 🚀 Option 2: Netlify (Frontend) + Render (Backend) - FREE TIER

### Frontend on Netlify

1. **Push to GitHub** (same as above)

2. **Deploy on Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Build settings:
     - Base directory: `frontend_web`
     - Build command: `npm run build`
     - Publish directory: `frontend_web/.next`
   - Add environment variable:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
     ```
   - Click "Deploy site"

### Backend on Render

1. **Create Render account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - Name: `upisensei-backend`
     - Environment: `Python 3`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Root Directory: `backend`

3. **Environment Variables**
   - Add all variables from `.env`

4. **Note**: Render free tier spins down after 15 min inactivity
   - First request takes ~30 seconds to wake up
   - Consider upgrading to paid or use Railway

---

## 🚀 Option 3: All-in-One on Fly.io (Both Frontend & Backend)

### Setup Fly.io

1. **Install Fly CLI**
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # Mac/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   fly auth login
   ```

### Deploy Backend

1. **Initialize Fly app**
   ```bash
   cd backend
   fly launch
   ```

2. **Configure `fly.toml`** (created automatically)
   ```toml
   app = "upisensei-backend"
   primary_region = "iad"
   
   [build]
   
   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 1
   
   [[services]]
     protocol = "tcp"
     internal_port = 8000
   ```

3. **Set secrets**
   ```bash
   fly secrets set SUPABASE_URL=your_url
   fly secrets set SUPABASE_KEY=your_key
   fly secrets set SUPABASE_SERVICE_KEY=your_service_key
   fly secrets set GEMINI_API_KEY=your_key
   fly secrets set GEMINI_ENABLED=true
   fly secrets set CORS_ORIGINS=https://your-frontend.fly.dev
   ```

4. **Deploy**
   ```bash
   fly deploy
   ```

### Deploy Frontend

1. **Create Dockerfile for Next.js**
   ```bash
   cd frontend_web
   ```

2. **Deploy**
   ```bash
   fly launch
   # Follow prompts
   ```

---

## 📝 Required Files for Deployment

### Backend: `Procfile` (for Railway/Render)
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Backend: `runtime.txt` (for Python version)
```
python-3.11.0
```

### Frontend: `vercel.json` (already exists)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

---

## 🔧 Environment Variables Setup

### Backend Variables (All Platforms)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_ENABLED=true
CORS_ORIGINS=https://your-frontend-url.vercel.app,https://your-frontend-url.netlify.app
```

### Frontend Variables
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```

---

## 🎯 Quick Start: Vercel + Railway (Easiest)

### Step 1: Backend on Railway
1. Sign up at railway.app
2. New Project → Deploy from GitHub
3. Select `backend` folder
4. Add environment variables
5. Deploy
6. Copy the URL (e.g., `https://upisensei-production.up.railway.app`)

### Step 2: Frontend on Vercel
1. Sign up at vercel.com
2. New Project → Import from GitHub
3. Select `frontend_web` folder
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app/api
   ```
5. Deploy

### Step 3: Update CORS
- In Railway backend variables, update:
  ```
  CORS_ORIGINS=https://your-vercel-app.vercel.app
  ```
- Redeploy backend

---

## 💰 Cost Comparison

| Platform | Free Tier | Limitations |
|----------|-----------|-------------|
| **Vercel** | ✅ Free | 100GB bandwidth/month |
| **Railway** | ✅ $5 credit/month | ~500 hours free |
| **Render** | ✅ Free | Spins down after 15min |
| **Fly.io** | ✅ Free | 3 shared VMs, 3GB storage |
| **Netlify** | ✅ Free | 100GB bandwidth/month |

**Best Combo**: Vercel (Frontend) + Railway (Backend)
- Both have generous free tiers
- No spin-down issues
- Fast performance
- Easy setup

---

## 🔄 Continuous Deployment

All platforms support automatic deployments:
- Push to GitHub → Auto-deploy
- No manual steps needed
- Rollback available

---

## 📊 Monitoring & Logs

### Railway
- Built-in logs dashboard
- Metrics and monitoring
- Easy to view errors

### Vercel
- Analytics included
- Function logs
- Performance insights

---

## 🛠️ Troubleshooting

### Backend won't start
- Check environment variables are set
- Verify Python version matches `runtime.txt`
- Check logs for errors

### CORS errors
- Update `CORS_ORIGINS` with your frontend URL
- Include both `https://` and `http://` if testing locally

### Database connection issues
- Verify Supabase credentials
- Check if IP whitelisting is needed (usually not for Supabase)

---

## 🚀 Production Checklist

- [ ] All environment variables set
- [ ] CORS origins configured correctly
- [ ] Database tables created in Supabase
- [ ] Frontend API URL points to backend
- [ ] Test file uploads work
- [ ] Test chat functionality
- [ ] Monitor logs for errors
- [ ] Set up custom domain (optional)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Fly.io Documentation](https://fly.io/docs)

