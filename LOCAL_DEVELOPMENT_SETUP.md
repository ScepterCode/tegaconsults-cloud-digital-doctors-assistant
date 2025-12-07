# Local Development Setup Guide

## Prerequisites

Before starting, ensure you have:
- **Python 3.11+** installed
- **Node.js 18+** and npm installed
- **Git** installed
- A code editor (VS Code recommended)

## Quick Start (5 Minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/ScepterCode/tegaconsults-cloud-digital-doctors-assistant.git
cd tegaconsults-cloud-digital-doctors-assistant
```

### 2. Set Up Python Backend

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Create Environment File
Create a `.env` file in the root directory:
```bash
# .env
DATABASE_URL=sqlite:///./local_dev.db
OPENAI_API_KEY=your-openai-api-key-here
```

**Note:** For local development, SQLite is used automatically. No PostgreSQL setup needed!

#### Initialize Database
```bash
python init_db.py
```

This creates:
- SQLite database with all tables
- Default admin user (username: `admin`, password: `paypass`)
- Sample data

#### Start Python Backend
```bash
python -m uvicorn server_py.main:app --reload --port 8000
```

**Backend will be running at:** http://localhost:8000

**Verify it's working:**
- Visit: http://localhost:8000/docs (FastAPI documentation)
- Visit: http://localhost:8000/api/health (should return `{"status":"healthy"}`)

### 3. Set Up React Frontend

#### Install Node Dependencies
```bash
cd client
npm install
```

#### Create Environment File
Create `client/.env.development`:
```bash
VITE_API_URL=http://localhost:8000
```

#### Start Frontend
```bash
npm run dev
```

**Frontend will be running at:** http://localhost:5173

### 4. Access the Application

Open your browser and go to: **http://localhost:5173**

**Default Login Credentials:**
- Username: `admin`
- Password: `paypass`

## Project Structure

```
tegaconsults-cloud-digital-doctors-assistant/
├── server_py/              # Python FastAPI Backend
│   ├── api/               # API endpoints
│   ├── models/            # Database models (SQLAlchemy)
│   ├── services/          # Business logic
│   ├── db/                # Database configuration
│   └── main.py            # FastAPI app entry point
├── client/                # React Frontend
│   ├── src/
│   │   ├── pages/        # React pages/routes
│   │   ├── components/   # Reusable components
│   │   └── lib/          # Utilities (API client, etc.)
│   └── package.json
├── requirements.txt       # Python dependencies
├── .env                   # Backend environment variables
└── README.md
```

## Available User Accounts

After running `init_db.py`, these accounts are available:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `admin` | `paypass` | system_admin | Full system access |
| `doctor1` | `pass123` | doctor | Doctor account |
| `nurse1` | `nursepass` | nurse | Nurse account |
| `patient` | `paypass` | patient | Patient account |

## Common Commands

### Backend Commands

```bash
# Start backend (development mode with auto-reload)
python -m uvicorn server_py.main:app --reload --port 8000

# Run database migrations
python migrate_database_schema.py

# Seed additional data
python seed_patients.py
python create_additional_staff.py

# Test API directly
curl http://localhost:8000/api/health
```

### Frontend Commands

```bash
# Start development server
cd client
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
```

## Environment Variables

### Backend (.env)
```bash
# Database (SQLite for local, PostgreSQL for production)
DATABASE_URL=sqlite:///./local_dev.db

# OpenAI API (optional for AI features)
OPENAI_API_KEY=sk-your-key-here

# Agora (optional for video calls)
AGORA_APP_ID=your-app-id
AGORA_APP_CERTIFICATE=your-certificate
```

### Frontend (client/.env.development)
```bash
# Backend API URL
VITE_API_URL=http://localhost:8000
```

## Features Available Locally

### ✅ Working Features
- User authentication (login/logout)
- Patient management (CRUD)
- Appointments scheduling
- Medical records
- Prescriptions
- Lab results
- Department management
- Team management
- Billing system
- Pharmacy inventory
- Subscription management
- Personal diary
- Patient timeline
- Tickets system

### ⚠️ Features Requiring API Keys
- **AI Clinical Assistant** - Requires `OPENAI_API_KEY`
- **Health Chatbot** - Requires `OPENAI_API_KEY`
- **Video Calls** - Requires Agora credentials

### 🚫 Suspended Features
- Facial recognition (temporarily disabled)

## Troubleshooting

### Backend Issues

#### "Module not found" Error
```bash
# Make sure you're in the project root
pip install -r requirements.txt
```

#### "Database locked" Error
```bash
# Stop all running instances and restart
# Delete local_dev.db and run init_db.py again
rm local_dev.db
python init_db.py
```

#### Port 8000 Already in Use
```bash
# Use a different port
python -m uvicorn server_py.main:app --reload --port 8001

