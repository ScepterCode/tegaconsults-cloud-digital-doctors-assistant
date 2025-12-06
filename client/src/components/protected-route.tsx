import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { getRoleBasedDashboard } from "@/lib/navigation";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log("ProtectedRoute check:", { isAuthenticated, userRole: user?.role, requiredRoles });

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to /");
      setLocation("/");
      return;
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      const correctDashboard = getRoleBasedDashboard(user.role);
      console.log(`Role ${user.role} not in required roles ${requiredRoles.join(", ")}, redirecting to ${correctDashboard}`);
      setLocation(correctDashboard);
    } else {
      console.log("Access granted!");
    }
  }, [isAuthenticated, user, requiredRoles, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
