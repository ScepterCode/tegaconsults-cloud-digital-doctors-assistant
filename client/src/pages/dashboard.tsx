import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Fingerprint,
  LogOut,
  AlertTriangle,
  TrendingUp,
  Pill,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Patient, HealthAssessment } from "@shared/schema";

type PatientStatusFilter = "all" | "new" | "last-week" | "critical" | "low-risk" | "booked" | "discharged" | "death";

interface PatientStatus {
  isNew: boolean;
  isLastWeek: boolean;
  isCritical: boolean;
  isLowRisk: boolean;
  isBooked: boolean;
  isDischarged: boolean;
  isDeath: boolean;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"general" | "nin" | "fingerprint" | "facial">(
    "general"
  );
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showCDS, setShowCDS] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>("all");

  const { data: patients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/patients/search", {
        query,
        searchType,
      });
      return await res.json();
    },
    onSuccess: (results) => {
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "Patient not found with the provided information.",
        });
        setSelectedPatient(null);
      } else if (results.length === 1) {
        setSelectedPatient(results[0]);
        setShowCDS(true);
      } else {
        // Multiple results - show list
        setSelectedPatient(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cdsQuery = useQuery<HealthAssessment>({
    queryKey: ["/api/patients", selectedPatient?.id, "health-analysis"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/patients/${selectedPatient?.id}/health-analysis`);
      return await res.json();
    },
    enabled: !!selectedPatient?.id,
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty Search",
        description: "Please enter a search query.",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedPatient(null);
    setShowCDS(false);
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-100 text-red-900";
      case "HIGH":
        return "bg-orange-100 text-orange-900";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-900";
      case "LOW":
        return "bg-green-100 text-green-900";
      default:
        return "bg-gray-100 text-gray-900";
    }
  };

  const getPatientStatus = (patient: Patient): PatientStatus => {
    const now = new Date();
    const createdDate = patient.createdAt ? new Date(patient.createdAt) : new Date();
    const daysOld = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simple heuristics for demo purposes
    const isNew = daysOld <= 1;
    const isLastWeek = daysOld <= 7;
    const isCritical = (patient.bloodPressureSystolic && patient.bloodPressureSystolic > 160) || 
                       (patient.heartRate && patient.heartRate > 120);
    const isLowRisk = !isCritical && patient.temperature && parseFloat(patient.temperature) < 37.5;
    const isBooked = patient.phoneNumber && patient.phoneNumber.length > 0;
    const isDischarged = patient.age && patient.age > 60 && isLowRisk;
    const isDeath = false; // Placeholder

    return { isNew, isLastWeek, isCritical, isLowRisk, isBooked, isDischarged, isDeath };
  };

  const filteredPatients = (patients || []).filter((patient) => {
    if (statusFilter === "all") return true;
    
    const status = getPatientStatus(patient);
    switch (statusFilter) {
      case "new":
        return status.isNew;
      case "last-week":
        return status.isLastWeek;
      case "critical":
        return status.isCritical;
      case "low-risk":
        return status.isLowRisk;
      case "booked":
        return status.isBooked;
      case "discharged":
        return status.isDischarged;
      case "death":
        return status.isDeath;
      default:
        return true;
    }
  });

  const statusCounts = {
    new: (patients || []).filter(p => getPatientStatus(p).isNew).length,
    lastWeek: (patients || []).filter(p => getPatientStatus(p).isLastWeek).length,
    critical: (patients || []).filter(p => getPatientStatus(p).isCritical).length,
    lowRisk: (patients || []).filter(p => getPatientStatus(p).isLowRisk).length,
    booked: (patients || []).filter(p => getPatientStatus(p).isBooked).length,
    discharged: (patients || []).filter(p => getPatientStatus(p).isDischarged).length,
    death: (patients || []).filter(p => getPatientStatus(p).isDeath).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">👨‍⚕️</span>
            </div>
            <h1 className="text-3xl font-bold">Doctor's Assistant</h1>
          </div>
          <p className="text-blue-100">
            Welcome, {user?.fullName} — AI & CDS tools at your fingertips
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex gap-3 flex-wrap">
          <Button
            onClick={() => setLocation("/patients/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-add-patient"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Patient
          </Button>
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            data-testid="button-fingerprint-verify"
          >
            <Fingerprint className="h-4 w-4 mr-2" />
            ID Fingerprint Verification
          </Button>
          <Button onClick={handleLogout} variant="destructive" data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">Search Patient</h2>
            </div>
            <Card className="p-6 bg-white">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={searchType === "general" ? "default" : "outline"}
                    onClick={() => setSearchType("general")}
                    data-testid="button-search-type-general"
                  >
                    Name/NIN
                  </Button>
                  <Button
                    size="sm"
                    variant={searchType === "nin" ? "default" : "outline"}
                    onClick={() => setSearchType("nin")}
                    data-testid="button-search-type-nin"
                  >
                    NIN
                  </Button>
                  <Button
                    size="sm"
                    variant={searchType === "fingerprint" ? "default" : "outline"}
                    onClick={() => setSearchType("fingerprint")}
                    data-testid="button-search-type-fingerprint"
                  >
                    Fingerprint
                  </Button>
                  <Button
                    size="sm"
                    variant={searchType === "facial" ? "default" : "outline"}
                    onClick={() => setSearchType("facial")}
                    data-testid="button-search-type-facial"
                  >
                    Facial Recognition
                  </Button>
                </div>

                <div className="flex gap-3 flex-wrap items-center">
                  <Input
                    placeholder={
                      searchType === "general"
                        ? "Search by name or NIN (e.g. NIN123 or John Doe)"
                        : `Enter ${searchType} data`
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="max-w-sm"
                    data-testid="input-patient-search"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={searchMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-search"
                  >
                    {searchMutation.isPending ? "Searching..." : "Search"}
                  </Button>
                  <Button onClick={handleClear} variant="outline" data-testid="button-clear">
                    Clear
                  </Button>
                  <span className="text-sm text-gray-600">
                    Tip: you can enter full or partial NIN or name.
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* CDS Results */}
          {showCDS && selectedPatient && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Clinical Decision Support (CDS)</h2>

              {cdsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : cdsQuery.data ? (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                    <TabsTrigger value="prescription">Prescriptions</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Patient Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Patient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-semibold">
                              {selectedPatient.firstName} {selectedPatient.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Age</p>
                            <p className="font-semibold">{selectedPatient.age} years</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Blood Group</p>
                            <p className="font-semibold">{selectedPatient.bloodGroup}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Genotype</p>
                            <p className="font-semibold">{selectedPatient.genotype}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Health Risk Score */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Health Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-center">
                            <div
                              className={`text-5xl font-bold mb-2 ${
                                cdsQuery.data.riskLevel === "CRITICAL"
                                  ? "text-red-600"
                                  : cdsQuery.data.riskLevel === "HIGH"
                                    ? "text-orange-600"
                                    : cdsQuery.data.riskLevel === "MODERATE"
                                      ? "text-yellow-600"
                                      : "text-green-600"
                              }`}
                            >
                              {cdsQuery.data.healthRiskScore}
                            </div>
                            <Badge className={`${getRiskColor(cdsQuery.data.riskLevel)}`}>
                              {cdsQuery.data.riskLevel} RISK
                            </Badge>
                          </div>

                          {cdsQuery.data.riskFactors.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2">Risk Factors:</p>
                              <div className="flex flex-wrap gap-2">
                                {cdsQuery.data.riskFactors.map((factor) => (
                                  <Badge key={factor} variant="outline">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Vital Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Vital Signs Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-blue-600">Blood Pressure</p>
                          <p className="text-sm text-gray-700">{cdsQuery.data.analysisDetails.bpAnalysis}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-600">Heart Rate</p>
                          <p className="text-sm text-gray-700">
                            {cdsQuery.data.analysisDetails.heartRateAnalysis}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-600">Temperature</p>
                          <p className="text-sm text-gray-700">
                            {cdsQuery.data.analysisDetails.temperatureAnalysis}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-600">Weight</p>
                          <p className="text-sm text-gray-700">
                            {cdsQuery.data.analysisDetails.weightAnalysis}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Diagnosis Tab */}
                  <TabsContent value="diagnosis" className="space-y-4">
                    {cdsQuery.data.suggestedDiagnosis.length > 0 ? (
                      <div className="space-y-3">
                        {cdsQuery.data.suggestedDiagnosis.map((diagnosis, idx) => (
                          <Card key={idx}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    {diagnosis.condition}
                                  </CardTitle>
                                  <CardDescription>
                                    Confidence: {(diagnosis.confidence * 100).toFixed(0)}%
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant={
                                    diagnosis.severity === "severe"
                                      ? "destructive"
                                      : diagnosis.severity === "moderate"
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {diagnosis.severity.toUpperCase()}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div>
                                <p className="text-sm font-semibold mb-2">Symptoms:</p>
                                <div className="flex flex-wrap gap-2">
                                  {diagnosis.symptoms.map((symptom) => (
                                    <Badge key={symptom} variant="outline">
                                      {symptom}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-600">
                          No diagnoses suggested based on current vitals.
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Prescriptions Tab */}
                  <TabsContent value="prescription" className="space-y-4">
                    {cdsQuery.data.prescribedDrugs.length > 0 ? (
                      <div className="space-y-3">
                        {cdsQuery.data.prescribedDrugs.map((drug, idx) => (
                          <Card key={idx}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    <Pill className="h-4 w-4" />
                                    {drug.drugName}
                                  </CardTitle>
                                  <CardDescription>{drug.indication}</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-gray-600">Dosage</p>
                                  <p className="font-semibold text-sm">{drug.dosage}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Frequency</p>
                                  <p className="font-semibold text-sm">{drug.frequency}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Duration</p>
                                  <p className="font-semibold text-sm">{drug.duration}</p>
                                </div>
                              </div>

                              {drug.contraindications.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Contraindications:
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {drug.contraindications.map((contra) => (
                                      <Badge key={contra} variant="destructive">
                                        {contra}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {drug.sideEffects.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold text-orange-600">Side Effects:</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {drug.sideEffects.map((effect) => (
                                      <Badge key={effect} variant="outline">
                                        {effect}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-600">
                          No prescriptions recommended at this time.
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Recommendations Tab */}
                  <TabsContent value="recommendations" className="space-y-4">
                    {cdsQuery.data.recommendations.length > 0 ? (
                      <div className="space-y-3">
                        {cdsQuery.data.recommendations.map((rec, idx) => (
                          <Card key={idx}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    {rec.category}
                                  </CardTitle>
                                  <CardDescription>{rec.recommendation}</CardDescription>
                                </div>
                                <Badge
                                  variant={
                                    rec.priority === "high"
                                      ? "destructive"
                                      : rec.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {rec.priority.toUpperCase()}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm bg-gray-50 p-3 rounded">
                                <span className="font-semibold">Action:</span> {rec.action}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-600">
                          No additional recommendations at this time.
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              ) : null}

              <Button
                onClick={() => setLocation(`/patients/${selectedPatient.id}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-view-full-record"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Full Patient Record
              </Button>
            </div>
          )}

          {/* Patient Records Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter Panel - Right Side */}
            <div className="lg:col-span-1">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Filter Patients</CardTitle>
                  <CardDescription>Search by status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    className="w-full justify-between text-left"
                    onClick={() => setStatusFilter("all")}
                    data-testid="button-filter-all"
                  >
                    <span>All Patients</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">{patients?.length || 0}</span>
                  </Button>
                  <Button
                    variant={statusFilter === "new" ? "default" : "outline"}
                    className="w-full justify-between text-left"
                    onClick={() => setStatusFilter("new")}
                    data-testid="button-filter-new"
                  >
                    <span>New Patients</span>
                    <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">{statusCounts.new}</span>
                  </Button>
                  <Button
                    variant={statusFilter === "last-week" ? "default" : "outline"}
                    className="w-full justify-between text-left"
                    onClick={() => setStatusFilter("last-week")}
                    data-testid="button-filter-last-week"
                  >
                    <span>Last Week</span>
                    <span className="text-xs bg-purple-200 text-purple-900 px-2 py-1 rounded">{statusCounts.lastWeek}</span>
                  </Button>
                  <Button
                    variant={statusFilter === "critical" ? "default" : "outline"}
                    className="w-full justify-between text-left"
                    onClick={() => setStatusFilter("critical")}
                    data-testid="button-filter-critical"
                  >
                    <span>Critical</span>
                    <span className="text-xs bg-red-200 text-red-900 px-2 py-1 rounded">{statusCounts.critical}</span>
                  </Button>
                  <Button
                    variant={statusFilter === "low-risk" ? "default" : "outline"}
                    className="w-full justify-between text-left"
                    onClick={() => setStatusFilter("low-risk")}
                    data-testid="button-filter-low-risk"
                  >
                    <span>Low Risk</span>
                    <span className="text-xs bg-green-200 text-green-900 px-2 py-1 rounded">{statusCounts.lowRisk}</span>
                  </Button>
                  <Button
                    variant={statusFilter === "booked" ? "default" : "outline"}
                    className="w-full justify-between text-left"
                    onClick={() => setStatusFilter("booked")}
                    data-testid="button-filter-booked"
                  >
                    <span>Booked Appointment</span>
                    <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded">{statusCounts.booked}</span>
                  </Button>
                  <Button
                    variant={statusFilter === "discharged" ? "default" : "outline"}
                    className="w-full justify-between text-left"
                    onClick={() => setStatusFilter("discharged")}
                    data-testid="button-filter-discharged"
                  >
                    <span>Discharged</span>
                    <span className="text-xs bg-gray-300 text-gray-900 px-2 py-1 rounded">{statusCounts.discharged}</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Patient Table - Main Section */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 text-gray-600">📋</div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {statusFilter === "all" 
                    ? "Patient Records" 
                    : `${statusFilter.replace(/-/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Patients`}
                </h2>
              </div>

              <div className="text-sm text-gray-700 font-semibold">
                Showing: <span data-testid="text-filtered-patients">{filteredPatients.length}</span> of <span data-testid="text-total-patients">{patients?.length || 0}</span> patients
              </div>

              <Card className="bg-white overflow-hidden">
                {patientsLoading ? (
                  <div className="space-y-3 p-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredPatients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">Age</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">Gender</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">BP</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">Temp (°C)</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">Heart Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.map((patient) => (
                          <tr
                            key={patient.id}
                            className="border-b hover:bg-gray-50 cursor-pointer transition"
                            onClick={() => setLocation(`/patients/${patient.id}`)}
                            data-testid={`row-patient-${patient.id}`}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{patient.age}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                              {patient.bloodPressureSystolic && patient.bloodPressureDiastolic
                                ? `${patient.bloodPressureSystolic}/${patient.bloodPressureDiastolic}`
                                : "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {patient.temperature || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {patient.heartRate ? `${patient.heartRate} bpm` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No patients found for this filter.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