# Update client/.env.development
VITE_API_URL=http://localhost:8001
```

### Frontend Issues

#### "Cannot connect to backend"
1. Verify backend is running at http://localhost:8000
2. Check `client/.env.development` has correct URL
3. Check browser console for errors

#### "Module not found" Error
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

#### Port 5173 Already in Use
```bash
# Vite will automatically use next available port
# Or specify a port:
npm run dev -- --port 3000
```

### CORS Errors

If you see CORS errors in browser console:
1. Verify backend is running
2. Check `server_py/main.py` includes `http://localhost:5173` in CORS origins
3. Restart backend after changes

## Database Management

### Using SQLite (Default for Local)

**View Database:**
```bash
# Install SQLite browser or use command line
sqlite3 local_dev.db
.tables
.schema users
SELECT * FROM users;
```

**Reset Database:**
```bash
rm local_dev.db
python init_db.py
```

### Switching to PostgreSQL (Optional)

1. Install PostgreSQL locally
2. Create database:
   ```bash
   createdb digital_doctors_local
   ```
3. Update `.env`:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost/digital_doctors_local
   ```
4. Run migrations:
   ```bash
   python migrate_database_schema.py
   ```

## Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `server_py/`
   - Backend auto-reloads (if using `--reload`)
   - Test at http://localhost:8000/docs

2. **Frontend Changes:**
   - Edit files in `client/src/`
   - Frontend auto-reloads (Vite HMR)
   - Changes appear instantly in browser

3. **Database Changes:**
   - Update models in `server_py/models/`
   - Create migration script or reset database
   - Restart backend

### Testing

```bash
# Test backend endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"auth_method":"credentials","username":"admin","password":"paypass"}'

# Test frontend build
cd client
npm run build
npm run preview
```

## IDE Setup (VS Code)

### Recommended Extensions
- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens

### Workspace Settings
Create `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "python",
  "python.linting.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add: your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## Production Deployment

This project is deployed on:
- **Frontend:** Vercel (https://digital-doctors-assistant.vercel.app)
- **Backend:** Render (https://tegaconsults-cloud-digital-doctors.onrender.com)
- **Database:** PostgreSQL on Render

See `VERCEL_RENDER_DEPLOYMENT.md` for deployment instructions.

## Additional Resources

### Documentation Files
- `README.md` - Project overview
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `VERCEL_RENDER_DEPLOYMENT.md` - Vercel + Render setup
- `CORS_FIX_COMPLETE.md` - CORS troubleshooting
- `USER_CREDENTIALS.txt` - All user accounts

### API Documentation
- Local: http://localhost:8000/docs
- Production: https://tegaconsults-cloud-digital-doctors.onrender.com/docs

### Feature Documentation
- `MEDICAL_RECORDS_SYSTEM.md` - Medical records feature
- `PHARMACY_INVENTORY_SYSTEM.md` - Pharmacy system
- `SUBSCRIPTION_SYSTEM.md` - Subscription management
- `BILLING_IMPLEMENTATION_STATUS.md` - Billing system
- `PATIENT_TIMELINE_FEATURE.md` - Patient timeline

## Getting Help

### Check Logs

**Backend Logs:**
- Terminal where `uvicorn` is running
- Look for errors, stack traces

**Frontend Logs:**
- Browser console (F12)
- Network tab for API calls

### Common Issues

1. **Login not working:**
   - Check backend is running
   - Verify credentials (admin/paypass)
   - Check browser console for errors

2. **API calls failing:**
   - Verify `VITE_API_URL` in `.env.development`
   - Check backend is running at that URL
   - Look for CORS errors

3. **Database errors:**
   - Reset database: `rm local_dev.db && python init_db.py`
   - Check `DATABASE_URL` in `.env`

## Summary

**To get started:**
1. Clone repo
2. Install Python dependencies: `pip install -r requirements.txt`
3. Create `.env` file with `DATABASE_URL=sqlite:///./local_dev.db`
4. Initialize database: `python init_db.py`
5. Start backend: `python -m uvicorn server_py.main:app --reload --port 8000`
6. Install Node dependencies: `cd client && npm install`
7. Create `client/.env.development` with `VITE_API_URL=http://localhost:8000`
8. Start frontend: `npm run dev`
9. Open http://localhost:5173
10. Login with `admin` / `paypass`

**You're ready to develop!** 🚀
