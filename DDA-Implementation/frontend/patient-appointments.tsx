import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, User, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";

const appointmentSchema = z.object({
  appointmentDate: z.string().min(1, "Date is required"),
  reason: z.string().min(5, "Please provide a reason"),
  doctorId: z.string().min(1, "Please select a doctor"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function PatientAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      appointmentDate: "",
      reason: "",
      doctorId: "",
    },
  });

  // Fetch patient appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments/patient", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/appointments/patient/${user?.id}`);
      return response.json();
    },
  });

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/users");
      const users = await response.json();
      return users.filter((u: any) => u.role === "doctor");
    },
  });

  // Create/Update appointment mutation
  const appointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (editingId) {
        const response = await apiRequest("PATCH", `/api/appointments/${editingId}`, {
          appointmentDate: new Date(data.appointmentDate),
          reason: data.reason,
          doctorId: data.doctorId,
        });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/appointments", {
          patientId: user?.id,
          appointmentDate: new Date(data.appointmentDate),
          reason: data.reason,
          doctorId: data.doctorId,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/appointments/patient", user?.id],
      });
      toast({
        title: "Success",
        description: editingId ? "Appointment updated successfully!" : "Appointment booked successfully!",
      });
      form.reset();
      setEditingId(null);
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: editingId ? "Failed to update appointment" : "Failed to book appointment",
        variant: "destructive",
      });
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiRequest("DELETE", `/api/appointments/${appointmentId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/appointments/patient", user?.id],
      });
      toast({
        title: "Success",
        description: "Appointment cancelled successfully!",
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

  const handleEditClick = (appointment: any) => {
    setEditingId(appointment.id);
    form.reset({
      doctorId: appointment.doctorId,
      appointmentDate: new Date(appointment.appointmentDate).toISOString().slice(0, 16),
      reason: appointment.reason,
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingId(null);
    form.reset();
    setOpen(false);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground">View and book appointments with doctors</p>
        </div>
        <Dialog open={open} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-book-appointment-new">
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Appointment" : "Book an Appointment"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  appointmentMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Doctor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a doctor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctors.map((doctor: any) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          data-testid="input-appointment-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Visit</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your reason for the appointment"
                          {...field}
                          data-testid="textarea-appointment-reason"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={appointmentMutation.isPending}
                  data-testid="button-book-appointment"
                >
                  {appointmentMutation.isPending ? editingId ? "Updating..." : "Booking..." : editingId ? "Update Appointment" : "Book Appointment"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {appointmentsLoading ? (
        <div className="text-center py-8">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No appointments booked yet</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Book Your First Appointment</Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment: any) => (
            <Card key={appointment.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-semibold">Doctor: {appointment.doctorId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span data-testid={`text-appointment-date-${appointment.id}`}>
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(appointment.appointmentDate).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant={getStatusBadgeVariant(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(appointment)}
                      data-testid={`button-edit-appointment-${appointment.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                      disabled={deleteAppointmentMutation.isPending}
                      data-testid={`button-delete-appointment-${appointment.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
