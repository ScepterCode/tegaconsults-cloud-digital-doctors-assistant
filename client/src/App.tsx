import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Footer } from "@/components/footer";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { ChatBot } from "@/components/chatbot";
import { getRoleBasedDashboard } from "@/lib/navigation";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import NewPatient from "@/pages/new-patient";
import PatientDetail from "@/pages/patient-detail";
import Users from "@/pages/users";
import PatientAppointments from "@/pages/patient-appointments";
import DoctorAppointments from "@/pages/doctor-appointments";
import Billing from "@/pages/billing";
import DepartmentDashboard from "@/pages/department-dashboard";
import AdminDepartments from "@/pages/admin-departments";
import SystemAdminDashboard from "@/pages/SystemAdminDashboard";
import HospitalAdminDashboard from "@/pages/HospitalAdminDashboard";
import TelemedicineConsultation from "@/pages/TelemedicineConsultation";
import Tickets from "@/pages/tickets";
import PatientAssignments from "@/pages/patient-assignments";
import DepartmentTeamManagement from "@/pages/department-team-management";
import AIClinicalAssistant from "@/pages/ai-clinical-assistant";
import HealthChatbot from "@/pages/health-chatbot";
import PersonalDiary from "@/pages/personal-diary";
import PatientMedicalHistory from "@/pages/patient-medical-history";
import PatientTimeline from "@/pages/patient-timeline";
import PharmacistPrescriptions from "@/pages/pharmacist-prescriptions";
import HospitalSubscription from "@/pages/hospital-subscription";
import SystemAdminSubscriptions from "@/pages/system-admin-subscriptions";
import PharmacyInventory from "@/pages/pharmacy-inventory";
import BillingDashboard from "@/pages/billing-dashboard";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <Switch>
            <Route path="/" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </div>
        <Footer />
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full flex-col">
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center gap-4 border-b p-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h2 className="text-lg font-semibold">Digital Doctors Assistant</h2>
            </header>
            <main className="flex-1 overflow-auto p-6 bg-background">
              <Switch>
                <Route path="/dashboard">
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </Route>
                <Route path="/health-chatbot">
                  <ProtectedRoute>
                    <HealthChatbot />
                  </ProtectedRoute>
                </Route>
                <Route path="/personal-diary">
                  <ProtectedRoute>
                    <PersonalDiary />
                  </ProtectedRoute>
                </Route>
                <Route path="/patients">
                  <ProtectedRoute requiredRoles={["doctor", "admin"]}>
                    <Patients />
                  </ProtectedRoute>
                </Route>
                <Route path="/patients/new">
                  <ProtectedRoute requiredRoles={["doctor", "admin"]}>
                    <NewPatient />
                  </ProtectedRoute>
                </Route>
                <Route path="/patients/:id">
                  <ProtectedRoute>
                    <PatientDetail />
                  </ProtectedRoute>
                </Route>
                <Route path="/users">
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <Users />
                  </ProtectedRoute>
                </Route>
                <Route path="/appointments">
                  <ProtectedRoute requiredRoles={["patient", "admin"]}>
                    <PatientAppointments />
                  </ProtectedRoute>
                </Route>
                <Route path="/doctor/appointments">
                  <ProtectedRoute requiredRoles={["doctor", "admin"]}>
                    <DoctorAppointments />
                  </ProtectedRoute>
                </Route>
                <Route path="/old-subscription-billing">
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                </Route>
                <Route path="/department/dashboard">
                  <ProtectedRoute requiredRoles={["doctor", "nurse"]}>
                    <DepartmentDashboard />
                  </ProtectedRoute>
                </Route>
                <Route path="/admin/departments">
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <AdminDepartments />
                  </ProtectedRoute>
                </Route>
                <Route path="/system-admin">
                  <ProtectedRoute requiredRoles={["system_admin"]}>
                    <SystemAdminDashboard />
                  </ProtectedRoute>
                </Route>
                <Route path="/hospital-admin">
                  <ProtectedRoute requiredRoles={["hospital_admin", "system_admin"]}>
                    <HospitalAdminDashboard hospitalId="5f98058e-9bd6-4c92-9f8f-13b58b4c36f9" hospitalName="Test Hospital" />
                  </ProtectedRoute>
                </Route>
                <Route path="/tickets">
                  <ProtectedRoute>
                    <Tickets />
                  </ProtectedRoute>
                </Route>
                <Route path="/patient-assignments">
                  <ProtectedRoute requiredRoles={["hospital_admin", "system_admin"]}>
                    <PatientAssignments />
                  </ProtectedRoute>
                </Route>
                <Route path="/departments-teams">
                  <ProtectedRoute requiredRoles={["hospital_admin", "system_admin"]}>
                    <DepartmentTeamManagement />
                  </ProtectedRoute>
                </Route>
                <Route path="/ai-clinical/:patientId">
                  <ProtectedRoute requiredRoles={["doctor"]}>
                    <AIClinicalAssistant />
                  </ProtectedRoute>
                </Route>
                <Route path="/telemedicine/:sessionId">
                  <ProtectedRoute requiredRoles={["doctor", "patient", "system_admin"]}>
                    <TelemedicineConsultation />
                  </ProtectedRoute>
                </Route>
                <Route path="/medical-history">
                  <ProtectedRoute requiredRoles={["doctor", "nurse", "lab_tech", "pharmacist", "admin", "system_admin"]}>
                    <PatientMedicalHistory />
                  </ProtectedRoute>
                </Route>
                <Route path="/patient-timeline/:patientId">
                  <ProtectedRoute requiredRoles={["doctor", "nurse", "hospital_admin", "system_admin"]}>
                    <PatientTimeline />
                  </ProtectedRoute>
                </Route>
                <Route path="/prescriptions">
                  <ProtectedRoute requiredRoles={["pharmacist", "doctor", "admin", "system_admin"]}>
                    <PharmacistPrescriptions />
                  </ProtectedRoute>
                </Route>
                <Route path="/subscription">
                  <ProtectedRoute requiredRoles={["hospital_admin", "system_admin"]}>
                    <HospitalSubscription />
                  </ProtectedRoute>
                </Route>
                <Route path="/system-subscriptions">
                  <ProtectedRoute requiredRoles={["system_admin"]}>
                    <SystemAdminSubscriptions />
                  </ProtectedRoute>
                </Route>
                <Route path="/pharmacy-inventory">
                  <ProtectedRoute requiredRoles={["pharmacist", "hospital_admin", "system_admin"]}>
                    <PharmacyInventory />
                  </ProtectedRoute>
                </Route>
                <Route path="/billing">
                  <ProtectedRoute requiredRoles={["accountant", "accounts_manager", "hospital_admin", "system_admin"]}>
                    <BillingDashboard />
                  </ProtectedRoute>
                </Route>
                <Route path="/">
                  {() => {
                    if (user) {
                      const dashboardRoute = getRoleBasedDashboard(user.role);
                      return <Redirect to={dashboardRoute} />;
                    }
                    return <Redirect to="/dashboard" />;
                  }}
                </Route>
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
        <ChatBot />
        <Footer />
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
