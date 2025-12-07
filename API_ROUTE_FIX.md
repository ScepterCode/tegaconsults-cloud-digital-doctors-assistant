# API Route 404/405 Error Fix

## Current Status

✅ **Frontend Configuration:** Correct - calling `/api/auth/login`  
✅ **Backend Routes:** Correct - defined as `/api/auth/login`  
❌ **Backend Deployment:** Failed - requirements.txt not found

## The Real Problem

Your backend on Render failed to deploy because it couldn't find `requirements.txt`. This means:
- Backend service is not running
- API endpoints are not available
- Frontend gets 404/405 errors

## Solution: Fix Render Deployment

### Check Current Deployment Status

1. Go to: https://dashboard.render.com
2. Click on **dda-backend** service
3. Check status:
   - 🔴 **Deploy failed** - Need to fix
   - 🟡 **Building** - Wait for it to complete
   - 🟢 **Live** - Backend is running

### If Deploy Failed:

The issue is that `requirements.txt` is in your repo but Render can't find it. This might be because:

1. **Render is looking in wrong directory**
2. **File wasn't properly committed**
3. **Build command needs adjustment**

### Quick Fix Options:

#### Option 1: Use Absolute Path in Build Command

Update `render.yaml`:
```yaml
buildCommand: "ls -la && pip install -r $PWD/requirements.txt"
```

#### Option 2: Specify Python Version

Add to `render.yaml`:
```yaml
services:
  - type: web
    name: dda-backend
    env: python
    pythonVersion: "3.11.0"  # Add this
    buildCommand: "pip install -r requirements.txt"
```

#### Option 3: Use render.yaml from Dashboard

Instead of using `render.yaml`, configure directly in Render Dashboard:

1. Go to Render Dashboard
2. Click **dda-backend** → Settings
3. Update Build Command:
   ```bash
   pip install -r requirements.txt
   ```
4. Update Start Command:
   ```bash
   gunicorn server_py.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120
   ```
5. Click **Save Changes**
6. Click **Manual Deploy** → **Deploy latest commit**

## Verify Backend is Running

### Test 1: Health Check
```bash
curl https://tegaconsults-cloud-digital-doctors.onrender.com/api/health
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

### Test 2: API Documentation
Visit: https://tegaconsults-cloud-digital-doctors.onrender.com/docs

**Expected:**
- FastAPI Swagger UI loads
- Shows all API endpoints
- `/api/auth/login` is listed as POST method

### Test 3: Login Endpoint
```bash
curl -X POST https://tegaconsults-cloud-digital-doctors.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"auth_method":"credentials","username":"admin","password":"paypass"}'
```

**Expected:**
- Status: 200 OK
- Returns user data and token

## Current Route Configuration

### Backend Routes (Correct ✅)

**File:** `server_py/api/auth.py`
```python
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")  # Full path: /api/auth/login
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # ...

@router.post("/register")  # Full path: /api/auth/register
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # ...
```

### Frontend API Calls (Correct ✅)

**File:** `client/src/lib/api.ts`
```typescript
export const authAPI = {
  login: (username: string, password: string) =>
    apiFetch('/api/auth/login', {  // Correct path
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
}
```

## Troubleshooting Steps

### 1. Check Render Logs

Go to: Render Dashboard → dda-backend → Logs

**Look for:**
- ✅ "Build successful"
- ✅ "Starting service..."
- ✅ "Python backend started successfully"
- ❌ "ERROR: Could not open requirements file"
- ❌ "Build failed"

### 2. Check Render Environment

Render Dashboard → dda-backend → Environment

**Verify:**
- `DATABASE_URL` is set (auto from database)
- `OPENAI_API_KEY` is set (if using AI features)

### 3. Manual Deploy

If auto-deploy failed:
1. Render Dashboard → dda-backend
2. Click **Manual Deploy**
3. Select **Clear build cache & deploy**
4. Wait for deployment to complete

### 4. Check Database Connection

If backend starts but crashes:
- Check DATABASE_URL is correct
- Verify database is running
- Check database connection in logs

## Once Backend is Running

### Test from Frontend

1. Visit your Vercel URL
2. Open browser console (F12)
3. Try to login
4. Check Network tab:
   ```
   POST https://tegaconsults-cloud-digital-doctors.onrender.com/api/auth/login
   Status: 200 OK (or 401 if wrong credentials)
   ```

### Expected Behavior

**Success:**
- Status: 200 OK
- Response contains user data
- No CORS errors
- Login works

**Wrong Credentials:**
- Status: 401 Unauthorized
- Response: `{"detail": "Invalid credentials"}`
- This is GOOD - means backend is working!

## Summary

The 404/405 errors are because:
1. ❌ Backend deployment failed (requirements.txt issue)
2. ❌ Backend service is not running
3. ❌ API endpoints are not available

**Fix:**
1. Fix Render deployment (requirements.txt)
2. Verify backend is running
3. Test API endpoints
4. Frontend will work automatically once backend is up

**Your routes are configured correctly!** Just need to get the backend deployed.

## Next Steps

1. **Check Render deployment status**
2. **Fix requirements.txt issue** (see options above)
3. **Verify backend is running** (health check)
4. **Test login from frontend**

Once the backend is deployed and running, your frontend will connect successfully! 🚀
