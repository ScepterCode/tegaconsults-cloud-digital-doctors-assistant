# AI Agent Setup Prompt for Digital Doctors Assistant

## Context
You are helping a developer set up the Digital Doctors Assistant project locally. This is a full-stack healthcare management system with:
- **Backend:** Python FastAPI with SQLAlchemy ORM
- **Frontend:** React + TypeScript with Vite
- **Database:** SQLite (local) or PostgreSQL (production)
- **Features:** Patient management, appointments, medical records, billing, pharmacy, AI chatbot, telemedicine

## Your Task
Guide the developer through setting up and running the project on their local machine. Follow these steps exactly.

---

## Step 1: Verify Prerequisites

Check if the developer has the required tools installed:

```bash
# Check Python version (need 3.11+)
python --version

# Check Node.js version (need 18+)
node --version

# Check npm
npm --version

# Check git
git --version
```

**If any are missing:**
- Python: Download from https://www.python.org/downloads/
- Node.js: Download from https://nodejs.org/
- Git: Download from https://git-scm.com/

---

## Step 2: Clone the Repository

```bash
git clone https://github.com/ScepterCode/tegaconsults-cloud-digital-doctors-assistant.git
cd tegaconsults-cloud-digital-doctors-assistant
```

**Verify:** Check that you're in the project root directory with `ls` or `dir`.

---

## Step 3: Set Up Python Backend

### 3.1 Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Expected output:** Should install packages like fastapi, uvicorn, sqlalchemy, psycopg2-binary, etc.

**If errors occur:**
- Windows: May need Visual C++ Build Tools for some packages
- Mac/Linux: May need `python3` and `pip3` instead of `python` and `pip`

### 3.2 Create Environment File

Create a `.env` file in the project root:

```bash
# For Windows (PowerShell)
echo "DATABASE_URL=sqlite:///./local_dev.db" > .env

# For Mac/Linux
echo "DATABASE_URL=sqlite:///./local_dev.db" > .env
```

**Or manually create `.env` with this content:**
```
DATABASE_URL=sqlite:///./local_dev.db
OPENAI_API_KEY=optional-for-ai-features
```

### 3.3 Initialize Database

```bash
python init_db.py
```

**Expected output:**
```
Creating database tables...
Database initialized successfully
Created default users:
- admin (system_admin)
- doctor1 (doctor)
- nurse1 (nurse)
- patient (patient)
```

**This creates:**
- `local_dev.db` file (SQLite database)
- All necessary tables
- Default user accounts

### 3.4 Start Backend Server

```bash
python -m uvicorn server_py.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
Starting Digital Doctors Assistant Python Backend...
Python backend started successfully on port 5000
```

**Verify backend is running:**
- Open browser: http://localhost:8000/docs
- Should see FastAPI Swagger documentation
- Or test: `curl http://localhost:8000/api/health`

**Keep this terminal open!** The backend needs to keep running.

---

## Step 4: Set Up React Frontend

### 4.1 Open New Terminal

Keep the backend terminal running and open a new terminal window.

Navigate to the client directory:
```bash
cd client
```

### 4.2 Install Node Dependencies

```bash
npm install
```

**Expected output:** Should install ~2000+ packages (React, Vite, Tailwind, etc.)

**If errors occur:**
- Try: `npm install --legacy-peer-deps`
- Or: Delete `node_modules` and `package-lock.json`, then retry

### 4.3 Create Environment File

Create `client/.env.development`:

```bash
# For Windows (PowerShell)
echo "VITE_API_URL=http://localhost:8000" > .env.development

# For Mac/Linux
echo "VITE_API_URL=http://localhost:8000" > .env.development
```

**Or manually create `client/.env.development` with:**
```
VITE_API_URL=http://localhost:8000
```

### 4.4 Start Frontend Server

```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal open too!**

---

## Step 5: Access the Application

### 5.1 Open Browser

Navigate to: **http://localhost:5173**

### 5.2 Login

Use these default credentials:

**System Admin:**
- Username: `admin`
- Password: `paypass`

**Other accounts:**
- Doctor: `doctor1` / `pass123`
- Nurse: `nurse1` / `nursepass`
- Patient: `patient` / `paypass`

### 5.3 Verify Everything Works

After logging in, you should see:
- Dashboard with navigation sidebar
- No console errors (press F12 to check)
- API calls going to `http://localhost:8000` (check Network tab)

---

## Step 6: Troubleshooting Common Issues

### Issue: "Module not found" (Python)

**Solution:**
```bash
pip install -r requirements.txt
# Or try:
pip install --upgrade pip
pip install -r requirements.txt
```

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Use different port
python -m uvicorn server_py.main:app --reload --port 8001

# Update client/.env.development
VITE_API_URL=http://localhost:8001
```

### Issue: "Cannot connect to backend" (Frontend)

**Check:**
1. Backend is running at http://localhost:8000
2. `client/.env.development` exists with correct URL
3. No CORS errors in browser console

**Solution:**
```bash
# Restart backend
# Verify .env.development file
# Clear browser cache
```

### Issue: "Database locked"

**Solution:**
```bash
# Stop all running instances
# Delete and recreate database
rm local_dev.db
python init_db.py
```

### Issue: CORS Errors

**Check `server_py/main.py` includes:**
```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
]
```

### Issue: "npm install" fails

**Solution:**
```bash
cd client
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Step 7: Project Structure Overview

