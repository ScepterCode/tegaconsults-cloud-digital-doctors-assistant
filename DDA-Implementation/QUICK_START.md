# DDA Quick Start Guide

## 5-Minute Setup

### 1. Environment Setup
```bash
# Create .env file with:
DATABASE_URL=postgresql://user:password@host/dbname
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
NODE_ENV=development
```

### 2. Database Setup
```bash
# Initialize database with Drizzle
npm run db:push

# Database automatically seeds with default users on first run
```

### 3. Start Development Server
```bash
npm run dev
# Frontend: http://localhost:5000
# Backend: http://localhost:5000/api
```

### 4. Login with Default Credentials
```
Admin:   admin / paypass
Doctor:  doctor1 / pass123
Nurse:   nurse1 / nursepass
Patient: patient / paypass
```

## Key Concepts

### Patient Registration
1. Admin/Doctor registers patient with biodata
2. System assigns unique MRN (Medical Record Number)
3. Optional: Add biometric data (facial/fingerprint)

### Health Assessment
1. Doctor updates patient vitals
2. System automatically scores health risk (LOW/MODERATE/HIGH/CRITICAL)
3. AI suggests possible diagnoses with confidence scores
4. Recommends treatments and medications

### Department Automation
1. When patient is registered/updated, system analyzes their data
2. Intelligent algorithm matches to relevant departments
3. Automatic notifications sent to matched departments
4. Departments can view all patients needing their services

### Lab Results
1. Doctor uploads lab result (PDF, image, or JSON)
2. System performs automated analysis
3. AI interprets results and flags abnormalities
4. Doctor can add clinical notes and recommendations

### Appointments
1. Patient books appointment with doctor
2. Payment tracking (₦1000 per appointment)
3. Doctor confirms/completes appointment
4. Automatic notifications to department

## Common Tasks

### Register a New Patient
```
POST /api/patients
{
  "mrn": "MRN001",
  "firstName": "John",
  "lastName": "Doe",
  "age": 45,
  "gender": "male",
  "phoneNumber": "08012345678",
  "nin": "12345678901",
  "bloodGroup": "O+",
  "genotype": "AA",
  "registeredBy": "admin_id"
}
```

### Update Patient Vitals (Triggers Automation)
```
PATCH /api/patients/:id
{
  "bloodPressureSystolic": 160,
  "bloodPressureDiastolic": 100,
  "heartRate": 120,
  "temperature": "39.5",
  "symptoms": "chest pain, shortness of breath"
}
```

### Ask Dr. Tega a Question
```
POST /api/chatbot/ask
{
  "question": "What are the symptoms of hypertension?"
}
```

### Upload Lab Result
```
POST /api/lab-results
{
  "patientId": "patient_id",
  "testName": "Blood Test",
  "testCategory": "Hematology",
  "fileData": "base64_encoded_data",
  "fileName": "blood_test.pdf",
  "status": "normal",
  "uploadedBy": "doctor_id"
}
```

### Search Patient by NIN
```
POST /api/patients/search
{
  "query": "12345678901",
  "searchType": "nin"
}
```

## Backend Service Architecture

### Storage Layer (production-storage.ts)
- All database operations go through ProductionStorage class
- Implements IStorage interface for type safety
- Uses Drizzle ORM for type-safe queries

### Service Layer
- **MLHealthService**: Health risk scoring, vital analysis
- **OpenAIService**: Dr. Tega chatbot with caching
- **NLPService**: Medical text analysis
- **AdvancedLLMService**: Treatment planning, drug alternatives
- **DepartmentAutomationService**: Patient-to-department routing

### API Layer (routes.ts)
- All endpoints validate input with Zod schemas
- Use storage layer for database operations
- Route through appropriate service layer
- Return typed responses

## Frontend Architecture

### Pages (client/src/pages/)
- Dashboard: Overview and navigation
- Patients: Patient management and search
- HealthAssessment: AI health risk analysis
- Appointments: Appointment scheduling
- LabResults: Lab result upload and viewing
- Chatbot: Dr. Tega conversational interface
- Departments: Department management

### Components (client/src/components/)
- UI components from Shadcn/UI
- Custom healthcare-specific components
- Reusable form components with validation
- Data display tables and cards

### State Management
- TanStack Query for server state (caching, background sync)
- React Context for auth state
- localStorage for theme persistence

## Deployment Checklist

- [ ] Set up PostgreSQL database (Neon or AWS RDS)
- [ ] Configure environment variables
- [ ] Run `npm run db:push` on production database
- [ ] Build frontend: `npm run build`
- [ ] Start server: `npm start`
- [ ] Verify all endpoints: `GET /api/users`
- [ ] Test authentication flow
- [ ] Test patient registration
- [ ] Test chatbot with OpenAI key

## Troubleshooting

### Database connection fails
- Verify DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`
- Check PostgreSQL server is running
- Verify network connectivity

### OpenAI API errors
- Check OPENAI_API_KEY is set and valid
- Verify API key has appropriate permissions
- Check OpenAI account has credits

### Chatbot responses slow
- Check network latency to OpenAI
- Review OpenAI rate limits
- Check cached responses (5-minute TTL)

### Department notifications not sending
- Verify departments exist in database
- Check patient data has symptoms/vitals
- Review department mapping in department-automation-service.ts

## Performance Optimization

1. **Chatbot Caching**: 5-minute TTL cache for common queries
2. **Quick Responses**: EXACT-match for greetings (instant)
3. **Lazy Loading**: Frontend components loaded on demand
4. **Database Indexing**: Add indexes on frequently queried fields
5. **API Batching**: Use TanStack Query for request deduplication

## Next Steps

1. Review `backend/` files for service implementations
2. Check `frontend/` components for UI patterns
3. Explore `database/schema.ts` for data model
4. Test API endpoints with Postman or cURL
5. Customize department mappings for your hospital
6. Add branding and customize colors in `frontend/index.css`
