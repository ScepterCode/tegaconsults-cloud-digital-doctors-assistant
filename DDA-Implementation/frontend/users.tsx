import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserPlus, UserCog, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    action: "activate" | "deactivate";
  }>({ open: false, userId: "", action: "activate" });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, { isActive: isActive ? 1 : 0 });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isActive ? "User Activated" : "User Deactivated",
        description: `User account has been ${variables.isActive ? "activated" : "deactivated"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleUser = (userId: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    setConfirmDialog({
      open: true,
      userId,
      action: newStatus === 1 ? "activate" : "deactivate",
    });
  };

  const confirmToggle = () => {
    toggleUserMutation.mutate({
      userId: confirmDialog.userId,
      isActive: confirmDialog.action === "activate",
    });
    setConfirmDialog({ open: false, userId: "", action: "activate" });
  };

  const filteredUsers = users?.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
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

  if (currentUser?.role !== "admin") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserCog className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            Only administrators can access user management
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-users-title">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage doctor and nurse accounts
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-users"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>All registered doctors, nurses, and administrators</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="rounded-md border">
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium" data-testid={`text-user-name-${user.id}`}>
                        {user.fullName}
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-username-${user.id}`}>{user.username}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)} data-testid={`badge-role-${user.id}`}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "outline"}
                          className={user.isActive ? "bg-success text-success-foreground" : ""}
                          data-testid={`badge-status-${user.id}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id !== currentUser.id && (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-muted-foreground">
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                            <Switch
                              checked={user.isActive === 1}
                              onCheckedChange={() => handleToggleUser(user.id, user.isActive)}
                              data-testid={`switch-user-status-${user.id}`}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "activate" ? "Activate User?" : "Deactivate User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "activate"
                ? "This user will be able to log in and access the system."
                : "This user will no longer be able to log in or access the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle} data-testid="button-confirm-action">
              {confirmDialog.action === "activate" ? "Activate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
