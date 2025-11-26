# Digital Doctors Assistant - Design Guidelines

## Design Approach

**Selected System**: Material Design 3 with Medical/Clinical Adaptations

**Justification**: Healthcare applications demand clarity, consistency, and error prevention. Material Design provides robust patterns for data-heavy interfaces, form validation, and role-based dashboards while maintaining professional aesthetics suitable for medical environments.

**Key Principles**:
- Clinical Clarity: Clear information hierarchy, zero ambiguity in medical data
- Efficiency First: Minimize clicks for common workflows (patient lookup, vital entry)
- Role-Based UI: Visual differentiation between Admin/Doctor/Nurse interfaces
- Data Integrity: Strong validation feedback and confirmation patterns

---

## Typography

**Font Family**: 
- Primary: Inter or Roboto via Google Fonts CDN
- Monospace: Roboto Mono for medical record numbers, NIN, vitals

**Hierarchy**:
- H1 (Dashboard Titles): 2.5rem, font-weight 600
- H2 (Section Headers): 1.75rem, font-weight 600
- H3 (Card Titles): 1.25rem, font-weight 500
- Body (Patient Data): 1rem, font-weight 400
- Small (Labels/Metadata): 0.875rem, font-weight 500
- Vitals Display: 1.5rem, font-weight 600, monospace

---

## Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, and 8 as base increments
- Tight spacing: p-2, gap-2 (within cards)
- Standard spacing: p-4, gap-4 (between elements)
- Section spacing: p-6 to p-8 (card padding, form groups)
- Page margins: p-8 on desktop, p-4 on mobile

**Grid System**:
- Dashboard: Sidebar (w-64 fixed) + Main content area
- Patient Cards: 3-column grid on desktop (grid-cols-3), 1-column mobile
- Forms: 2-column layout for biodata fields (grid-cols-2), full-width for vitals
- Tables: Full-width with fixed column widths for consistent scanning

---

## Component Library

### Authentication & Biometric Interface

**Login Screen**:
- Centered card (max-w-md) with hospital branding at top
- Role selector (Admin/Doctor/Nurse) as segmented buttons
- Username/password fields with clear labels
- Biometric option toggle (fingerprint icon) below credentials
- Large "Sign In" button (w-full, h-12)

**Biometric Capture Modal**:
- Full-screen overlay with semi-transparent backdrop
- Centered capture area (max-w-2xl)
- Facial Recognition: Live camera feed preview (aspect-video, rounded-lg)
- Fingerprint: Animated scanner graphic with pulse effect
- Status indicator (Scanning/Verified/Failed) with icon
- Cancel/Retry buttons at bottom

### Navigation

**Sidebar Navigation** (All Roles):
- Fixed left sidebar (w-64, h-screen)
- Hospital logo/name at top (p-6)
- Navigation items with icons (Heroicons): Dashboard, Patients, Add Patient, Reports
- Active state: filled background panel
- User profile section at bottom with role badge and logout
- Admin-only items: User Management, System Settings

**Top Bar**:
- Fixed top bar (h-16) with search functionality
- Global patient search (w-96 on desktop)
- Quick actions: Add Patient button (prominent, always visible)
- Notifications bell icon
- User avatar with role indicator

### Dashboard Layouts

**Admin Dashboard**:
- Stats cards row (grid-cols-4): Total Patients, Active Doctors, Active Nurses, Today's Registrations
- Two-column layout: Recent Activity (left 2/3) + Quick Actions (right 1/3)
- User management table with activate/deactivate toggles
- System health indicators

**Doctor Dashboard**:
- Patient search bar (prominent, w-full, mb-6)
- Recent patients grid (grid-cols-3)
- Quick stats: Patients Seen Today, Critical Vitals Alerts
- Add Patient button (floating action button, bottom-right)

**Nurse Dashboard**:
- Similar to Doctor but vitals-focused
- Read-only patient cards with vital signs prominently displayed
- Limited edit access indicators (grayed-out edit buttons with tooltip)

### Patient Management

