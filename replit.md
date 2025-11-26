# Digital Doctors Assistant

## Overview

Digital Doctors Assistant is a comprehensive healthcare management system designed for clinical environments. The application provides role-based access control for administrators, doctors, and nurses to manage patient records, vital signs, and biodata. Built with a modern tech stack, it emphasizes clinical clarity, data integrity, and efficient workflows for healthcare professionals.

The system supports complete patient lifecycle management including registration with biometric authentication (facial recognition and fingerprint), comprehensive biodata collection (demographics, medical history, allergies), and real-time vital signs tracking (blood pressure, temperature, heart rate, weight, respiratory rate, and oxygen saturation).

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
- In-memory storage implementation (MemStorage class) for development
- Database-ready architecture with Drizzle ORM schema definitions
- Session-based authentication (basic password comparison - noted for production upgrade to bcrypt)

**API Endpoints**:
- `/api/auth/login` - User authentication
- `/api/users` - User management (admin operations)
- `/api/patients` - Patient CRUD operations
- Patient-specific routes for individual record access and updates

**Authentication & Authorization**:
- Role-based access control (admin, doctor, nurse)
- User active/inactive status management
- Session persistence via localStorage (client-side)
- Protected route components enforcing role requirements

### Data Storage

**ORM**: Drizzle ORM
- PostgreSQL dialect configuration
- Schema-first approach with TypeScript type inference
- Zod schema integration for runtime validation

**Database Schema**:

*Users Table*:
- Role-based access (admin, doctor, nurse)
- Active/inactive status flags
- UUID primary keys with auto-generation

*Patients Table*:
- Medical Record Number (MRN) as unique identifier
- Comprehensive biodata: name, age, gender, contact information, NIN
- Medical information: blood group, genotype, allergies
- Vital signs: blood pressure (systolic/diastolic), temperature, heart rate, weight, respiratory rate, oxygen saturation
- Biometric storage: facial recognition data, fingerprint data
- Timestamps for record creation and updates

**Development Storage**: In-memory Map-based storage with seeded default users for development/testing

### External Dependencies

**UI Component Library**:
- Radix UI primitives (@radix-ui/react-*) - Accessible, unstyled component primitives
- shadcn/ui configuration - Pre-styled components following Material Design 3
- Tailwind CSS - Utility-first styling with custom design tokens

**Database & ORM**:
- Neon Database (@neondatabase/serverless) - Serverless PostgreSQL
- Drizzle ORM - Type-safe database toolkit
- Drizzle Kit - Migration and schema management
- connect-pg-simple - PostgreSQL session store

**Form & Validation**:
- React Hook Form - Performant form state management
- Zod - TypeScript-first schema validation
- @hookform/resolvers - Integration between React Hook Form and Zod

**Data Fetching**:
- TanStack Query (React Query) - Server state management and caching

**Utilities**:
- date-fns - Date manipulation and formatting
- clsx & class-variance-authority - Conditional CSS class composition
- cmdk - Command palette component
- Lucide React - Icon library

**Build Tools**:
- Vite - Frontend build tool and dev server
- TypeScript - Type safety across the stack
- PostCSS with Autoprefixer - CSS processing
- esbuild - Server-side bundling for production

**Replit Integration**:
- @replit/vite-plugin-runtime-error-modal - Development error overlay
- @replit/vite-plugin-cartographer - Development tooling
- @replit/vite-plugin-dev-banner - Development environment banner

**Development Features**:
- Hot Module Replacement (HMR) via Vite
- Separate development and production entry points
- Path alias configuration (@/, @shared/, @assets/)
- TypeScript strict mode enabled