import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Settings, 
  LogOut,
  UserCog,
  Calendar,
  CreditCard,
  Building2,
  Bell,
  Ticket,
  UserCheck,
  Brain,
  Bot,
  BookOpen,
  Package
} from "lucide-react";
import logoUrl from "@assets/DDA LOGO 2_1764200378521.jpeg";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: "System Admin",
      url: "/system-admin",
      icon: Building2,
      roles: ["system_admin"],
    },
    {
      title: "Hospital Admin",
      url: "/hospital-admin",
      icon: Building2,
      roles: ["hospital_admin"],
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "doctor", "nurse", "patient"],
    },
    {
      title: "Health Chatbot",
      url: "/health-chatbot",
      icon: Bot,
      roles: ["system_admin", "hospital_admin", "admin", "doctor", "nurse", "patient", "pharmacist", "lab_tech", "receptionist"],
    },
    {
      title: "Personal Diary",
      url: "/personal-diary",
      icon: BookOpen,
      roles: ["system_admin", "hospital_admin", "admin", "doctor", "nurse", "patient", "pharmacist", "lab_tech", "receptionist"],
    },
    {
      title: "Tickets",
      url: "/tickets",
      icon: Ticket,
      roles: ["system_admin", "hospital_admin", "admin", "doctor", "nurse"],
    },
    {
      title: "Subscriptions",
      url: "/system-subscriptions",
      icon: CreditCard,
      roles: ["system_admin"],
    },
    {
      title: "Patient Assignments",
      url: "/patient-assignments",
      icon: UserCheck,
      roles: ["hospital_admin"],
    },
    {
      title: "Departments & Teams",
      url: "/departments-teams",
      icon: Building2,
      roles: ["system_admin", "hospital_admin"],
    },
    {
      title: "AI Clinical Assistant",
      url: "/patients",
      icon: Brain,
      roles: ["doctor"],
    },
    {
      title: "Patients",
      url: "/patients",
      icon: Users,
      roles: ["admin", "doctor", "nurse"],
    },
    {
      title: "Add Patient",
      url: "/patients/new",
      icon: UserPlus,
      roles: ["admin", "doctor", "nurse"],
    },
    {
      title: "My Appointments",
      url: "/appointments",
      icon: Calendar,
      roles: ["patient", "admin"],
    },
    {
      title: "Appointments",
      url: "/doctor/appointments",
      icon: Calendar,
      roles: ["doctor", "admin"],
    },
    {
      title: "User Management",
      url: "/users",
      icon: UserCog,
      roles: ["admin"],
    },
    {
      title: "Subscription & Billing",
      url: "/subscription",
      icon: CreditCard,
      roles: ["hospital_admin"],
    },
    {
      title: "Pharmacy Inventory",
      url: "/pharmacy-inventory",
      icon: Package,
      roles: ["pharmacist", "hospital_admin"],
    },
    {
      title: "Billing & Payments",
      url: "/billing",
      icon: CreditCard,
      roles: ["accountant", "accounts_manager", "hospital_admin"],
    },
    {
      title: "Department Dashboard",
      url: "/department/dashboard",
      icon: Building2,
      roles: ["doctor", "nurse"],
    },
    {
      title: "Department Management",
      url: "/admin/departments",
      icon: Building2,
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || "")
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "system_admin":
        return "bg-purple-600 text-white";
      case "hospital_admin":
        return "bg-blue-600 text-white";
      case "admin":
        return "bg-destructive text-destructive-foreground";
      case "doctor":
        return "bg-primary text-primary-foreground";
      case "nurse":
        return "bg-success text-success-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="DDA Logo" className="h-10 w-10 object-contain" data-testid="img-sidebar-logo" />
          <div>
            <h2 className="text-lg font-semibold">DDA</h2>
            <p className="text-xs text-muted-foreground">Doctors Assistant</p>
          </div>
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.fullName ? getInitials(user.fullName) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {user?.fullName}
              </p>
              <Badge 
                className={`${getRoleBadgeColor(user?.role || "")} text-xs`}
                data-testid="badge-user-role"
              >
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
