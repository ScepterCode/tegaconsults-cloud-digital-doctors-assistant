# Vercel + Render Deployment Guide

## Architecture

```
┌─────────────────────────────────┐
│  Frontend (Vercel)              │
│  https://your-app.vercel.app    │
│  - React/Vite static site       │
│  - Serves HTML/CSS/JS           │
└────────────┬────────────────────┘
             │ API Calls (HTTPS)
             ▼
┌─────────────────────────────────┐
│  Backend (Render)               │
│  https://dda-backend.onrender   │
│  - Python FastAPI               │
│  - Handles all business logic   │
│  - Database operations          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  PostgreSQL Database (Render)   │
│  - Stores all data              │
└─────────────────────────────────┘
```

## Configuration Checklist

### ✅ Backend (Render) - Already Configured

**CORS Settings** (`server_py/main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.vercel.app",      # All Vercel deployments
        "https://your-app.vercel.app", # Your production URL
        "*"                           # Allow all (for testing)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Environment Variables in Render:**
- `DATABASE_URL` - Auto-set from database
- `OPENAI_API_KEY` - Set manually

**Backend URL:**
- https://dda-backend.onrender.com

### ✅ Frontend (Vercel) - Configuration

**Environment Variables in Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add this variable:
   ```
   Name: VITE_API_URL
   Value: https://dda-backend.onrender.com
   ```
3. Apply to: Production, Preview, Development

**Build Settings in Vercel:**
- Framework Preset: Vite
- Root Directory: `client` (if needed)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Step-by-Step Deployment

### 1. Deploy Backend to Render (Already Done)

Your backend should be live at: https://dda-backend.onrender.com

**Verify:**
```bash
curl https://dda-backend.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Digital Doctors Assistant",
  "version": "2.0.0",
  "backend": "Python/FastAPI"
}
```

### 2. Deploy Frontend to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to "client" if needed
# - Confirm build settings
```

**Option B: Using Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://dda-backend.onrender.com`
5. Click "Deploy"

### 3. Update Backend CORS with Your Vercel URL

Once deployed, get your Vercel URL (e.g., `https://your-app.vercel.app`)

Update `server_py/main.py`:
```python
allow_origins=[
    "https://your-app.vercel.app",  # Your actual Vercel URL
    "https://*.vercel.app",         # All Vercel preview deployments
    "*"                              # Allow all (remove in production)
]
```

Commit and push to trigger Render redeploy:
```bash
git add server_py/main.py
git commit -m "Update CORS for Vercel frontend"
git push origin main
```

## Verification Steps

### 1. Test Backend API

**Health Check:**
```bash
curl https://dda-backend.onrender.com/api/health
```

**API Documentation:**
Visit: https://dda-backend.onrender.com/docs

### 2. Test Frontend

**Visit your Vercel URL:**
https://your-app.vercel.app

**Open Browser Console (F12):**
- Should see: `API URL: https://dda-backend.onrender.com`
- No CORS errors

**Check Network Tab:**
- API calls should go to: `https://dda-backend.onrender.com/api/*`
- Status: 200 OK (or 401 if not logged in)

### 3. Test Login Flow

1. Go to your Vercel URL
2. Try to login
3. Check Network tab for API call:
   ```
   POST https://dda-backend.onrender.com/api/auth/login
   Status: 200 OK
   ```

## Common Issues & Solutions

### Issue 1: CORS Errors

**Symptom:**
```
Access to fetch at 'https://dda-backend.onrender.com/api/...' 
from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**Solution:**
1. Check backend CORS settings include your Vercel URL
2. Ensure `allow_credentials=True` is set
3. Verify `allow_methods=["*"]` and `allow_headers=["*"]`
4. Redeploy backend after changes

### Issue 2: API Calls Failing

**Symptom:**
- Network errors
- 404 Not Found
- Connection refused

**Solution:**
1. Verify `VITE_API_URL` is set in Vercel environment variables
2. Check backend is running: https://dda-backend.onrender.com/api/health
3. Ensure API URL doesn't have trailing slash
4. Check browser console for actual error

### Issue 3: Environment Variables Not Working

**Symptom:**
- API calls go to wrong URL
- `undefined` in API URL

**Solution:**
1. Vercel Dashboard → Settings → Environment Variables
2. Ensure `VITE_API_URL` is set for all environments
3. Redeploy frontend after adding variables
4. Variables must start with `VITE_` for Vite to expose them

### Issue 4: 401 Unauthorized

**Symptom:**
- Login fails
- API returns 401

**Solution:**
1. Check `allow_credentials=True` in CORS
2. Ensure cookies are being sent:
   ```typescript
   fetch(url, {
     credentials: 'include',  // Important!
     ...
   })
   ```
3. Verify backend authentication is working

## Environment Variables Reference

### Backend (Render)
```
DATABASE_URL=postgresql://...  (auto-set)
OPENAI_API_KEY=sk-...         (set manually)
```

### Frontend (Vercel)
```
VITE_API_URL=https://dda-backend.onrender.com
```

## URLs Reference

### Production
- **Frontend:** https://your-app.vercel.app
- **Backend:** https://dda-backend.onrender.com
- **API Docs:** https://dda-backend.onrender.com/docs
- **Health Check:** https://dda-backend.onrender.com/api/health

### Local Development
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Testing Checklist

After deployment, verify:

- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Browser console shows correct API URL
- [ ] No CORS errors in console
- [ ] Login works
- [ ] API calls succeed
- [ ] Data loads correctly
- [ ] All features work as expected

## Deployment Commands

### Update Backend
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys
```

### Update Frontend
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys
```

### Manual Redeploy
- **Render:** Dashboard → Service → Manual Deploy
- **Vercel:** Dashboard → Deployments → Redeploy

## Monitoring

### Backend Logs (Render)
- Dashboard → dda-backend → Logs
- Check for errors, startup messages

### Frontend Logs (Vercel)
- Dashboard → Deployments → Click deployment → View Function Logs
- Check for build errors

### Browser Console
- F12 → Console tab
- Check for JavaScript errors, CORS issues

## Security Notes

### Production Recommendations

1. **Remove wildcard CORS:**
   ```python
   allow_origins=[
       "https://your-app.vercel.app",  # Only your domain
       # Remove "*"
   ]
   ```

2. **Use HTTPS only:**
   - Both Vercel and Render provide HTTPS by default
   - Never use HTTP in production

3. **Secure environment variables:**
   - Never commit `.env` files
   - Use platform environment variable settings

4. **Enable rate limiting:**
   - Add rate limiting middleware to backend
   - Protect against abuse

## Support

If you encounter issues:

1. **Check logs first:**
   - Backend: Render logs
   - Frontend: Vercel logs
   - Browser: Console and Network tab

2. **Verify configuration:**
   - CORS settings
   - Environment variables
   - API URLs

3. **Test endpoints:**
   - Use curl or Postman
   - Test backend directly
   - Isolate frontend vs backend issues

## Summary

✅ **Backend (Render):**
- Python FastAPI
- PostgreSQL database
- CORS configured for Vercel
- URL: https://dda-backend.onrender.com

✅ **Frontend (Vercel):**
- React/Vite static site
- Environment variable: `VITE_API_URL`
- Calls backend API
- URL: https://your-app.vercel.app

✅ **Communication:**
- HTTPS only
- CORS enabled
- Credentials included
- All methods/headers allowed

Your app is now deployed across two platforms with proper communication! 🚀
