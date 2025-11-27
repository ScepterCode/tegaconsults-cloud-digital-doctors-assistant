# Digital Doctors Assistant

## Overview

Digital Doctors Assistant is a comprehensive healthcare management system designed for clinical environments. The application provides role-based access control for administrators, doctors, and nurses to manage patient records, vital signs, and biodata. Built with a modern tech stack, it emphasizes clinical clarity, data integrity, and efficient workflows for healthcare professionals.

The system supports complete patient lifecycle management including registration with biometric authentication (facial recognition and fingerprint), comprehensive biodata collection (demographics, medical history, allergies), and real-time vital signs tracking (blood pressure, temperature, heart rate, weight, respiratory rate, and oxygen saturation).

**Latest Update**: Added advanced ML/NLP features for medical text analysis, drug interaction checking, treatment planning, and predictive patient outcomes with GPT-5 powered clinical decision support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript
- Single-page application using Wouter for client-side routing
- Component library: shadcn/ui (Radix UI primitives with Tailwind CSS)
- Design system: Material Design 3 with medical/clinical adaptations
- State management: TanStack Query (React Query) for server state
- Form handling: React Hook Form with Zod validation
- Authentication: Context-based auth with localStorage persistence

**UI/UX Principles**:
- Role-based interface differentiation (Admin/Doctor/Nurse views)
- Material Design typography with Inter/Roboto font families
- Responsive grid layouts with mobile-first approach
- Clinical data hierarchy emphasizing zero ambiguity
- Sidebar navigation with collapsible states

### Backend Architecture

**Server Framework**: Express.js with TypeScript
- RESTful API design pattern
- ProductionStorage class with Drizzle ORM + PostgreSQL (Neon serverless)
- Database persistence with automatic schema synchronization
- Session-based authentication with user role management

**Core Services**:
1. **MLHealthService**: Health risk scoring, vital sign analysis, diagnosis suggestions, drug prescriptions
2. **OpenAIService**: GPT-5 powered diagnosis assistance, medical responses, lab result analysis
3. **NLPService**: Medical entity extraction, symptom normalization, urgency detection, drug interactions
4. **AdvancedLLMService**: Drug alternatives, treatment planning, outcome prediction, evidence-based guidelines

**API Endpoints**:
- `/api/auth/*` - Authentication (login, register, password reset)
- `/api/patients` - Patient CRUD operations
- `/api/health-assessment/:patientId` - AI-powered health analysis
- `/api/nlp/*` - NLP services (text analysis, entity extraction, urgency detection)
- `/api/llm/*` - Advanced LLM features (drug alternatives, treatment plans, interactions, outcomes, guidelines)
- `/api/appointments` - Appointment management
- `/api/lab-results` - Lab result management and analysis
- `/api/departments` - Department and notification management

### Advanced ML/NLP Features

**NLP Services** (`server/nlp-service.ts`):
- Medical entity extraction (symptoms, drugs, diseases, body parts, lab values, allergies)
- Symptom normalization with medical terminology database
- Urgency level detection from clinical text (critical, high, medium, low)
- Drug interaction checking with severity assessment
- Allergy conflict detection against prescribed medications

**Advanced LLM Services** (`server/advanced-llm-service.ts`):
- Drug alternative recommendations with advantages/disadvantages
- Comprehensive treatment plan generation
- Patient outcome prediction with success rate calculation
- Evidence-based clinical guidelines for major conditions
- Treatment adherence assessment

**API Endpoints** (New ML/NLP):
- `POST /api/nlp/analyze` - Full text analysis with entities and urgency
- `POST /api/nlp/normalize-symptoms` - Convert text to standard symptom terms
- `POST /api/nlp/extract-entities` - Extract medical entities from text
- `POST /api/nlp/detect-urgency` - Determine clinical urgency from text
- `POST /api/llm/drug-alternatives` - Get alternative drugs with comparisons
- `POST /api/llm/treatment-plan` - Generate comprehensive treatment plans
- `POST /api/llm/check-interactions` - Verify drug interactions
- `POST /api/llm/check-allergies` - Check allergy conflicts with medications
- `POST /api/llm/predict-outcome` - Predict patient treatment outcomes
- `GET /api/llm/guidelines/:condition` - Retrieve evidence-based guidelines

### Data Storage

**Database**: PostgreSQL (Neon serverless) with persistent storage
**ORM**: Drizzle ORM
- Schema-first approach with TypeScript type inference
- Zod schema integration for runtime validation
- Automatic migrations with `npm run db:push`

**Database Schema**:
- Users: Admin/Doctor/Nurse/Patient roles with department assignment
- Patients: Complete biodata, vitals, biometric data (facial, fingerprint)
- Appointments: Scheduling with status tracking
- Lab Results: Results storage with AI analysis metadata
- Subscriptions: Hospital tier management (free/trial/active)
- Departments: Hospital structure with notifications
- Notifications: Department task management and alerts

**Production Storage**: ProductionStorage class implements IStorage interface with full CRUD operations using Drizzle ORM queries

### External Dependencies

**AI/ML**:
- OpenAI GPT-5 (`openai` package) - Advanced clinical decision support
- NLP medical terminology database - Integrated in NLPService

**UI Component Library**:
- Radix UI primitives (@radix-ui/react-*) - Accessible, unstyled component primitives
- shadcn/ui configuration - Pre-styled components following Material Design 3
- Tailwind CSS - Utility-first styling with custom design tokens

**Database & ORM**:
- Neon Database (@neondatabase/serverless) - Serverless PostgreSQL with HTTP API
- Drizzle ORM - Type-safe database toolkit with PostgreSQL support
- Drizzle Kit - Schema management and migrations

**Form & Validation**:
- React Hook Form - Performant form state management
- Zod - TypeScript-first schema validation
- @hookform/resolvers - Integration between React Hook Form and Zod

**Data Fetching**:
- TanStack Query (React Query) - Server state management and caching

**Build Tools**:
- Vite - Frontend build tool and dev server
- TypeScript - Type safety across the stack
- esbuild - Server-side bundling for production

**Development**:
- Hot Module Replacement (HMR) via Vite
- Separate development and production entry points
- Path alias configuration (@/, @shared/, @assets/)

## Recent Changes (November 27, 2025)

1. **Production PostgreSQL Migration**: Migrated from in-memory storage to persistent PostgreSQL database with Neon serverless driver
2. **Advanced ML/NLP Integration**: Added comprehensive medical NLP services with entity extraction, symptom normalization, urgency detection
3. **Enhanced LLM Services**: Implemented drug alternatives, treatment planning, outcome prediction, and evidence-based guidelines
4. **New API Endpoints**: 10+ new endpoints for NLP and advanced LLM features
5. **Database Initialization**: Automatic seeding with default users and sample patients on first run

## Default Login Credentials

- **Admin**: username: `admin` / password: `paypass`
- **Doctor**: username: `doctor1` / password: `pass123`
- **Nurse**: username: `nurse1` / password: `nursepass`
- **Patient**: username: `patient` / password: `paypass`

## Deployment

- **Platform**: Render (configured in render.yaml)
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Environment**: NODE_ENV=production with DATABASE_URL from Neon
- **Data Persistence**: All data persists across deployments via PostgreSQL
