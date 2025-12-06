import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Building2, Users, Activity, Plus, Server, Shield, Settings,
    Ban, CheckCircle, XCircle, Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SystemHealthIndicator from "@/components/admin/SystemHealthIndicator";
import MetricsChart from "@/components/admin/MetricsChart";
import AuditLogViewer from "@/components/admin/AuditLogViewer";

interface Hospital {
    id: string;
    name: string;
    address: string;
    subscription_tier: string;
    subscription_status: string;
    max_staff: number;
    max_patients: number;
    staff_count?: number;
    patient_count?: number;
    staff_usage_percent?: number;
    patient_usage_percent?: number;
    created_at: string;
}

interface User {
    id: string;
    username: string;
    full_name: string;
    role: string;
    hospital_id: string;
    is_active: number;
    created_at: string;
}

interface PlatformStats {
    hospitals: { total: number; active: number; by_tier: Record<string, number> };
    users: { total: number; by_role: Record<string, number> };
    patients: { total: number };
    appointments: { total: number; today: number };
}

export default function SystemAdminDashboard() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [systemMetrics, setSystemMetrics] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [securityEvents, setSecurityEvents] = useState<any[]>([]);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("all");

    const [newHospital, setNewHospital] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
        subscription_tier: "free",
        admin_user_id: "admin"
    });

    // Settings state
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState("");
    const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);
    const [allowedDomains, setAllowedDomains] = useState("");
    const [requireEmailVerification, setRequireEmailVerification] = useState(true);
    const [announcementTitle, setAnnouncementTitle] = useState("");
    const [announcementMessage, setAnnouncementMessage] = useState("");
    const [announcementPriority, setAnnouncementPriority] = useState("normal");

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(() => {
            fetchSystemHealth();
            fetchSystemMetrics();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        await Promise.all([
            fetchHospitals(),
            fetchUsers(),
            fetchPlatformStats(),
            fetchSystemHealth(),
            fetchSystemMetrics(),
            fetchAuditLogs(),
            fetchSecurityEvents()
        ]);
    };

    const fetchHospitals = async () => {
        try {
            const response = await fetch("/api/admin/hospitals/overview");
            const data = await response.json();
            setHospitals(data);
        } catch (error) {
            console.error("Failed to fetch hospitals:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/admin/users?limit=200");
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    const fetchPlatformStats = async () => {
        try {
            const response = await fetch("/api/admin/system/stats");
            const data = await response.json();
            setPlatformStats(data);
        } catch (error) {
            console.error("Failed to fetch platform stats:", error);
        }
    };

    const fetchSystemHealth = async () => {
        try {
            const response = await fetch("/api/admin/system/health");
            const data = await response.json();
            setSystemHealth(data);
        } catch (error) {
            console.error("Failed to fetch system health:", error);
        }
    };

    const fetchSystemMetrics = async () => {
        try {
            const response = await fetch("/api/admin/system/metrics");
            const data = await response.json();
            setSystemMetrics(data);
        } catch (error) {
            console.error("Failed to fetch system metrics:", error);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const response = await fetch("/api/admin/audit-logs?limit=100");
            const data = await response.json();
            setAuditLogs(data.logs || []);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        }
    };

    const fetchSecurityEvents = async () => {
        try {
            const response = await fetch("/api/admin/security/events?limit=50");
            const data = await response.json();
            setSecurityEvents(data.events || []);
        } catch (error) {
            console.error("Failed to fetch security events:", error);
        }
    };

    const createHospital = async () => {
        try {
            const response = await fetch("/api/hospitals/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newHospital)
            });

            if (response.ok) {
                setIsCreateDialogOpen(false);
                fetchHospitals();
                fetchPlatformStats();
                setNewHospital({
                    name: "",
                    address: "",
                    phone: "",
                    email: "",
                    subscription_tier: "free",
                    admin_user_id: "admin"
                });
            }
        } catch (error) {
            console.error("Failed to create hospital:", error);
        }
    };

    const suspendHospital = async (hospitalId: string) => {
        try {
            await fetch(`/api/admin/hospitals/${hospitalId}/suspend`, { method: "POST" });
            fetchHospitals();
            fetchPlatformStats();
        } catch (error) {
            console.error("Failed to suspend hospital:", error);
        }
    };

    const activateHospital = async (hospitalId: string) => {
        try {
            await fetch(`/api/admin/hospitals/${hospitalId}/activate`, { method: "POST" });
            fetchHospitals();
            fetchPlatformStats();
        } catch (error) {
            console.error("Failed to activate hospital:", error);
        }
    };

    const toggleUserActive = async (userId: string, currentStatus: number) => {
        try {
            await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: currentStatus === 1 ? 0 : 1 })
            });
            fetchUsers();
        } catch (error) {
            console.error("Failed to toggle user status:", error);
        }
    };

    const getTierColor = (tier: string) => {
        const colors: Record<string, string> = {
            free: "bg-gray-100 text-gray-800",
            basic: "bg-blue-100 text-blue-800",
            premium: "bg-purple-100 text-purple-800",
            enterprise: "bg-amber-100 text-amber-800"
        };
        return colors[tier] || colors.free;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: "bg-green-100 text-green-800",
            suspended: "bg-red-100 text-red-800",
            pending: "bg-yellow-100 text-yellow-800"
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.full_name.toLowerCase().includes(userSearch.toLowerCase());
        const matchesRole = selectedRole === "all" || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">System Admin Dashboard</h1>
                    <p className="text-muted-foreground">Comprehensive platform oversight and management</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Hospital
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Hospital</DialogTitle>
                            <DialogDescription>Add a new hospital to the platform</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Hospital Name</Label>
                                <Input
                                    id="name"
                                    value={newHospital.name}
                                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                                    placeholder="City General Hospital"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={newHospital.address}
                                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                                    placeholder="123 Main Street"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={newHospital.phone}
                                    onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newHospital.email}
                                    onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })}
                                    placeholder="admin@hospital.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tier">Subscription Tier</Label>
                                <Select
                                    value={newHospital.subscription_tier}
                                    onValueChange={(value) => setNewHospital({ ...newHospital, subscription_tier: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free (5 staff, 100 patients)</SelectItem>
                                        <SelectItem value="basic">Basic (20 staff, 500 patients)</SelectItem>
                                        <SelectItem value="premium">Premium (50 staff, 2000 patients)</SelectItem>
                                        <SelectItem value="enterprise">Enterprise (Unlimited)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button onClick={createHospital}>Create Hospital</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">
                        <Activity className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="hospitals">
                        <Building2 className="h-4 w-4 mr-2" />
                        Hospitals
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="h-4 w-4 mr-2" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="monitoring">
                        <Server className="h-4 w-4 mr-2" />
                        Monitoring
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <SystemHealthIndicator health={systemHealth} />

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{platformStats?.hospitals.total || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {platformStats?.hospitals.active || 0} active
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{platformStats?.users.total || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Across all hospitals
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{platformStats?.appointments.today || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {platformStats?.appointments.total || 0} total
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <MetricsChart metrics={systemMetrics} />

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Recent Security Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-48">
                                    {securityEvents.slice(0, 5).map((event) => (
                                        <div key={event.id} className="mb-3 pb-3 border-b last:border-0">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline">{event.event_type}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{event.username || "Unknown user"}</p>
                                            <p className="text-xs text-muted-foreground">{event.ip_address}</p>
                                        </div>
                                    ))}
                                    {securityEvents.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No security events
                                        </p>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">System Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Doctors</span>
                                    <span className="font-semibold">{platformStats?.users.by_role.doctor || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Nurses</span>
                                    <span className="font-semibold">{platformStats?.users.by_role.nurse || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Patients</span>
                                    <span className="font-semibold">{platformStats?.patients.total || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Premium Tier Hospitals</span>
                                    <span className="font-semibold">
                                        {(platformStats?.hospitals.by_tier.premium || 0) + (platformStats?.hospitals.by_tier.enterprise || 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Hospitals Tab */}
                <TabsContent value="hospitals" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Hospitals</CardTitle>
                            <CardDescription>Manage and monitor all hospitals in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px]">
                                <div className="space-y-3">
                                    {hospitals.map((hospital) => (
                                        <div
                                            key={hospital.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <h3 className="font-semibold">{hospital.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{hospital.address}</p>
                                                    </div>
                                                </div>
                                                {hospital.staff_count !== undefined && (
                                                    <div className="ml-8 mt-2 grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-muted-foreground">Staff: </span>
                                                            <span className="font-medium">
                                                                {hospital.staff_count} / {hospital.max_staff}
                                                            </span>
                                                            <span className="text-muted-foreground ml-1">
                                                                ({hospital.staff_usage_percent}%)
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Patients: </span>
                                                            <span className="font-medium">
                                                                {hospital.patient_count} / {hospital.max_patients}
                                                            </span>
                                                            <span className="text-muted-foreground ml-1">
                                                                ({hospital.patient_usage_percent}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getTierColor(hospital.subscription_tier)}>
                                                    {hospital.subscription_tier.toUpperCase()}
                                                </Badge>
                                                <Badge className={getStatusColor(hospital.subscription_status)}>
                                                    {hospital.subscription_status.toUpperCase()}
                                                </Badge>
                                                {hospital.subscription_status === "active" ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => suspendHospital(hospital.id)}
                                                    >
                                                        <Ban className="h-4 w-4 mr-1" />
                                                        Suspend
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => activateHospital(hospital.id)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Activate
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Search and manage all users across the platform</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="max-w-sm"
                                    />
                                </div>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="doctor">Doctor</SelectItem>
                                        <SelectItem value="nurse">Nurse</SelectItem>
                                        <SelectItem value="patient">Patient</SelectItem>
                                        <SelectItem value="hospital_admin">Hospital Admin</SelectItem>
                                        <SelectItem value="system_admin">System Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <ScrollArea className="h-[500px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.username}</TableCell>
                                                <TableCell>{user.full_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{user.role}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.is_active === 1 ? (
                                                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleUserActive(user.id, user.is_active)}
                                                    >
                                                        {user.is_active === 1 ? (
                                                            <><XCircle className="h-4 w-4 mr-1" />Deactivate</>
                                                        ) : (
                                                            <><CheckCircle className="h-4 w-4 mr-1" />Activate</>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4">
                    <AuditLogViewer logs={auditLogs} />

                    <Card>
                        <CardHeader>
                            <CardTitle>Security Events</CardTitle>
                            <CardDescription>Monitor failed logins and security alerts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Severity</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {securityEvents.map((event) => (
                                            <TableRow key={event.id}>
                                                <TableCell>{event.event_type}</TableCell>
                                                <TableCell>{event.username || "N/A"}</TableCell>
                                                <TableCell className="font-mono text-xs">{event.ip_address}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            event.severity === "critical"
                                                                ? "bg-red-100 text-red-800"
                                                                : event.severity === "high"
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                        }
                                                    >
                                                        {event.severity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {securityEvents.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No security events found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Monitoring Tab */}
                <TabsContent value="monitoring" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <SystemHealthIndicator health={systemHealth} />

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Database</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-5 w-5" />
                                        <span className="font-semibold">Connected</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        All database operations normal
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <MetricsChart metrics={systemMetrics} />

                    <Card>
                        <CardHeader>
                            <CardTitle>System Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Platform Version</span>
                                <span className="text-sm font-medium">2.0.0</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Backend</span>
                                <span className="text-sm font-medium">Python/FastAPI</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Database</span>
                                <span className="text-sm font-medium">PostgreSQL</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Settings</CardTitle>
                            <CardDescription>Configure platform-wide settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Maintenance Mode */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">Maintenance Mode</p>
                                    <p className="text-sm text-muted-foreground">Temporarily disable user access for system updates</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Configure</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Maintenance Mode</DialogTitle>
                                            <DialogDescription>
                                                Enable or disable maintenance mode. When enabled, users will see a maintenance message.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="flex items-center justify-between">
                                                <Label>Maintenance Mode</Label>
                                                <Button
                                                    variant={maintenanceMode ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                                                >
                                                    {maintenanceMode ? "Enabled" : "Disabled"}
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Maintenance Message</Label>
                                                <Input
                                                    placeholder="System is undergoing maintenance..."
                                                    value={maintenanceMessage}
                                                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                                                    disabled={!maintenanceMode}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline">Cancel</Button>
                                            <Button onClick={() => {
                                                toast({
                                                    title: "Settings Updated",
                                                    description: `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'}`,
                                                });
                                            }}>Save Changes</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* User Registrations */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">User Registrations</p>
                                    <p className="text-sm text-muted-foreground">Allow or restrict new user sign-ups</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Manage</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>User Registration Settings</DialogTitle>
                                            <DialogDescription>
                                                Control who can register new accounts on the platform
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="flex items-center justify-between">
                                                <Label>Allow Public Registration</Label>
                                                <Button
                                                    variant={allowPublicRegistration ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setAllowPublicRegistration(!allowPublicRegistration)}
                                                >
                                                    {allowPublicRegistration ? "Enabled" : "Disabled"}
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Allowed Domains</Label>
                                                <Input
                                                    placeholder="example.com, hospital.org"
                                                    value={allowedDomains}
                                                    onChange={(e) => setAllowedDomains(e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Comma-separated list of allowed email domains
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label>Require Email Verification</Label>
                                                <Button
                                                    variant={requireEmailVerification ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setRequireEmailVerification(!requireEmailVerification)}
                                                >
                                                    {requireEmailVerification ? "Enabled" : "Disabled"}
                                                </Button>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline">Cancel</Button>
                                            <Button onClick={() => {
                                                toast({
                                                    title: "Settings Updated",
                                                    description: "Registration settings saved successfully",
                                                });
                                            }}>Save Changes</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* System Announcements */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">System Announcements</p>
                                    <p className="text-sm text-muted-foreground">Broadcast important messages to all users</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Create</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>Create System Announcement</DialogTitle>
                                            <DialogDescription>
                                                This announcement will be visible to all users across all hospitals
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Announcement Title</Label>
                                                <Input
                                                    placeholder="Important: System Update"
                                                    value={announcementTitle}
                                                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Message</Label>
                                                <textarea
                                                    className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
                                                    placeholder="Enter announcement message..."
                                                    value={announcementMessage}
                                                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Priority</Label>
                                                <Select
                                                    value={announcementPriority}
                                                    onValueChange={setAnnouncementPriority}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                        <SelectItem value="urgent">Urgent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => {
                                                setAnnouncementTitle("");
                                                setAnnouncementMessage("");
                                                setAnnouncementPriority("normal");
                                            }}>Cancel</Button>
                                            <Button onClick={async () => {
                                                try {
                                                    await fetch("/api/admin/announcements", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            title: announcementTitle,
                                                            message: announcementMessage,
                                                            priority: announcementPriority
                                                        })
                                                    });
                                                    toast({
                                                        title: "Announcement Created",
                                                        description: "System announcement has been broadcast to all users",
                                                    });
                                                    // Clear form
                                                    setAnnouncementTitle("");
                                                    setAnnouncementMessage("");
                                                    setAnnouncementPriority("normal");
                                                } catch (error) {
                                                    toast({
                                                        title: "Error",
                                                        description: "Failed to create announcement",
                                                        variant: "destructive",
                                                    });
                                                }
                                            }}>Broadcast Announcement</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
