import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Activity,
  Droplet,
  Thermometer,
  Heart,
  Weight,
  Camera,
  Fingerprint,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { LabResultsUpload } from "@/components/lab-results-upload";
import { LabResultsDisplay } from "@/components/lab-results-display";
import type { Patient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<Patient>>({});

  const patientId = params?.id;

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    enabled: !!patientId,
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const res = await apiRequest("PATCH", `/api/patients/${patientId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Patient Updated",
        description: "Patient information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId] });
      setIsEditing(false);
      setEditedPatient({});
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (patient) {
      setEditedPatient(patient);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updatePatientMutation.mutate(editedPatient);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPatient({});
  };

  const canEdit = user?.role === "admin" || user?.role === "doctor";

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "P";
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getVitalStatus = (value: number | undefined, normal: { min: number; max: number }) => {
    if (!value) return "text-muted-foreground";
    if (value < normal.min || value > normal.max) return "text-destructive";
    return "text-success";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg font-medium">Patient not found</p>
          <Button onClick={() => setLocation("/patients")} className="mt-4">
            Back to Patients
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/patients")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-patient-name">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground font-mono">MRN: {patient.mrn}</p>
          </div>
        </div>
        {canEdit && !isEditing && (
          <Button onClick={handleEdit} data-testid="button-edit">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-edit">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updatePatientMutation.isPending} data-testid="button-save">
              <Save className="h-4 w-4 mr-2" />
              {updatePatientMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Patient Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(patient.firstName, patient.lastName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold" data-testid="text-patient-full-name">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-patient-age-gender">
                {patient.age} years • {patient.gender}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" data-testid="text-phone-number">{patient.phoneNumber}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-email">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm" data-testid="text-address">{patient.address}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Blood Group</span>
                <Badge variant="outline" data-testid="badge-blood-group">{patient.bloodGroup}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Genotype</span>
                <Badge variant="outline" data-testid="badge-genotype">{patient.genotype}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">NIN</span>
                <span className="text-sm font-mono" data-testid="text-nin">{patient.nin}</span>
              </div>
            </div>

            {(patient.facialRecognitionData || patient.fingerprintData) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Biometric Data</p>
                  {patient.facialRecognitionData && (
                    <div className="flex items-center gap-2 text-sm text-success" data-testid="status-facial-enrolled">
                      <Camera className="h-4 w-4" />
                      <span>Facial recognition enrolled</span>
                    </div>
                  )}
                  {patient.fingerprintData && (
                    <div className="flex items-center gap-2 text-sm text-success" data-testid="status-fingerprint-enrolled">
                      <Fingerprint className="h-4 w-4" />
                      <span>Fingerprint enrolled</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <CardDescription>
              {isEditing ? "Update patient medical details" : "Patient medical records and vital signs"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Vitals</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium">Blood Pressure</span>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Systolic"
                          value={editedPatient.bloodPressureSystolic || ""}
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient,
                              bloodPressureSystolic: parseInt(e.target.value) || undefined,
                            })
                          }
                          data-testid="input-edit-bp-systolic"
                        />
                        <Input
                          type="number"
                          placeholder="Diastolic"
                          value={editedPatient.bloodPressureDiastolic || ""}
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient,
                              bloodPressureDiastolic: parseInt(e.target.value) || undefined,
                            })
                          }
                          data-testid="input-edit-bp-diastolic"
                        />
                      </div>
                    ) : (
                      <>
                        <p
                          className={`text-2xl font-bold font-mono ${getVitalStatus(
                            patient.bloodPressureSystolic,
                            { min: 90, max: 140 }
                          )}`}
                          data-testid="text-blood-pressure"
                        >
                          {patient.bloodPressureSystolic && patient.bloodPressureDiastolic
                            ? `${patient.bloodPressureSystolic}/${patient.bloodPressureDiastolic}`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">mmHg</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium">Temperature</span>
                      </div>
                    </div>
                    {isEditing ? (
                      <Input
                        placeholder="36.5"
                        value={editedPatient.temperature || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient,
                            temperature: e.target.value,
                          })
                        }
                        data-testid="input-edit-temperature"
                      />
                    ) : (
                      <>
                        <p className="text-2xl font-bold font-mono" data-testid="text-temperature">
                          {patient.temperature || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">°C</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium">Heart Rate</span>
                      </div>
                    </div>
                    {isEditing ? (
                      <Input
                        type="number"
                        placeholder="72"
                        value={editedPatient.heartRate || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient,
                            heartRate: parseInt(e.target.value) || undefined,
                          })
                        }
                        data-testid="input-edit-heart-rate"
                      />
                    ) : (
                      <>
                        <p
                          className={`text-2xl font-bold font-mono ${getVitalStatus(patient.heartRate, {
                            min: 60,
                            max: 100,
                          })}`}
                          data-testid="text-heart-rate"
                        >
                          {patient.heartRate || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">bpm</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Weight</span>
                      </div>
                    </div>
                    {isEditing ? (
                      <Input
                        placeholder="70.5"
                        value={editedPatient.weight || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient,
                            weight: e.target.value,
                          })
                        }
                        data-testid="input-edit-weight"
                      />
                    ) : (
                      <>
                        <p className="text-2xl font-bold font-mono" data-testid="text-weight">
                          {patient.weight || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">kg</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Allergies & Notes</h3>
              {isEditing ? (
                <Textarea
                  placeholder="List any known allergies..."
                  value={editedPatient.allergies || ""}
                  onChange={(e) =>
                    setEditedPatient({
                      ...editedPatient,
                      allergies: e.target.value,
                    })
                  }
                  rows={4}
                  data-testid="input-edit-allergies"
                />
              ) : patient.allergies ? (
                <p className="text-sm" data-testid="text-allergies">{patient.allergies}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No allergies recorded</p>
              )}
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Registered by: User ID {patient.registeredBy}</p>
              {patient.lastUpdatedBy && <p>Last updated by: User ID {patient.lastUpdatedBy}</p>}
              {patient.createdAt && (
                <p>Registration date: {new Date(patient.createdAt).toLocaleDateString()}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Results Section */}
      {canEdit && (
        <div className="mt-8 space-y-6">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload Lab Results
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Lab History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
              <LabResultsUpload patientId={patientId || ""} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <LabResultsDisplay patientId={patientId || ""} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
