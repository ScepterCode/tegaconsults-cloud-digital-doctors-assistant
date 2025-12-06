// Role-based navigation helper
export function getRoleBasedDashboard(role: string): string {
    const roleRoutes: Record<string, string> = {
        system_admin: "/system-admin",
        hospital_admin: "/hospital-admin",
        doctor: "/dashboard",
        nurse: "/dashboard",
        patient: "/dashboard",
        pharmacist: "/dashboard",
        lab_tech: "/dashboard",
        receptionist: "/dashboard",
    };

    return roleRoutes[role] || "/dashboard";
}

// Role-based navigation configuration
export const ROLE_NAVIGATION = {
    system_admin: [
        { path: "/system-admin", label: "All Hospitals", icon: "Building2" },
        { path: "/system-subscriptions", label: "Subscriptions", icon: "CreditCard" },
        { path: "/settings", label: "System Settings", icon: "Settings" },
    ],
    hospital_admin: [
        { path: "/hospital-admin", label: "Dashboard", icon: "LayoutDashboard" },
        { path: "/staff", label: "Staff Management", icon: "Users" },
        { path: "/departments", label: "Departments", icon: "Building" },
        { path: "/subscription", label: "Subscription & Billing", icon: "CreditCard" },
        { path: "/integrations", label: "Integrations", icon: "Plug" },
    ],
    doctor: [
        { path: "/patients", label: "Patients", icon: "Users" },
        { path: "/appointments", label: "Appointments", icon: "Calendar" },
        { path: "/medical-history", label: "Medical History", icon: "FileText" },
        { path: "/prescriptions", label: "Prescriptions", icon: "Pill" },
        { path: "/telemedicine", label: "Telemedicine", icon: "Video" },
        { path: "/lab-results", label: "Lab Results", icon: "FlaskConical" },
        { path: "/chatbot", label: "AI Assistant", icon: "Bot" },
    ],
    nurse: [
        { path: "/patients", label: "Patients", icon: "Users" },
        { path: "/medical-history", label: "Medical History", icon: "FileText" },
        { path: "/vitals", label: "Vitals", icon: "Activity" },
        { path: "/appointments", label: "Appointments", icon: "Calendar" },
    ],
    pharmacist: [
        { path: "/prescriptions", label: "Prescriptions", icon: "Pill" },
        { path: "/inventory", label: "Inventory", icon: "Package" },
    ],
    lab_tech: [
        { path: "/lab-orders", label: "Lab Orders", icon: "FlaskConical" },
        { path: "/medical-history", label: "Upload Results", icon: "Upload" },
    ],
    receptionist: [
        { path: "/register-patient", label: "Register Patient", icon: "UserPlus" },
        { path: "/appointments", label: "Schedule Appointment", icon: "CalendarPlus" },
    ],
    patient: [
        { path: "/my-records", label: "My Records", icon: "FileText" },
        { path: "/book-appointment", label: "Book Appointment", icon: "Calendar" },
        { path: "/telemedicine", label: "Telemedicine", icon: "Video" },
        { path: "/prescriptions", label: "My Prescriptions", icon: "Pill" },
    ],
};

export function getNavigationForRole(role: string) {
    return ROLE_NAVIGATION[role as keyof typeof ROLE_NAVIGATION] || [];
}

export function canAccessRoute(userRole: string, path: string): boolean {
    const navigation = getNavigationForRole(userRole);
    return navigation.some(item => path.startsWith(item.path));
}
