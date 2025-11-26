import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Camera, Fingerprint, Save, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { insertPatientSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const patientFormSchema = insertPatientSchema.extend({
  mrn: z.string().min(1, "MRN is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  age: z.number().min(1, "Age must be at least 1").max(150, "Invalid age"),
  gender: z.string().min(1, "Gender is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  nin: z.string().min(1, "NIN is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  genotype: z.string().min(1, "Genotype is required"),
  registeredBy: z.string(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

export default function NewPatient() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState<"facial" | "fingerprint">("facial");
  const [facialData, setFacialData] = useState<string | null>(null);
  const [fingerprintData, setFingerprintData] = useState<string | null>(null);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      mrn: `MRN${Date.now()}`,
      firstName: "",
      lastName: "",
      age: 0,
      gender: "",
      phoneNumber: "",
      email: "",
      address: "",
      nin: "",
      bloodGroup: "",
      genotype: "",
      allergies: "",
      bloodPressureSystolic: undefined,
      bloodPressureDiastolic: undefined,
      temperature: "",
      heartRate: undefined,
      weight: "",
      facialRecognitionData: null,
      fingerprintData: null,
      registeredBy: user?.id || "",
      lastUpdatedBy: null,
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const res = await apiRequest("POST", "/api/patients", {
        ...data,
        facialRecognitionData: facialData,
        fingerprintData: fingerprintData,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Patient Registered",
        description: "Patient has been successfully registered.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setLocation("/patients");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PatientFormData) => {
    createPatientMutation.mutate(data);
  };

  const handleCaptureBiometric = (type: "facial" | "fingerprint") => {
    setBiometricType(type);
    setShowBiometric(true);
  };

  const handleBiometricCapture = () => {
    const demoData = `${biometricType}_${Date.now()}_captured`;
    if (biometricType === "facial") {
      setFacialData(demoData);
    } else {
      setFingerprintData(demoData);
    }
    toast({
      title: "Biometric Captured",
      description: `${biometricType === "facial" ? "Facial recognition" : "Fingerprint"} data captured successfully.`,
    });
    setShowBiometric(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/patients")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-new-patient-title">Register New Patient</h1>
          <p className="text-muted-foreground mt-1">
            Complete patient biodata and medical information
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic biodata and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John" data-testid="input-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Doe" data-testid="input-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="25"
                          data-testid="input-age"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+234 800 000 0000" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john.doe@example.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Full address" data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identification & Biometrics</CardTitle>
              <CardDescription>National identification and biometric data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="mrn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Record Number *</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono" readOnly data-testid="input-mrn" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID Number (NIN)</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono" placeholder="12345678901" data-testid="input-nin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">Identification Methods</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select at least one identification method: NIN, Fingerprint, or Facial Recognition
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>National ID (NIN)</Label>
                    <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {form.getValues("nin") ? "✓ NIN entered" : "Enter NIN above"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Facial Recognition</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleCaptureBiometric("facial")}
                      data-testid="button-capture-facial"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {facialData ? "Recapture" : "Capture"}
                    </Button>
                    {facialData && (
                      <p className="text-xs text-success" data-testid="status-facial-captured">✓ Facial data captured</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Fingerprint</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleCaptureBiometric("fingerprint")}
                      data-testid="button-capture-fingerprint"
                    >
                      <Fingerprint className="h-4 w-4 mr-2" />
                      {fingerprintData ? "Recapture" : "Capture"}
                    </Button>
                    {fingerprintData && (
                      <p className="text-xs text-success" data-testid="status-fingerprint-captured">✓ Fingerprint captured</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>Blood type and genetic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-blood-group">
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="genotype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genotype *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-genotype">
                            <SelectValue placeholder="Select genotype" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AA">AA</SelectItem>
                          <SelectItem value="AS">AS</SelectItem>
                          <SelectItem value="SS">SS</SelectItem>
                          <SelectItem value="AC">AC</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergies</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="List any known allergies (e.g., Penicillin, Peanuts)" data-testid="input-allergies" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Vitals</CardTitle>
              <CardDescription>Record current vital signs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bloodPressureSystolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Pressure (Systolic) mmHg</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          placeholder="120"
                          data-testid="input-bp-systolic"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bloodPressureDiastolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Pressure (Diastolic) mmHg</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          placeholder="80"
                          data-testid="input-bp-diastolic"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="36.5" data-testid="input-temperature" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heartRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heart Rate (bpm)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          placeholder="72"
                          data-testid="input-heart-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="70.5" data-testid="input-weight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/patients")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPatientMutation.isPending}
              data-testid="button-register"
            >
              <Save className="h-4 w-4 mr-2" />
              {createPatientMutation.isPending ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showBiometric} onOpenChange={setShowBiometric}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {biometricType === "facial" ? "Capture Facial Recognition" : "Capture Fingerprint"}
            </DialogTitle>
            <DialogDescription>
              {biometricType === "facial"
                ? "Position the patient's face within the frame"
                : "Place finger on the scanner"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {biometricType === "facial" ? (
              <div className="relative w-full max-w-md aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Camera className="h-24 w-24 text-muted-foreground" />
                <div className="absolute inset-0 border-4 border-primary/50 rounded-lg" />
              </div>
            ) : (
              <div className="relative w-48 h-48 bg-muted rounded-full flex items-center justify-center">
                <Fingerprint className="h-32 w-32 text-muted-foreground" />
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Demo interface - Biometric hardware integration required
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBiometric(false)} data-testid="button-cancel-capture">
                Cancel
              </Button>
              <Button onClick={handleBiometricCapture} data-testid="button-confirm-capture">
                Capture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
