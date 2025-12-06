# 🚀 Deployment Guide - Digital Doctors Assistant

## Option 1: Render.com (Recommended - FREE)

### Prerequisites
- GitHub account
- Render.com account (free)
- Your code pushed to GitHub

### Step-by-Step Deployment

#### 1. Prepare Your Repository
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/digital-doctors-assistant.git
git branch -M main
git push -u origin main
```

#### 2. Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `dda-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server_py.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Add Environment Variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `DATABASE_URL`: (Will be auto-added when you add database)

6. Click "Create Web Service"

#### 3. Add PostgreSQL Database

1. In Render dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `dda-database`
   - **Plan**: Free
3. Click "Create Database"
4. Copy the "Internal Database URL"
5. Go back to your web service → Environment
6. Add `DATABASE_URL` with the copied URL

#### 4. Deploy Frontend

**Option A: Serve from Backend (Simpler)**
- The backend already serves the frontend from `/dist/public`
- Just run `npm run build` locally and commit the dist folder
- Push to GitHub and Render will serve it

**Option B: Separate Static Site**
1. Click "New +" → "Static Site"
2. Connect same repository
3. Configure:
   - **Name**: `dda-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist/public`
4. Click "Create Static Site"

#### 5. Update Frontend API URL

In your frontend code, update the API URL to point to your Render backend:
```typescript
// client/src/lib/queryClient.ts
const API_URL = import.meta.env.PROD 
  ? 'https://dda-backend.onrender.com'
  : 'http://localhost:5000';
```

#### 6. Database Migration

After deployment, run migrations:
1. Go to your web service in Render
2. Click "Shell" tab
3. Run: `python migrate_database_schema.py`

---

## Option 2: Railway.app (Easiest - $5 FREE CREDIT)

### Step-by-Step

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Python and Node.js
6. Add environment variables:
   - `OPENAI_API_KEY`
7. Click "Deploy"

**That's it!** Railway handles everything automatically.

---

## Option 3: Vercel (Frontend) + Render (Backend)

### Frontend on Vercel (Best Performance)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
4. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL
5. Deploy

### Backend on Render
Follow steps from Option 1 above.

---

## Option 4: Fly.io (Advanced - FREE)

### Prerequisites
- Install Fly CLI: `curl -L https://fly.io/install.sh | sh`

### Deploy

```bash
# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy

# Add PostgreSQL
fly postgres create

# Attach database
fly postgres attach <postgres-app-name>

# Set secrets
fly secrets set OPENAI_API_KEY=your_key_here
```

---

## 🔧 Configuration Changes for Production

### 1. Update Database Connection

Replace SQLite with PostgreSQL in `server_py/db/session.py`:

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for Render's postgres:// URL
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 2. Update CORS Settings

In `server_py/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "https://your-frontend-url.onrender.com",
        "https://your-frontend-url.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Environment Variables Needed

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
```

---

## 💰 Cost Comparison

| Platform | Free Tier | Best For |
|----------|-----------|----------|
| **Render** | 750 hrs/month | Full-stack apps |
| **Railway** | $5 credit/month | Quick deploys |
| **Vercel** | Unlimited | Frontend only |
| **Fly.io** | 3 VMs, 3GB | Global apps |
| **PythonAnywhere** | 512MB RAM | Python only |

---

## 🎯 My Recommendation

**For Your Project:**

1. **Best Overall**: Render.com
   - Deploy both frontend and backend
   - Free PostgreSQL database
   - Easy to set up
   - Good for demos and MVPs

2. **Best Performance**: Vercel (Frontend) + Render (Backend)
   - Fastest frontend delivery
   - Separate scaling
   - Professional setup

3. **Easiest**: Railway.app
   - One-click deploy
   - Auto-configuration
   - Great developer experience

---

## 📝 Post-Deployment Checklist

- [ ] Backend is accessible at your URL
- [ ] Frontend loads correctly
- [ ] Database is connected
- [ ] Environment variables are set
- [ ] CORS is configured
- [ ] SSL certificate is active (automatic on most platforms)
- [ ] Test all user roles
- [ ] Test AI features (chatbot, clinical assistant)
- [ ] Test media uploads (diary audio/video)

---

## 🆘 Troubleshooting

### Backend won't start
- Check logs in platform dashboard
- Verify `requirements.txt` is correct
- Ensure `DATABASE_URL` is set

### Frontend can't connect to backend
- Check CORS settings
- Verify API URL in frontend code
- Check network tab in browser dev tools

### Database errors
- Run migrations: `python migrate_database_schema.py`
- Check DATABASE_URL format
- Ensure PostgreSQL is attached

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Fly.io Documentation](https://fly.io/docs)

---

**Need Help?** Check the platform-specific documentation or reach out to their support teams. Most have excellent free tier support!
