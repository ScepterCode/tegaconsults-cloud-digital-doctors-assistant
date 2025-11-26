import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Activity, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Patient, User } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: patients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin",
  });

  const stats = [
    {
      title: "Total Patients",
      value: patients?.length || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Doctors",
      value: users?.filter(u => u.role === "doctor" && u.isActive).length || 0,
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
      adminOnly: true,
    },
    {
      title: "Active Nurses",
      value: users?.filter(u => u.role === "nurse" && u.isActive).length || 0,
      icon: Activity,
      color: "text-warning",
      bgColor: "bg-warning/10",
      adminOnly: true,
    },
    {
      title: "Today's Registrations",
      value: patients?.filter(p => {
        const today = new Date().toDateString();
        return new Date(p.createdAt!).toDateString() === today;
      }).length || 0,
      icon: Calendar,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  const filteredStats = stats.filter(stat => 
    !stat.adminOnly || user?.role === "admin"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
          Welcome, {user?.fullName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.role === "admin" && "Complete system overview and management"}
          {user?.role === "doctor" && "Access and manage patient records"}
          {user?.role === "nurse" && "View patient information and vitals"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {filteredStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-md ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {patientsLoading || (stat.adminOnly && usersLoading) ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : patients && patients.length > 0 ? (
              <div className="space-y-3">
                {patients.slice(0, 5).map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover-elevate active-elevate-2"
                    data-testid={`patient-item-${patient.id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        MRN: {patient.mrn}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" data-testid={`text-blood-group-${patient.id}`}>{patient.bloodGroup}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-genotype-${patient.id}`}>{patient.genotype}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No patients registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {user?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Users</span>
                    <span className="text-2xl font-bold" data-testid="stat-active-users">
                      {users?.filter(u => u.isActive).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inactive Users</span>
                    <span className="text-2xl font-bold" data-testid="stat-inactive-users">
                      {users?.filter(u => !u.isActive).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Records</span>
                    <span className="text-2xl font-bold" data-testid="stat-total-records">
                      {patients?.length || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {user?.role !== "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/patients/new" className="block" data-testid="link-register-new-patient">
                <Card className="hover-elevate active-elevate-2 cursor-pointer">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Register New Patient</p>
                      <p className="text-xs text-muted-foreground">Add patient records</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
              <a href="/patients" className="block" data-testid="link-view-all-patients">
                <Card className="hover-elevate active-elevate-2 cursor-pointer">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-10 w-10 rounded-md bg-success/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">View All Patients</p>
                      <p className="text-xs text-muted-foreground">Browse patient list</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
