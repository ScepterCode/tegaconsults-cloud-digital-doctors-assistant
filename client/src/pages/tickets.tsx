import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Filter, Search, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Tickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: ticketsData } = useQuery({
    queryKey: ["tickets", user?.id, user?.role, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        user_id: user?.id || "",
        user_role: user?.role || ""
      });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      
      const res = await apiRequest("GET", `/api/tickets?${params}`);
      return res.json();
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ["ticket-stats", user?.id, user?.role],
    queryFn: async () => {
      const params = new URLSearchParams({
        user_id: user?.id || "",
        user_role: user?.role || ""
      });
      const res = await apiRequest("GET", `/api/tickets/stats/summary?${params}`);
      return res.json();
    }
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/system-admin/users");
      return res.json();
    },
    enabled: user?.role === "hospital_admin" || user?.role === "system_admin"
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/tickets?user_id=${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
      toast({ title: "Ticket created successfully" });
      setShowCreateDialog(false);
    }
  });

  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTicketMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      type: formData.get("type"),
      priority: formData.get("priority"),
      category: formData.get("category"),
      assigned_to: formData.get("assigned_to") || null,
      due_date: formData.get("due_date") || null
    });
  };

  const tickets = ticketsData?.tickets || [];
  const filteredTickets = tickets.filter((ticket: any) =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="h-4 w-4" />;
      case "in_progress": return <AlertCircle className="h-4 w-4" />;
      case "resolved": return <CheckCircle2 className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ticket Management</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input name="title" required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="query">Query</SelectItem>
                      <SelectItem value="issue">Issue</SelectItem>
                      <SelectItem value="request">Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select name="category">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinical">Clinical</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input name="due_date" type="date" />
                </div>
              </div>
              {(user?.role === "hospital_admin" || user?.role === "system_admin") && (
                <div>
                  <Label>Assign To</Label>
                  <Select name="assigned_to">
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.users?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTicketMutation.isPending}>
                  {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statsData?.open || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statsData?.in_progress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statsData?.resolved || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="query">Query</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="request">Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTickets.map((ticket: any) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">{ticket.ticketNumber}</span>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                        </Badge>
                        <Badge variant="secondary" className="capitalize">{ticket.type}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{ticket.title}</h3>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span>Created by: {ticket.createdBy?.name}</span>
                        {ticket.assignedTo && <span>Assigned to: {ticket.assignedTo.name}</span>}
                        {ticket.dueDate && <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No tickets found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
