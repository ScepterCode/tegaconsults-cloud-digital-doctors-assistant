# Python FastAPI Backend Only Architecture

## Overview
This project now uses a **Python FastAPI backend** as the main API server with a **React static frontend** that calls the Python API.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  React Frontend     │────────▶│  Python FastAPI      │
│  (Static Site)      │  HTTP   │  Backend             │
│  Port: 443 (HTTPS)  │◀────────│  Port: 443 (HTTPS)   │
└─────────────────────┘         └──────────────────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │  PostgreSQL DB   │
                                 └──────────────────┘
```

## What Changed

### ✅ Before (Dual Backend)
- Node.js backend with Drizzle ORM
- Python FastAPI backend with SQLAlchemy
- Schema conflicts between two ORMs
- Complex deployment

### ✅ After (Python Only)
- **Only Python FastAPI backend** with SQLAlchemy
- React frontend as static site
- No schema conflicts
- Simpler deployment

## Deployment Configuration

### Backend (Python FastAPI)
- **URL**: https://dda-backend.onrender.com
- **Type**: Web Service
- **Port**: Dynamic (assigned by Render)
- **Database**: PostgreSQL (auto-creates tables on startup)

### Frontend (React)
- **URL**: https://dda-frontend.onrender.com
- **Type**: Static Site
- **Build**: `cd client && npm install && npm run build`
- **Publish**: `client/dist`

## Local Development

### Terminal 1 - Start Python Backend
```bash
cd server_py
python -m uvicorn main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

### Terminal 2 - Start React Frontend
```bash
cd client
npm run dev
```

Frontend will be available at: http://localhost:5173

### Verify Setup
1. ✅ Frontend loads at http://localhost:5173
2. ✅ API calls reach Python backend at http://localhost:8000
3. ✅ Check browser console for API URL log
4. ✅ No CORS errors

## API Configuration

### Environment Variables

**Production** (`client/.env.production`):
```
VITE_API_URL=https://dda-backend.onrender.com
```

**Development** (`client/.env.development`):
```
VITE_API_URL=http://localhost:8000
```

### Using the API in Frontend

Import from `client/src/lib/api.ts`:

```typescript
import { authAPI, patientsAPI, appointmentsAPI } from '@/lib/api';

// Login
const user = await authAPI.login('username', 'password');

// Get patients
const patients = await patientsAPI.getAll();

// Create appointment
const appointment = await appointmentsAPI.create({
  patientId: '123',
  doctorId: '456',
  appointmentDate: new Date(),
  reason: 'Checkup'
});
```

## CORS Configuration

The Python backend (`server_py/main.py`) allows:
- ✅ https://dda-frontend.onrender.com (production)
- ✅ http://localhost:5173 (development)
- ✅ http://localhost:3000 (alternative dev port)

## Database

### Schema Management
- **SQLAlchemy** auto-creates tables on startup
- No manual migrations needed
- Tables defined in `server_py/models/`

### Connection
- PostgreSQL on Render
- Connection string from `DATABASE_URL` environment variable
- Automatic connection pooling

## Deployment Steps

### 1. Commit Changes
```bash
git add .
git commit -m "Migrate to Python FastAPI backend only architecture"
git push origin main
```

### 2. Render Auto-Deploys
- Backend deploys to https://dda-backend.onrender.com
- Frontend deploys to https://dda-frontend.onrender.com

### 3. Verify Deployment

**Test Backend API:**
Visit: https://dda-backend.onrender.com/docs
- Should see FastAPI auto-generated documentation

**Test Frontend:**
Visit: https://dda-frontend.onrender.com
- Frontend should load
- Check browser console for API calls
- Should see: `API URL: https://dda-backend.onrender.com`

**Check Logs:**
Render Dashboard → dda-backend → Logs
- Should show: "Python backend started successfully"

## Benefits

✅ **No Schema Conflicts** - Only Python touches the database  
✅ **Simpler Deployment** - Frontend is just static files  
✅ **Better Performance** - Static frontend loads faster  
✅ **Easier Scaling** - Backend and frontend scale independently  
✅ **Better Security** - No database credentials in frontend  
✅ **Auto Documentation** - FastAPI generates API docs at `/docs`

## Troubleshooting

### Frontend Can't Reach Backend

**Check CORS:**
```python
# server_py/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dda-frontend.onrender.com", ...],
    ...
)
```

**Check Environment Variable:**
```bash
# In browser console
console.log(import.meta.env.VITE_API_URL)
```

**Check Browser Console:**
Look for CORS errors or network failures

### Backend Errors

**Check Render Logs:**
Render Dashboard → dda-backend → Logs

**Verify DATABASE_URL:**
Should be set automatically from Render database

**Check Dependencies:**
All Python packages must be in `requirements.txt`

### Database Issues

**Tables Not Created:**
- Check startup logs for "Creating tables..."
- SQLAlchemy auto-creates on first run

**Connection Errors:**
- Verify DATABASE_URL is set in Render
- Check database is running

## Files Modified

- ✅ `render.yaml` - Updated deployment config
- ✅ `server_py/main.py` - Updated CORS settings
- ✅ `client/src/lib/api.ts` - New API utility (created)
- ✅ `client/.env.production` - Production API URL (created)
- ✅ `client/.env.development` - Development API URL (created)

## Next Steps

1. Test locally following the "Local Development" section
2. Commit and push changes
3. Wait for Render to deploy
4. Test production deployment
5. Update any frontend code to use the new `api.ts` utilities

## Support

For issues:
1. Check Render logs (Backend and Frontend)
2. Check browser console for errors
3. Verify environment variables are set
4. Test API endpoints at `/docs`
