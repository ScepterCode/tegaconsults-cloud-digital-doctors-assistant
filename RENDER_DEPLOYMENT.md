# Render Deployment Guide

## Step-by-Step Deployment Instructions

### 1. Prepare Database (PostgreSQL on Render)

1. Go to **render.com** and sign up/login
2. Click **New +** → **PostgreSQL**
3. Configure:
   - Name: `dda-postgres`
   - Database: `dda_db`
   - User: `dda_user`
   - Region: Choose closest to your users
   - Plan: Free or Starter
4. Click **Create Database**
5. Copy the **Internal Database URL** (you'll need this in step 5)

### 2. Create Web Service

1. Go to render.com dashboard
2. Click **New +** → **Web Service**
3. Select **Deploy from a Git repository**
4. Paste your GitHub repository URL
5. Click **Connect**

### 3. Configure Web Service

**Service Details:**
- Name: `digital-doctors-assistant`
- Runtime: `Node`
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Instance Type: Free (or paid if you want better performance)
- Auto-deploy: Enable ✓

### 4. Add Environment Variables

Click **Environment** and add these variables:

```
DATABASE_URL = postgresql://dda_user:PASSWORD@HOST:5432/dda_db
OPENAI_API_KEY = sk-YOUR_OPENAI_KEY
SESSION_SECRET = GENERATE_RANDOM_STRING
NODE_ENV = production
```

**Where to get these:**
- `DATABASE_URL`: From your PostgreSQL database page (Internal URL)
- `OPENAI_API_KEY`: From openai.com API keys
- `SESSION_SECRET`: Generate random string (e.g., use `openssl rand -hex 32`)

### 5. Deploy

1. Click **Create Web Service**
2. Wait for build to complete (~2-5 minutes)
3. Your app will be live at: `https://digital-doctors-assistant.onrender.com`

### 6. Initialize Database

1. Once deployed, open your app URL
2. Database will auto-initialize on first run
3. Login with default credentials:
   - Admin: `admin` / `paypass`
   - Doctor: `doctor1` / `pass123`
   - Nurse: `nurse1` / `nursepass`
   - Patient: `patient` / `paypass`

## Important Notes

- **Free tier limitations**: Render free tier may spin down if inactive (15 mins)
- **Database backups**: Enable automatic backups in Render dashboard
- **Logs**: View real-time logs in Render dashboard
- **Custom domain**: Add in Settings → Custom Domain

## Troubleshooting

### Build fails with npm error
- Check that Node version is compatible
- Verify package.json has correct scripts
- Check logs in Render dashboard

### Database connection timeout
- Check DATABASE_URL is correct
- Ensure Render PostgreSQL is running
- Verify environment variables are set

### App crashes on startup
- Check logs in Render dashboard
- Verify all environment variables are set
- Database migration runs automatically on first deploy

## Post-Deployment

1. Test login at `https://your-app.onrender.com`
2. Test API at `https://your-app.onrender.com/api/patients`
3. Test chatbot with a question
4. Upload a test patient
5. Monitor logs for errors

## Auto-Deploy from GitHub

Render will automatically redeploy whenever you push to your main branch (if connected via GitHub).

## Additional Resources

- Render Documentation: https://render.com/docs
- Node.js on Render: https://render.com/docs/deploy-node-express-app
