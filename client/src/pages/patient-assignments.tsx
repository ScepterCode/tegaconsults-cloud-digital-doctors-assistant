import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Users, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PatientAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  const { data: statsData } = useQuery({
    queryKey: ["assignment-stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/patient-assignments/stats");
      return res.json();
    }
  });

  const { data: unassignedData } = useQuery({
    queryKey: ["unassigned-patients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/patient-assignments/unassigned");
      return res.json();
    }
  });

  const { data: doctorsData } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/system-admin/users?role=doctor");
      return res.json();
    }
  });

  const assignMutation = useMutation({
    mutationFn: async ({ patientId, doctorId }: { patientId: string; doctorId: string }) => {
      const res = await apiRequest("POST", `/api/patient-assignments/assign?admin_id=${user?.id}`, {
        patient_id: patientId,
        doctor_id: doctorId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-patients"] });
      toast({ title: "Patient assigned successfully" });
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ patientIds, doctorId }: { patientIds: string[]; doctorId: string }) => {
      const res = await apiRequest("POST", `/api/patient-assignments/bulk-assign?admin_id=${user?.id}`, {
        patient_ids: patientIds,
        doctor_id: doctorId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["unassigned-patients"] });
      setSelectedPatients([]);
      toast({ title: "Patients assigned successfully" });
    }
  });

  const handleAssign = (patientId: string, doctorId: string) => {
    assignMutation.mutate({ patientId, doctorId });
  };

  const handleBulkAssign = (doctorId: string) => {
    if (selectedPatients.length === 0) {
      toast({ title: "No patients selected", variant: "destructive" });
      return;
    }
    bulkAssignMutation.mutate({ patientIds: selectedPatients, doctorId });
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const unassignedPatients = unassignedData?.patients || [];
  const doctors = doctorsData?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patient Assignments</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.total_patients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statsData?.assigned_patients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Unassigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statsData?.unassigned_patients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Assignment Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.assignment_rate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {statsData?.doctor_workload && statsData.doctor_workload.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Doctor Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statsData.doctor_workload.map((doc: any) => (
                <div key={doc.doctor_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{doc.doctor_name}</span>
                  <Badge variant="secondary">{doc.patient_count} patients</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Unassigned Patients ({unassignedPatients.length})</CardTitle>
            {selectedPatients.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedPatients.length} selected
                </span>
                <Select onValueChange={handleBulkAssign}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Assign to doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {unassignedPatients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>All patients have been assigned to doctors</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedPatients.length === unassignedPatients.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPatients(unassignedPatients.map((p: any) => p.id));
                        } else {
                          setSelectedPatients([]);
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>MRN</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assign To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedPatients.map((patient: any) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedPatients.includes(patient.id)}
                        onChange={() => togglePatientSelection(patient.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{patient.mrn}</TableCell>
                    <TableCell className="font-medium">{patient.fullName}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell className="capitalize">{patient.gender}</TableCell>
                    <TableCell>{patient.phoneNumber}</TableCell>
                    <TableCell>
                      <Select onValueChange={(doctorId) => handleAssign(patient.id, doctorId)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor: any) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
