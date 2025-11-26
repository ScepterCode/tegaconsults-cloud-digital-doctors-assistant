import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function DoctorAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch doctor appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments/doctor", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/appointments/doctor/${user?.id}`);
      return response.json();
    },
  });

  // Confirm appointment mutation
  const confirmAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiRequest("PATCH", `/api/appointments/${appointmentId}`, {
        status: "confirmed",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/appointments/doctor", user?.id],
      });
      toast({
        title: "Success",
        description: "Appointment confirmed!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm appointment",
        variant: "destructive",
      });
    },
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiRequest("PATCH", `/api/appointments/${appointmentId}`, {
        status: "cancelled",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/appointments/doctor", user?.id],
      });
      toast({
        title: "Success",
        description: "Appointment cancelled",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const pendingAppointments = appointments.filter((apt: any) => apt.status === "pending");
  const confirmedAppointments = appointments.filter((apt: any) => apt.status === "confirmed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">Manage patient appointments and confirmations</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading appointments...</div>
      ) : (
        <>
          {/* Pending Appointments */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Pending Confirmations ({pendingAppointments.length})
            </h2>
            {pendingAppointments.length === 0 ? (
              <Card className="p-4 text-center text-muted-foreground">
                No pending appointments
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingAppointments.map((appointment: any) => (
                  <Card key={appointment.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold">Patient ID: {appointment.patientId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(appointment.appointmentDate).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => confirmAppointmentMutation.mutate(appointment.id)}
                          disabled={confirmAppointmentMutation.isPending}
                          data-testid={`button-confirm-${appointment.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelAppointmentMutation.mutate(appointment.id)}
                          disabled={cancelAppointmentMutation.isPending}
                          data-testid={`button-cancel-${appointment.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed Appointments */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Confirmed Appointments ({confirmedAppointments.length})
            </h2>
            {confirmedAppointments.length === 0 ? (
              <Card className="p-4 text-center text-muted-foreground">
                No confirmed appointments
              </Card>
            ) : (
              <div className="grid gap-4">
                {confirmedAppointments.map((appointment: any) => (
                  <Card key={appointment.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold">Patient ID: {appointment.patientId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(appointment.appointmentDate).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
