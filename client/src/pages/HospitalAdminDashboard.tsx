import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, Edit, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
    id: string;
    username: string;
    full_name: string;
    role: string;
    hospital_id: string;
    department_id: string | null;
    is_active: number;
}

interface HospitalAdminDashboardProps {
    hospitalId: string;
    hospitalName: string;
}

export default function HospitalAdminDashboard({ hospitalId, hospitalName }: HospitalAdminDashboardProps) {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({
        username: "",
        password: "",
        full_name: "",
        role: "doctor",
        hospital_id: hospitalId,
        department_id: null
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchStaff();
    }, [hospitalId]);

    const fetchStaff = async () => {
        try {
            const response = await fetch(`/api/staff/hospital/${hospitalId}`);
            const data = await response.json();
            setStaff(data);
        } catch (error) {
            console.error("Failed to fetch staff:", error);
            toast({
                title: "Error",
                description: "Failed to load staff members",
                variant: "destructive"
            });
        }
    };

    const addStaffMember = async () => {
        try {
            const response = await fetch("/api/staff/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStaff)
            });

            if (response.ok) {
                setIsAddDialogOpen(false);
                fetchStaff();
                setNewStaff({
                    username: "",
                    password: "",
                    full_name: "",
                    role: "doctor",
                    hospital_id: hospitalId,
                    department_id: null
                });
                toast({
                    title: "Success",
                    description: "Staff member added successfully"
                });
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to add staff member",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Failed to add staff:", error);
            toast({
                title: "Error",
                description: "Failed to add staff member",
                variant: "destructive"
            });
        }
    };

    const removeStaffMember = async (staffId: string) => {
        if (!confirm("Are you sure you want to remove this staff member?")) return;

        try {
            const response = await fetch(`/api/staff/${staffId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                fetchStaff();
                toast({
                    title: "Success",
                    description: "Staff member removed successfully"
                });
            }
        } catch (error) {
            console.error("Failed to remove staff:", error);
            toast({
                title: "Error",
                description: "Failed to remove staff member",
                variant: "destructive"
            });
        }
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            doctor: "bg-blue-100 text-blue-800",
            nurse: "bg-green-100 text-green-800",
            pharmacist: "bg-purple-100 text-purple-800",
            lab_tech: "bg-yellow-100 text-yellow-800",
            receptionist: "bg-pink-100 text-pink-800"
        };
        return colors[role] || "bg-gray-100 text-gray-800";
    };

    const staffByRole = staff.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Hospital Admin Dashboard</h1>
                    <p className="text-muted-foreground">{hospitalName} - Staff Management</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Staff Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>Add a new staff member to your hospital</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    value={newStaff.full_name}
                                    onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                                    placeholder="Dr. John Smith"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={newStaff.username}
                                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                    placeholder="dr.smith"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={newStaff.role}
                                    onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="doctor">Doctor</SelectItem>
                                        <SelectItem value="nurse">Nurse</SelectItem>
                                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                        <SelectItem value="lab_tech">Lab Technician</SelectItem>
                                        <SelectItem value="receptionist">Receptionist</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button onClick={addStaffMember}>Add Staff Member</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Staff Overview Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{staff.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{staffByRole.doctor || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nurses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{staffByRole.nurse || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pharmacists</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{staffByRole.pharmacist || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lab Techs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{staffByRole.lab_tech || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Staff Members</CardTitle>
                    <CardDescription>Manage your hospital's staff members and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.full_name}</TableCell>
                                    <TableCell>{member.username}</TableCell>
                                    <TableCell>
                                        <Badge className={getRoleBadgeColor(member.role)}>
                                            {member.role.replace("_", " ").toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.is_active ? "default" : "secondary"}>
                                            {member.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeStaffMember(member.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {staff.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No staff members found. Add your first staff member to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