**Patient Card** (List View):
- Card container (rounded-lg, shadow-md, p-6)
- Header row: Patient name (text-xl, font-semibold) + MRN (monospace, text-gray-600)
- Photo thumbnail (rounded-full, w-16 h-16) on left
- Quick vitals grid (grid-cols-4): BP, Temp, Blood Group, Genotype
- Action buttons row: View Full Record, Edit (role-dependent), Biometric Info
- Status indicator: Last Updated timestamp

**Patient Registration Form**:
- Multi-step wizard or single scrollable form
- Section 1 - Biodata: Name, Age, Gender, Contact (2-column grid)
- Section 2 - Identification: NIN input (large, monospace), Biometric capture buttons
- Section 3 - Medical Info: Blood Group, Genotype, Allergies (2-column)
- Section 4 - Vitals: BP (systolic/diastolic split), Temperature, Heart Rate, Weight (grid-cols-2)
- Each section with clear heading (text-lg, font-semibold, mb-4)
- Large "Register Patient" button at bottom (w-full md:w-auto, px-12, py-3)

**Patient Detail View**:
- Full-width header with patient photo (w-24 h-24), name, and key identifiers
- Tabbed interface: Overview, Medical History, Vitals Timeline, Documents
- Overview tab: 2-column layout (Biodata left, Current Vitals right)
- Vitals displayed as cards with visual indicators (normal ranges)
- Edit button (top-right, role-based visibility)

### Data Display

**Vitals Cards**:
- Individual card per vital (rounded-lg, p-4)
- Large numeric display (text-3xl, font-bold, monospace)
- Unit label (text-sm, text-gray-600)
- Timestamp (text-xs, at bottom)
- Visual indicator bar or icon based on normal ranges

**Patient Table** (Admin/Doctor):
- Sticky header row
- Columns: Photo, Name, MRN, Age/Gender, Blood Group, Last Visit, Actions
- Row hover state with subtle elevation
- Inline action buttons (View, Edit, Delete for admin)
- Pagination controls at bottom

### Forms & Inputs

**Input Fields**:
- Label above input (text-sm, font-medium, mb-2)
- Input with border (rounded-md, h-11, px-4)
- Focus state with ring outline
- Error state with validation message below
- Required field indicator (asterisk)

**Biometric Input Group**:
- Button to trigger capture (w-full, flex items-center justify-between)
- Icon on left, "Capture" text, status checkmark on right
- Preview thumbnail after capture
- Retake option

**Dropdown/Select**:
- Role selector, blood group, genotype as custom styled selects
- Clear visual distinction between options

### Admin Controls

**User Management Table**:
- Columns: Name, Role (badge), Status (Active/Inactive toggle), Last Login, Actions
- Toggle switch (large, easy to click) for activate/deactivate
- Confirmation modal for deactivation
- Add Doctor/Nurse buttons at top

**Status Toggles**:
- Material Design switch component
- Clear on/off states with labels
- Disabled state for inactive users

### Modals & Overlays

**Confirmation Dialogs**:
- Centered modal (max-w-md)
- Warning icon for destructive actions
- Clear description of action consequence
- Two-button layout: Cancel (outlined), Confirm (solid)

**Biometric Verification Modal**:
- Full screen on mobile, centered (max-w-3xl) on desktop
- Live capture area with guides/alignment helpers
- Progress indicator during processing
- Success animation on verification

---

## Accessibility

- WCAG AA contrast ratios for all text
- Keyboard navigation for all interactive elements
- Screen reader labels for icons and status indicators
- Focus indicators on all form inputs
- Error messages associated with inputs (aria-describedby)
- Role-based content announced to screen readers

---

## Responsive Behavior

**Desktop (lg+)**: Full sidebar + multi-column layouts
**Tablet (md)**: Collapsible sidebar, 2-column grids
**Mobile**: Hidden sidebar (hamburger menu), single-column stacking, bottom navigation for critical actions

---

## Animation

Use sparingly:
- Page transitions: Subtle fade (200ms)
- Biometric scan: Pulse/scanning animation only
- Toggle switches: Smooth state change
- Modal appearance: Scale + fade (250ms)
- No animations on data updates or table rows