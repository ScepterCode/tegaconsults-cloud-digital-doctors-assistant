import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Department } from "@shared/schema";

export default function AdminDepartments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [taskDialog, setTaskDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [taskData, setTaskData] = useState({
    title: "",
    message: "",
    type: "consultation_request" as const,
    priority: "normal" as const,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/departments/${user?.id}`);
      return await res.json();
    },
    enabled: !!user?.id,
  });

  const { data: staffCounts = {} } = useQuery({
    queryKey: ["/api/admin/departments/staff"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/departments/staff`);
      return await res.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDept) return;
      const res = await apiRequest("POST", `/api/departments/${selectedDept.id}/notifications`, {
        ...taskData,
        patientId: "system-task",
        requestedBy: user?.id,
        status: "unread",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Task assigned to department" });
      setTaskDialog(false);
      setTaskData({ title: "", message: "", type: "consultation_request", priority: "normal" });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign task", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Department Management</h1>
        <p className="text-muted-foreground mt-2">Manage all hospital departments and assign tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{departments.filter((d) => d.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Object.values(staffCounts as Record<string, number>).reduce((a: number, b: any) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <Card key={dept.id} data-testid={`card-department-${dept.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{dept.name}</CardTitle>
                  <CardDescription>{dept.description}</CardDescription>
                </div>
                <Badge variant={dept.status === "active" ? "default" : "secondary"}>
                  {dept.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{(staffCounts as Record<string, number>)[dept.id] || 0} staff members</span>
              </div>

              <Button
                onClick={() => {
                  setSelectedDept(dept);
                  setTaskDialog(true);
                }}
                className="w-full"
                data-testid={`button-assign-task-${dept.id}`}
              >
                <Send className="h-4 w-4 mr-2" />
                Assign Task
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Assignment Dialog */}
      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Task to {selectedDept?.name}</DialogTitle>
            <DialogDescription>Create a service request or notification</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Task Type</label>
              <Select value={taskData.type} onValueChange={(value: any) => setTaskData({ ...taskData, type: value })}>
                <SelectTrigger data-testid="select-task-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation_request">Consultation Request</SelectItem>
                  <SelectItem value="emergency_alert">Emergency Alert</SelectItem>
                  <SelectItem value="lab_result">Lab Result</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="status_update">Status Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Priority</label>
              <Select value={taskData.priority} onValueChange={(value: any) => setTaskData({ ...taskData, priority: value })}>
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Title</label>
              <Input
                placeholder="Task title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                data-testid="input-task-title"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Message</label>
              <textarea
                placeholder="Task details"
                value={taskData.message}
                onChange={(e) => setTaskData({ ...taskData, message: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={4}
                data-testid="textarea-task-message"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setTaskDialog(false)} data-testid="button-cancel-task">
                Cancel
              </Button>
              <Button
                onClick={() => createTaskMutation.mutate()}
                disabled={!taskData.title || !taskData.message || createTaskMutation.isPending}
                className="flex-1"
                data-testid="button-assign-confirm"
              >
                {createTaskMutation.isPending ? "Assigning..." : "Assign Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
