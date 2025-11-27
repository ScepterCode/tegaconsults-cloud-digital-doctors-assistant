# DDA Implementation Index - Where to Start

## 📚 Documentation Reading Order

1. **README.md** ← Start here for complete overview
2. **QUICK_START.md** ← Setup in 5 minutes
3. **This file** ← Navigation guide
4. **FILE_MANIFEST.txt** ← Detailed file descriptions

## 🚀 Quick Start (5 minutes)

```bash
# 1. Set environment variables
export DATABASE_URL="postgresql://..."
export OPENAI_API_KEY="sk-..."

# 2. Install and setup database
npm install
npm run db:push

# 3. Start development
npm run dev

# 4. Login at http://localhost:5000
# Admin: admin / paypass
```

## 📁 File Navigation

### For Backend Developers
**Read these files in order:**

1. `database/schema.ts` - Understand the data model (7 tables, 319 lines)
2. `backend/routes.ts` - All API endpoints (1129 lines, 49+ endpoints)
3. `backend/production-storage.ts` - Database operations
4. `backend/openai-service.ts` - Dr. Tega chatbot
5. `backend/department-automation-service.ts` - Patient routing logic
6. `backend/ml-service.ts` - Health scoring
7. `backend/nlp-service.ts` - Medical text analysis
8. `backend/advanced-llm-service.ts` - Treatment planning

### For Frontend Developers
**Read these files in order:**

1. `frontend/App.tsx` - App structure and routing
2. `frontend/index.css` - Design system and styles
3. `frontend/[pages]` - Page components
4. `frontend/[components]` - Reusable UI components
5. `config/vite.config.ts` - Build configuration
6. `config/tailwind.config.ts` - Styling configuration

### For DevOps/Deployment
**Read these files:**

1. `config/package.json` - Dependencies and scripts
2. `config/drizzle.config.ts` - Database configuration
3. `config/tsconfig.json` - TypeScript configuration
4. `README.md` - Deployment section
5. `QUICK_START.md` - Setup section

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│               React Frontend                          │
│  - Wouter routing  - Shadcn/UI  - TanStack Query   │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/JSON
┌──────────────────▼──────────────────────────────────┐
│           Express.js Backend (Node.js)               │
│  - 49+ API endpoints  - Zod validation              │
└──────────────────┬──────────────────────────────────┘
                   │ Drizzle ORM
┌──────────────────▼──────────────────────────────────┐
│          PostgreSQL Database (Neon)                  │
│  - 7 tables  - Relational schema  - Async support   │
└─────────────────────────────────────────────────────┘

