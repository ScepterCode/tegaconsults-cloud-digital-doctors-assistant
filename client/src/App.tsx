import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import NewPatient from "@/pages/new-patient";
import PatientDetail from "@/pages/patient-detail";
import Users from "@/pages/users";
import PatientAppointments from "@/pages/patient-appointments";
import DoctorAppointments from "@/pages/doctor-appointments";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
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
              <Route path="/patients">
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              </Route>
              <Route path="/patients/new">
                <ProtectedRoute>
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
                <ProtectedRoute requiredRoles={["patient"]}>
                  <PatientAppointments />
                </ProtectedRoute>
              </Route>
              <Route path="/doctor/appointments">
                <ProtectedRoute requiredRoles={["doctor"]}>
                  <DoctorAppointments />
                </ProtectedRoute>
              </Route>
              <Route path="/">
                <Redirect to="/dashboard" />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
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
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
