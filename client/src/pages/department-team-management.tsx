import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building, Users, UserPlus, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DepartmentTeamManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Departments
  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/department-management");
      return res.json();
    }
  });

  const { data: deptStatsData } = useQuery({
    queryKey: ["department-stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/department-management/stats/overview");
      return res.json();
    }
  });

  // Teams
  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/team-management");
      return res.json();
    }
  });

  const { data: teamStatsData } = useQuery({
    queryKey: ["team-stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/team-management/stats/overview");
      return res.json();
    }
  });

  // Users for assignment - get staff from the hospital
  const hospitalId = "5f98058e-9bd6-4c92-9f8f-13b58b4c36f9";
  const { data: usersData } = useQuery({
    queryKey: ["users", hospitalId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/staff/hospital/${hospitalId}`);
      return res.json();
    }
  });

  const createDeptMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/department-management?admin_id=${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department-stats"] });
      toast({ title: "Department created successfully" });
      setShowDeptDialog(false);
    }
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/team-management?admin_id=${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team-stats"] });
      toast({ title: "Team created successfully" });
      setShowTeamDialog(false);
    }
  });

  // Assign staff to department
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignToDeptId, setAssignToDeptId] = useState<string | null>(null);
  
  const assignStaffMutation = useMutation({
    mutationFn: async (data: { user_id: string; department_id: string }) => {
      const res = await apiRequest("POST", `/api/department-management/assign-staff?admin_id=${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department-stats"] });
      queryClient.invalidateQueries({ queryKey: ["users", hospitalId] });
      toast({ title: "Staff assigned successfully" });
      setShowAssignDialog(false);
      setAssignToDeptId(null);
    }
  });

  const handleCreateDept = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createDeptMutation.mutate({
      name: formData.get("name"),
      description: formData.get("description"),
      head_staff_id: formData.get("head_staff_id") || null,
      hospital_id: hospitalId
    });
  };

  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTeamMutation.mutate({
      name: formData.get("name"),
      description: formData.get("description"),
      team_type: formData.get("team_type"),
      department_id: formData.get("department_id") || null,
      team_lead_id: formData.get("team_lead_id") || null
    });
  };

  const departments = deptsData?.departments || [];
  const teams = teamsData?.teams || [];
  const users = usersData || []; // API returns array directly, not {users: []}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Department & Team Management</h1>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deptStatsData?.total_departments || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{deptStatsData?.active_departments || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Department</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDept} className="space-y-4">
                      <div>
                        <Label>Department Name</Label>
                        <Input name="name" required placeholder="e.g., Pediatrics" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea name="description" rows={3} placeholder="Department description..." />
                      </div>
                      <div>
                        <Label>Department Head</Label>
                        <Select name="head_staff_id">
                          <SelectTrigger>
                            <SelectValue placeholder="Select head of department" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter((u: any) => u.role === "doctor").map((u: any) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowDeptDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createDeptMutation.isPending}>
                          {createDeptMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departments.map((dept: any) => (
                  <Card key={dept.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{dept.name}</h3>
                            <Badge variant={dept.status === "active" ? "default" : "secondary"}>
                              {dept.status}
                            </Badge>
                          </div>
                          {dept.description && (
                            <p className="text-sm text-muted-foreground mb-2">{dept.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {dept.headStaff && (
                              <span>Head: {dept.headStaff.name}</span>
                            )}
                            <span>{dept.staffCount} staff members</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssignToDeptId(dept.id);
                            setShowAssignDialog(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Staff
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {departments.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No departments created yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamStatsData?.total_teams || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{teamStatsData?.active_teams || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Team</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeam} className="space-y-4">
                      <div>
                        <Label>Team Name</Label>
                        <Input name="name" required placeholder="e.g., Pediatrics Emergency Team" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea name="description" rows={3} placeholder="Team description..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Team Type</Label>
                          <Select name="team_type" required>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clinical">Clinical</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="surgical">Surgical</SelectItem>
                              <SelectItem value="pediatric">Pediatric</SelectItem>
                              <SelectItem value="icu">ICU</SelectItem>
                              <SelectItem value="maternity">Maternity</SelectItem>
                              <SelectItem value="oncology">Oncology</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Department</Label>
                          <Select name="department_id">
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Team Lead</Label>
                        <Select name="team_lead_id">
                          <SelectTrigger>
                            <SelectValue placeholder="Select team lead" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter((u: any) => ["doctor", "nurse"].includes(u.role)).map((u: any) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.full_name} ({u.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowTeamDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createTeamMutation.isPending}>
                          {createTeamMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teams.map((team: any) => (
                  <Card key={team.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            <Badge variant="outline" className="capitalize">{team.teamType}</Badge>
                            <Badge variant={team.status === "active" ? "default" : "secondary"}>
                              {team.status}
                            </Badge>
                          </div>
                          {team.description && (
                            <p className="text-sm text-muted-foreground mb-2">{team.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {team.teamLead && (
                              <span>Lead: {team.teamLead.name}</span>
                            )}
                            <span>{team.memberCount} members</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {teams.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No teams created yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Staff Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff to Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const userId = formData.get("user_id") as string;
            if (userId && assignToDeptId) {
              assignStaffMutation.mutate({
                user_id: userId,
                department_id: assignToDeptId
              });
            }
          }} className="space-y-4">
            <div>
              <Label>Select Staff Member</Label>
              <Select name="user_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignStaffMutation.isPending}>
                {assignStaffMutation.isPending ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
