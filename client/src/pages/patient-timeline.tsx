import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  Calendar, FileText, Pill, TestTube, Stethoscope, 
  Upload, CreditCard, Receipt, ArrowLeft, Filter, Activity, Brain, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function PatientTimeline() {
  const { patientId } = useParams();
  const [, setLocation] = useLocation();
  const [eventFilter, setEventFilter] = useState<string>("all");
  
  const navigate = (path: string) => setLocation(path);

  const { data: timelineData, isLoading } = useQuery({
    queryKey: ["patient-timeline", patientId, eventFilter],
    queryFn: async () => {
      const filterParam = eventFilter !== "all" ? `&event_type=${eventFilter}` : "";
      const res = await apiRequest("GET", `/api/patient-timeline/${patientId}?limit=100${filterParam}`);
      return res.json();
    },
    enabled: !!patientId
  });

  const { data: summaryData } = useQuery({
    queryKey: ["patient-visit-summary", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/patient-timeline/${patientId}/summary`);
      return res.json();
    },
    enabled: !!patientId
  });

  // Get AI-powered patient summary (only for doctors)
  const { data: aiSummaryData } = useQuery({
    queryKey: ["ai-patient-summary", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ai-clinical-insights/patient-summary/${patientId}?doctor_id=dummy`);
      return res.json();
    },
    enabled: !!patientId,
    retry: false // Don't retry if user doesn't have permission
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "appointment": return <Calendar className="h-5 w-5" />;
      case "lab_result": return <TestTube className="h-5 w-5" />;
      case "doctor_note": return <Stethoscope className="h-5 w-5" />;
      case "file_upload": return <Upload className="h-5 w-5" />;
      case "prescription": return <Pill className="h-5 w-5" />;
      case "billing": return <FileText className="h-5 w-5" />;
      case "payment": return <CreditCard className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "appointment": return "bg-blue-100 text-blue-800 border-blue-200";
      case "lab_result": return "bg-purple-100 text-purple-800 border-purple-200";
      case "doctor_note": return "bg-green-100 text-green-800 border-green-200";
      case "file_upload": return "bg-orange-100 text-orange-800 border-orange-200";
      case "prescription": return "bg-pink-100 text-pink-800 border-pink-200";
      case "billing": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "payment": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      scheduled: "bg-blue-100 text-blue-800",
      dispensed: "bg-green-100 text-green-800",
      paid: "bg-green-100 text-green-800",
      partial: "bg-yellow-100 text-yellow-800",
      unpaid: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={statusColors[status?.toLowerCase()] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading patient timeline...</p>
        </div>
      </div>
    );
  }

  const patient = timelineData?.patient;
  const timeline = timelineData?.timeline || [];
  const eventCounts = timelineData?.event_counts || {};
  const summary = summaryData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Patient Timeline</h1>
            {patient && (
              <p className="text-muted-foreground">
                {patient.name} (MRN: {patient.mrn}) - {patient.age} years, {patient.gender}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="appointment">Appointments</SelectItem>
              <SelectItem value="lab_result">Lab Results</SelectItem>
              <SelectItem value="doctor_note">Doctor Notes</SelectItem>
              <SelectItem value="prescription">Prescriptions</SelectItem>
              <SelectItem value="file_upload">File Uploads</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.visit_statistics.completed_appointments}</div>
              <p className="text-xs text-muted-foreground">
                of {summary.visit_statistics.total_appointments} appointments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Lab Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.visit_statistics.total_lab_tests}</div>
              <p className="text-xs text-muted-foreground">Total tests conducted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.visit_statistics.total_prescriptions}</div>
              <p className="text-xs text-muted-foreground">Medications prescribed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{summary.billing_summary.outstanding_balance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                of ₦{summary.billing_summary.total_billed.toLocaleString()} billed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Summary (if available) */}
      {aiSummaryData?.summary && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">AI-Powered Patient Summary</CardTitle>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {aiSummaryData.summary}
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span>📝 {aiSummaryData.notes_count} clinical notes analyzed</span>
              <span>🧪 {aiSummaryData.lab_results_count} lab results reviewed</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Counts */}
      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Appointments: <strong>{eventCounts.appointments}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Lab Results: <strong>{eventCounts.lab_results}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-green-600" />
              <span className="text-sm">Doctor Notes: <strong>{eventCounts.doctor_notes}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-pink-600" />
              <span className="text-sm">Prescriptions: <strong>{eventCounts.prescriptions}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Files: <strong>{eventCounts.file_uploads}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">Payments: <strong>{eventCounts.payments}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline ({timeline.length} events)</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events found for this patient</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

              {/* Timeline events */}
              <div className="space-y-6">
                {timeline.map((event: any, index: number) => (
                  <div key={`${event.type}-${event.id}-${index}`} className="relative flex gap-4">
                    {/* Icon */}
                    <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-background ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-card border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.date), "PPP 'at' p")}
                            </p>
                          </div>
                          {event.status && getStatusBadge(event.status)}
                        </div>
                        <p className="text-sm mt-2">{event.description}</p>
                        
                        {/* Additional metadata */}
                        {event.metadata && (
                          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                            {event.type === "prescription" && event.metadata.instructions && (
                              <p><strong>Instructions:</strong> {event.metadata.instructions}</p>
                            )}
                            {event.type === "lab_result" && event.metadata.reference_range && (
                              <p><strong>Reference Range:</strong> {event.metadata.reference_range}</p>
                            )}
                            {event.type === "payment" && (
                              <p><strong>Reference:</strong> {event.metadata.reference_number}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
