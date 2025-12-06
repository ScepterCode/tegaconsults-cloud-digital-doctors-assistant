# 🚂 Railway.app Deployment Guide

## ✅ Railway will host BOTH frontend and backend together!

Your FastAPI backend will serve the built React frontend automatically.

---

## 📋 Step-by-Step Deployment

### 1. Prepare Your Code

First, make sure your code is on GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Railway deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/digital-doctors-assistant.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Railway

1. **Go to [railway.app](https://railway.app)**

2. **Sign up with GitHub** (easiest way)

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `digital-doctors-assistant` repository

4. **Railway Auto-Detects Everything!**
   - It will detect Python (backend)
   - It will detect Node.js (frontend)
   - It will automatically build both

### 3. Add Environment Variables

In your Railway project dashboard:

1. Click on your service
2. Go to "Variables" tab
3. Add these variables:

```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PYTHON_VERSION=3.11
```

### 4. Add PostgreSQL Database (Optional but Recommended)

1. In your project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically:
   - Create the database
   - Add `DATABASE_URL` to your environment variables
   - Connect it to your service

### 5. Deploy!

Railway will automatically:
- ✅ Install Python dependencies
- ✅ Install Node.js dependencies
- ✅ Build your frontend (`npm run build`)
- ✅ Run database migrations
- ✅ Start your backend server
- ✅ Serve your frontend from the backend

**That's it!** 🎉

---

## 🌐 Access Your Application

After deployment (takes 2-5 minutes):

1. Go to your service in Railway
2. Click "Settings" tab
3. Scroll to "Domains"
4. Click "Generate Domain"
5. You'll get a URL like: `https://your-app.up.railway.app`

**Your app is now live!** Both frontend and backend are accessible at this URL.

---

## 🔧 How It Works

Railway serves your app as follows:

1. **Backend API**: `https://your-app.up.railway.app/api/*`
2. **Frontend**: `https://your-app.up.railway.app/` (all other routes)

Your FastAPI backend (in `server_py/main.py`) already has code to serve the built frontend from the `/dist/public` folder!

---

## 📊 Monitor Your Deployment

In Railway dashboard you can:
- View deployment logs
- Monitor resource usage
- Check build status
- View environment variables
- Access database

---

## 🐛 Troubleshooting

### Build Fails

**Check the logs:**
1. Go to your service
2. Click "Deployments" tab
3. Click on the failed deployment
4. Read the build logs

**Common issues:**
- Missing dependencies in `requirements.txt`
- Build command errors
- Environment variables not set

### App Crashes After Deploy

**Check runtime logs:**
1. Go to your service
2. Click "Deployments" tab
3. Click on the deployment
4. Check "Deploy Logs"

**Common issues:**
- Database connection errors (add PostgreSQL)
- Missing `OPENAI_API_KEY`
- Port binding issues (Railway sets `$PORT` automatically)

### Database Issues

If using SQLite (not recommended for production):
- SQLite files are ephemeral on Railway
- Use PostgreSQL instead (free on Railway)

**To switch to PostgreSQL:**
1. Add PostgreSQL database in Railway
2. Update `server_py/db/session.py` to use `DATABASE_URL`
3. Redeploy

---

## 💰 Railway Pricing

**Free Tier:**
- $5 credit per month
- ~500 hours of usage
- Perfect for demos and small projects
- No credit card required initially

**Usage:**
- Your app will use ~$0.01/hour
- $5 = ~500 hours = ~20 days of 24/7 uptime
- Great for testing and demos!

**Pro Tip:** If you need more, Railway Pro is $20/month with $20 credit included.

---

## 🚀 Post-Deployment

### Test Your Application

1. Visit your Railway URL
2. Test login with credentials from `USER_CREDENTIALS.txt`
3. Test all features:
   - ✅ Login as different roles
   - ✅ Health chatbot
   - ✅ Personal diary
   - ✅ Ticketing system
   - ✅ Patient assignments
   - ✅ Department management

### Update CORS (if needed)

If you have CORS issues, update `server_py/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For Railway, this is usually fine
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Custom Domain (Optional)

Railway allows custom domains:
1. Go to Settings → Domains
2. Click "Custom Domain"
3. Add your domain
4. Update DNS records as instructed

---

## 📝 Deployment Checklist

Before deploying:
- [ ] Code is pushed to GitHub
- [ ] `requirements.txt` exists
- [ ] `package.json` exists
- [ ] `.env.example` is committed (not `.env`)
- [ ] Build command works locally: `npm run build`

After deploying:
- [ ] App is accessible at Railway URL
- [ ] Can login with test credentials
- [ ] Database is connected (if using PostgreSQL)
- [ ] Environment variables are set
- [ ] All features work correctly

---

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push

# Railway automatically detects the push and redeploys!
```

---

## 📚 Useful Railway Commands

Railway CLI (optional):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View logs
railway logs

# Open in browser
railway open
```

---

## 🆘 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

## 🎉 You're All Set!

Your Digital Doctors Assistant is now deployed on Railway with:
- ✅ Frontend (React + Vite)
- ✅ Backend (FastAPI)
- ✅ Database (PostgreSQL - optional)
- ✅ Automatic HTTPS
- ✅ Continuous deployment from GitHub

**Share your Railway URL with others to demo your app!**
