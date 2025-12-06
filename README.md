# 🏥 Digital Doctors Assistant (DDA)

A comprehensive healthcare management system with AI-powered features, biometric authentication, and multi-tenant support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![React](https://img.shields.io/badge/react-18.3-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.104-green.svg)

## ✨ Features

### 🔐 Authentication & Security
- Multi-method authentication (Username/Password, NIN, Facial Recognition, Fingerprint)
- Role-based access control (System Admin, Hospital Admin, Doctor, Nurse, Patient, etc.)
- Secure session management

### 🤖 AI-Powered Features
- **Health Chatbot (Dr. Tega)** - 24/7 AI health assistant for all users
- **AI Clinical Assistant** - For doctors to analyze patient data, lab results, and get treatment recommendations
- **Predictive Diagnosis** - AI-powered health insights

### 👥 User Management
- Multi-tenant hospital system
- Department and team management
- Staff assignment and workload tracking
- Patient assignment to doctors

### 📋 Clinical Features
- **Patient Management** - Complete patient records with biometric data
- **Doctor Notes** - Clinical notes with privacy controls
- **Lab Results** - Test results with AI analysis
- **Appointments** - Scheduling and management
- **Telemedicine** - Video consultations
- **Prescriptions** - Digital prescription management

### 🎫 Administrative Features
- **Ticketing System** - Task assignment and query management
- **Department Management** - Create and manage hospital departments
- **Team Management** - Specialized teams (Emergency, Surgical, Pediatric, etc.)
- **Patient Assignments** - Assign and reassign patients to doctors

### 📔 Personal Features
- **Personal Diary** - Text, audio, and video diary entries with mood tracking
- Available to all users for personal reflection

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Shadcn/ui** for components
- **TanStack Query** for data fetching
- **Wouter** for routing

### Backend
- **FastAPI** (Python)
- **SQLAlchemy** ORM
- **SQLite** (development) / **PostgreSQL** (production)
- **OpenAI API** for AI features
- **Pydantic** for validation

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/digital-doctors-assistant.git
cd digital-doctors-assistant
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Install Node.js dependencies**
```bash
npm install
```

5. **Run database migrations**
```bash
python migrate_database_schema.py
```

6. **Start the backend**
```bash
python -m uvicorn server_py.main:app --reload --port 5000
```

7. **Start the frontend** (in a new terminal)
```bash
npm run dev:frontend
```

8. **Access the application**
- Frontend: http://localhost:5174
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/docs

## 👤 Test Users

See `USER_CREDENTIALS.txt` for complete list of test accounts.

Quick access:
- **System Admin**: `admin` / `paypass`
- **Hospital Admin**: `hospitaladmin` / `admin123`
- **Doctor**: `doctor1` / `pass123`
- **Nurse**: `nurse1` / `nursepass`
- **Patient**: `patient` / `paypass`

## 🚂 Deployment

### Railway.app (Recommended)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Sign in with GitHub
4. Click "New Project" → "Deploy from GitHub repo"
5. Select your repository
6. Add environment variable: `OPENAI_API_KEY`
7. Railway automatically deploys both frontend and backend!

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

### Other Options
- **Render.com** - See `DEPLOYMENT_GUIDE.md`
- **Vercel + Render** - See `DEPLOYMENT_GUIDE.md`
- **Fly.io** - See `DEPLOYMENT_GUIDE.md`

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Multiple hosting options
- [Railway Deployment](RAILWAY_DEPLOYMENT.md) - Railway-specific guide
- [User Credentials](USER_CREDENTIALS.txt) - Test account details

## 🏗️ Project Structure

```
digital-doctors-assistant/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and helpers
│   │   └── hooks/         # Custom React hooks
├── server_py/             # FastAPI backend
│   ├── api/               # API endpoints
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   └── db/                # Database configuration
├── shared/                # Shared types and schemas
├── media/                 # User-uploaded media
└── docs/                  # Documentation
```

## 🔑 Key Features by Role

### System Admin
- Manage all hospitals
- System-wide statistics
- User management across hospitals

### Hospital Admin
- Hospital dashboard
- Staff management
- Department and team management
- Patient assignments

### Doctor
- Patient management
- AI Clinical Assistant
- Doctor notes
- Lab results analysis
- Appointments and telemedicine

### Nurse
- Patient care
- Vitals monitoring
- Appointments

### Patient
- Personal health records
- Book appointments
- Telemedicine consultations
- View prescriptions

### All Users
- Health Chatbot (Dr. Tega)
- Personal Diary (text, audio, video)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the documentation in the `docs/` folder
- Review deployment guides
- Check backend logs for errors

## 🙏 Acknowledgments

- OpenAI for GPT-4o-mini API
- Shadcn/ui for beautiful components
- FastAPI for the excellent Python framework
- The open-source community

---

**Built with ❤️ for better healthcare management**