```
tegaconsults-cloud-digital-doctors-assistant/
├── server_py/              # Python FastAPI Backend
│   ├── api/               # API endpoints (auth, patients, etc.)
│   ├── models/            # SQLAlchemy database models
│   ├── services/          # Business logic
│   ├── db/                # Database configuration
│   └── main.py            # FastAPI app entry point
│
├── client/                # React Frontend
│   ├── src/
│   │   ├── pages/        # React pages (dashboard, login, etc.)
│   │   ├── components/   # Reusable UI components
│   │   ├── lib/          # Utilities (API client, etc.)
│   │   └── App.tsx       # Main React component
│   ├── package.json
│   └── vite.config.ts
│
├── requirements.txt       # Python dependencies
├── init_db.py            # Database initialization script
├── .env                  # Backend environment variables
└── local_dev.db          # SQLite database (created after init)
```

---

## Step 8: Available Features

Once running, the developer can access:

### Core Features
- ✅ User authentication (login/logout)
- ✅ Patient management (create, view, edit)
- ✅ Appointments scheduling
- ✅ Medical records
- ✅ Prescriptions
- ✅ Lab results
- ✅ Department management
- ✅ Team management
- ✅ Billing system
- ✅ Pharmacy inventory
- ✅ Subscription management
- ✅ Personal diary
- ✅ Patient timeline
- ✅ Support tickets

### AI Features (Require OPENAI_API_KEY)
- ⚠️ AI Clinical Assistant
- ⚠️ Health Chatbot

### Video Features (Require Agora credentials)
- ⚠️ Telemedicine video calls

---

## Step 9: Making Changes

### Backend Changes
1. Edit files in `server_py/`
2. Backend auto-reloads (if using `--reload`)
3. Test at http://localhost:8000/docs

### Frontend Changes
1. Edit files in `client/src/`
2. Frontend auto-reloads (Vite HMR)
3. Changes appear instantly in browser

### Database Changes
1. Update models in `server_py/models/`
2. Reset database: `rm local_dev.db && python init_db.py`
3. Restart backend

---

## Step 10: Testing API Endpoints

### Test Login Endpoint
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"auth_method":"credentials","username":"admin","password":"paypass"}'
```

**Expected response:**
```json
{
  "user": {
    "id": "...",
    "username": "admin",
    "fullName": "System Administrator",
    "role": "system_admin"
  }
}
```

### Test Health Endpoint
```bash
curl http://localhost:8000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "Digital Doctors Assistant",
  "version": "2.0.0",
  "backend": "Python/FastAPI"
}
```

---

## Step 11: Stopping the Application

### Stop Backend
- Press `Ctrl+C` in the backend terminal

### Stop Frontend
- Press `Ctrl+C` in the frontend terminal

### Restart Later
```bash
# Terminal 1: Backend
python -m uvicorn server_py.main:app --reload --port 8000

# Terminal 2: Frontend
cd client
npm run dev
```

---

## Step 12: Additional Resources

### Documentation Files
- `LOCAL_DEVELOPMENT_SETUP.md` - Detailed setup guide
- `README.md` - Project overview
- `USER_CREDENTIALS.txt` - All user accounts
- `DEPLOYMENT_GUIDE.md` - Production deployment

### API Documentation
- Local: http://localhost:8000/docs
- Interactive API testing with Swagger UI

### Feature Documentation
- `MEDICAL_RECORDS_SYSTEM.md`
- `PHARMACY_INVENTORY_SYSTEM.md`
- `SUBSCRIPTION_SYSTEM.md`
- `BILLING_IMPLEMENTATION_STATUS.md`

---

## Success Criteria

The setup is successful when:
- ✅ Backend running at http://localhost:8000
- ✅ Frontend running at http://localhost:5173
- ✅ Can login with admin/paypass
- ✅ Dashboard loads without errors
- ✅ API calls visible in Network tab
- ✅ No CORS errors in console

---

## Quick Reference Commands

### Start Everything
```bash
# Terminal 1: Backend
python -m uvicorn server_py.main:app --reload --port 8000

# Terminal 2: Frontend
cd client
npm run dev
```

### Reset Database
```bash
rm local_dev.db
python init_db.py
```

### View API Documentation
```
http://localhost:8000/docs
```

### Access Application
```
http://localhost:5173
Login: admin / paypass
```

---

## Production Deployment Info

This project is deployed on:
- **Frontend:** Vercel (https://digital-doctors-assistant.vercel.app)
- **Backend:** Render (https://tegaconsults-cloud-digital-doctors.onrender.com)
- **Database:** PostgreSQL on Render

See `VERCEL_RENDER_DEPLOYMENT.md` for deployment instructions.

---

## Summary for AI Agent

**Your role:** Guide the developer through each step, verify success at each stage, and troubleshoot any issues that arise.

**Key points:**
1. Check prerequisites first
2. Set up backend before frontend
3. Verify each component works before moving on
4. Use the troubleshooting section for common issues
5. Confirm success criteria at the end

**Expected time:** 5-10 minutes for experienced developers, 15-20 minutes for beginners.

**End goal:** Developer can access http://localhost:5173, login with admin/paypass, and use all features locally.