AI/ML Services (async):
- OpenAI GPT-5 (Dr. Tega chatbot)
- ML Health Service (scoring)
- NLP Service (text analysis)
- Advanced LLM (treatment planning)
```

## 📊 Feature Implementation Map

### Patient Management
- **Files**: `routes.ts` (lines 192-273), `production-storage.ts`
- **Database**: `patients` table
- **Endpoints**: 6 CRUD + search

### Health Assessment & AI
- **Files**: `ml-service.ts`, `openai-service.ts`
- **Routes**: `/api/patients/:id/health-analysis`, `/api/chatbot/ask`
- **Features**: Risk scoring, diagnosis suggestions, Dr. Tega chatbot

### Department Automation
- **Files**: `department-automation-service.ts`
- **Database**: `departments`, `notifications` tables
- **Features**: Patient-to-department matching, auto-notifications

### Lab Results
- **Files**: `routes.ts` (lines 324-396), `production-storage.ts`
- **Database**: `lab_results` table
- **Endpoints**: 5 CRUD + patient lookup

### Appointments
- **Files**: `routes.ts` (lines 427-496), `production-storage.ts`
- **Database**: `appointments` table
- **Endpoints**: 6 CRUD + patient/doctor lookup

### NLP & LLM Services
- **Files**: `nlp-service.ts`, `advanced-llm-service.ts`
- **Routes**: `/api/nlp/*`, `/api/llm/*`
- **Features**: Entity extraction, drug alternatives, treatment plans

## 🔍 How to Find Specific Features

| Feature | File | Lines | Note |
|---------|------|-------|------|
| User Registration | routes.ts | 15-44 | Zod validation + duplicate check |
| Patient CRUD | routes.ts | 192-273 | Full CRUD with search |
| Health Analysis | ml-service.ts | All | Risk scoring algorithm |
| Dr. Tega Chatbot | openai-service.ts | All | GPT-5 + caching |
| Department Routing | department-automation-service.ts | All | Weighted scoring |
| Lab Results Upload | routes.ts | 325-340 | Auto-analysis included |
| Appointments Booking | routes.ts | 428-436 | Payment tracking |
| NLP Analysis | routes.ts | 662-700+ | Medical entity extraction |

## 💾 Database Quick Reference

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| users | Authentication & roles | id, username, role, departmentId |
| patients | Patient data | id, mrn, vitals, biometrics |
| appointments | Scheduling | patientId, doctorId, appointmentDate |
| lab_results | Test results | patientId, status, automatedAnalysis |
| departments | Hospital structure | hospitalAdminId, name, headStaffId |
| notifications | Real-time alerts | departmentId, type, priority |
| subscriptions | Billing | adminUserId, tier, status |

## 🔑 API Endpoints by Category

| Category | Count | Examples |
|----------|-------|----------|
| Authentication | 4 | login, register, password reset |
| Patients | 6 | CRUD + search |
| Health Analysis | 1 | risk scoring |
| Lab Results | 5 | CRUD + patient lookup |
| Chatbot | 1 | ask Dr. Tega |
| Appointments | 6 | CRUD + lookup |
| Departments | 4 | list, notifications |
| NLP Services | 4 | analyze, extract, normalize, urgency |
| LLM Services | 6 | alternatives, plans, interactions, etc. |
| Automation | 3 | analyze, notify, vital alerts |
| **TOTAL** | **49+** | **All endpoints documented** |

## 🛠️ Common Development Tasks

### Add a New API Endpoint
1. Define Zod schema in `schema.ts` if needed
2. Add route in `backend/routes.ts`
3. Add storage method in `production-storage.ts` if database query needed
4. Use appropriate service for business logic

### Add a New Department
1. Add mapping to `DEPARTMENT_MAPPINGS` in `department-automation-service.ts`
2. Include: keywords, symptoms, conditions, vitals, age range, priority
3. System automatically routes matching patients

### Customize UI Component
1. Check `frontend/components/` for existing shadcn/UI components
2. Review `frontend/index.css` for design tokens
3. Follow Tailwind CSS utility-first approach
4. Add `data-testid` attributes for testing

### Deploy to Production
1. Set environment variables (DATABASE_URL, OPENAI_API_KEY)
2. Run `npm run db:push` on production database
3. Build: `npm run build`
4. Start: `npm start`

## 📖 Code Example: Add a Patient

```typescript
// Frontend (React)
const { mutate } = useMutation({
  mutationFn: async (data) => 
    apiRequest('POST', '/api/patients', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/patients'] })
});

mutate({ mrn: 'MRN001', firstName: 'John', ... });

// Backend (Express)
app.post("/api/patients", async (req, res) => {
  const patientData = insertPatientSchema.parse(req.body);
  const patient = await storage.createPatient(patientData);
  return res.status(201).json(patient);
});

// Database (Drizzle ORM)
async createPatient(data: InsertPatient) {
  return db.insert(patients).values(data).returning();
}
```

## 🔐 Security & Best Practices

- **Passwords**: Hashed before storage
- **Validation**: All inputs validated with Zod
- **Authentication**: Session-based with role checks
- **Biometrics**: Facial recognition and fingerprint support
- **Rate Limiting**: Consider adding for production

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Database won't connect | Check DATABASE_URL format |
| Chatbot responses slow | OpenAI API latency, check cache |
| Departments not routing | Verify patient has symptoms/vitals |
| Login fails | Check username/password in seed data |
| Frontend doesn't load | Run `npm run dev` not `npm start` |

## 📞 Support Resources

- **API Documentation**: routes.ts has all endpoints with examples
- **Database Schema**: schema.ts has full type definitions
- **Frontend Components**: shadcn/ui documentation + local component files
- **AI Integration**: openai-service.ts for chatbot, llm-service.ts for advanced features

---

**Ready to start?** → Open `QUICK_START.md` now!
