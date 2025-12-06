import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Brain, FileText, Plus, Sparkles, AlertCircle, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AIClinicalAssistant() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [question, setQuestion] = useState("");

  // Get patient data
  const { data: patientData } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/patients/${patientId}`);
      return res.json();
    },
    enabled: !!patientId
  });

  // Get AI summary
  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["ai-summary", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ai-clinical-insights/patient-summary/${patientId}?doctor_id=${user?.id}`);
      return res.json();
    },
    enabled: !!patientId && !!user?.id
  });

  // Get lab analysis
  const { data: labAnalysisData, refetch: refetchLabAnalysis } = useQuery({
    queryKey: ["lab-analysis", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ai-clinical-insights/lab-analysis/${patientId}?doctor_id=${user?.id}`);
      return res.json();
    },
    enabled: false
  });

  // Get risk assessment
  const { data: riskData, refetch: refetchRisk } = useQuery({
    queryKey: ["risk-assessment", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ai-clinical-insights/risk-assessment/${patientId}?doctor_id=${user?.id}`);
      return res.json();
    },
    enabled: false
  });

  // Get doctor notes
  const { data: notesData } = useQuery({
    queryKey: ["doctor-notes", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/doctor-notes/patient/${patientId}?doctor_id=${user?.id}`);
      return res.json();
    },
    enabled: !!patientId
  });

  // Treatment recommendations
  const treatmentMutation = useMutation({
    mutationFn: async (diagnosis: string) => {
      const res = await apiRequest("POST", `/api/ai-clinical-insights/treatment-recommendations?doctor_id=${user?.id}`, {
        patient_id: patientId,
        diagnosis
      });
      return res.json();
    }
  });

  // Ask question
  const questionMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", `/api/ai-clinical-insights/ask-question?doctor_id=${user?.id}`, {
        question,
        patient_id: patientId
      });
      return res.json();
    }
  });

  // Get patient files
  const { data: filesData } = useQuery({
    queryKey: ["patient-files", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/patient-files/patient/${patientId}`);
      return res.json();
    },
    enabled: !!patientId
  });

  // Summarize files with AI
  const { data: filesSummaryData, refetch: refetchFilesSummary, isLoading: filesSummaryLoading } = useQuery({
    queryKey: ["ai-files-summary", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ai-clinical-insights/summarize-files/${patientId}?doctor_id=${user?.id}`);
      return res.json();
    },
    enabled: false // Only run when button is clicked
  });

  // Create note
  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/doctor-notes?doctor_id=${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-notes"] });
      toast({ title: "Note created successfully" });
      setShowNoteDialog(false);
    }
  });

  const handleCreateNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createNoteMutation.mutate({
      patient_id: patientId,
      note_type: formData.get("note_type"),
      title: formData.get("title"),
      content: formData.get("content"),
      is_private: formData.get("is_private") === "on" ? "1" : "0"
    });
  };

  const handleGetTreatment = () => {
    if (!diagnosis.trim()) {
      toast({ title: "Please enter a diagnosis", variant: "destructive" });
      return;
    }
    treatmentMutation.mutate(diagnosis);
  };

  const handleAskQuestion = () => {
    if (!question.trim()) {
      toast({ title: "Please enter a question", variant: "destructive" });
      return;
    }
    questionMutation.mutate(question);
  };

  const patient = patientData?.patient;
  const notes = notesData?.notes || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Clinical Assistant
          </h1>
          {patient && (
            <p className="text-muted-foreground mt-1">
              Patient: {patient.firstName} {patient.lastName} • {patient.age}y • {patient.gender}
            </p>
          )}
        </div>
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Clinical Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <Label>Note Type</Label>
                <Select name="note_type" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="diagnosis">Diagnosis</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="observation">Observation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input name="title" placeholder="Brief title" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea name="content" rows={5} required placeholder="Clinical notes..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_private" id="is_private" className="rounded" />
                <Label htmlFor="is_private" className="cursor-pointer">Private note (only visible to me)</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNoteDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createNoteMutation.isPending}>
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">AI Summary</TabsTrigger>
          <TabsTrigger value="files">Patient Files</TabsTrigger>
          <TabsTrigger value="lab-analysis">Lab Analysis</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
          <TabsTrigger value="ask">Ask AI</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Patient History Summary
              </CardTitle>
              <CardDescription>
                AI-generated comprehensive summary of patient's medical history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                  <p>AI is analyzing patient data...</p>
                </div>
              ) : summaryData?.summary ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {summaryData.summary}
                  </div>
                  <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                    <span>📝 {summaryData.notes_count} notes analyzed</span>
                    <span>🧪 {summaryData.lab_results_count} lab results reviewed</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => refetchSummary()}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Summary
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Patient Medical Files
                  </CardTitle>
                  <CardDescription>
                    View all uploaded medical documents and get AI insights
                  </CardDescription>
                </div>
                {filesData?.files && filesData.files.length > 0 && (
                  <Button 
                    onClick={() => refetchFilesSummary()}
                    disabled={filesSummaryLoading}
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {filesSummaryLoading ? "Analyzing..." : "AI Summary"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Summary Section */}
              {filesSummaryData?.summary && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900 mb-2">AI Folder Summary</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {filesSummaryData.summary}
                      </div>
                      <div className="mt-3 text-xs text-purple-700">
                        📁 {filesSummaryData.files_analyzed} files analyzed
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Files List */}
              {filesData?.files && filesData.files.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">All Files ({filesData.files.length})</h3>
                  {filesData.files.map((file: any) => (
                    <div key={file.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{file.fileName}</span>
                            <Badge variant="outline" className="text-xs">
                              {file.fileType || "Document"}
                            </Badge>
                          </div>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</span>
                            <span>By: {file.uploadedBy}</span>
                            {file.fileSize && <span>Size: {(file.fileSize / 1024).toFixed(1)} KB</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/api/patient-files/download/${file.id}`} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No medical files uploaded yet</p>
                  <p className="text-sm mt-2">Files can be uploaded from the Medical History page</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab-analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Laboratory Results Analysis
              </CardTitle>
              <CardDescription>
                AI-powered analysis of lab results with clinical insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {labAnalysisData?.analysis ? (
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {labAnalysisData.analysis}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => refetchLabAnalysis()}>
                    <Activity className="h-4 w-4 mr-2" />
                    Analyze Lab Results
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Recommendations</CardTitle>
              <CardDescription>
                Get AI-powered treatment suggestions based on diagnosis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Diagnosis/Condition</Label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis or condition..."
                />
              </div>
              <Button onClick={handleGetTreatment} disabled={treatmentMutation.isPending}>
                {treatmentMutation.isPending ? "Generating..." : "Get Treatment Recommendations"}
              </Button>
              {treatmentMutation.data?.recommendations && (
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg mt-4">
                  {treatmentMutation.data.recommendations}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Risk Factor Assessment
              </CardTitle>
              <CardDescription>
                Identify potential health risks and preventive measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {riskData?.risk_assessment ? (
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {riskData.risk_assessment}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => refetchRisk()}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Assess Risk Factors
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Notes ({notes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notes.map((note: any) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{note.noteType.replace("_", " ")}</Badge>
                          {note.isPrivate && <Badge variant="secondary">Private</Badge>}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {note.title && <h4 className="font-semibold mb-2">{note.title}</h4>}
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        By: {note.doctor?.name}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {notes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No clinical notes yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ask">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Ask Clinical Question
              </CardTitle>
              <CardDescription>
                Get AI-powered answers to clinical questions with patient context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Your Question</Label>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="Ask a clinical question about this patient..."
                />
              </div>
              <Button onClick={handleAskQuestion} disabled={questionMutation.isPending}>
                {questionMutation.isPending ? "Thinking..." : "Ask AI"}
              </Button>
              {questionMutation.data?.answer && (
                <div className="space-y-2">
                  <Separator />
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold text-sm mb-2">Question:</p>
                    <p className="text-sm mb-4">{questionMutation.data.question}</p>
                    <p className="font-semibold text-sm mb-2">AI Answer:</p>
                    <div className="whitespace-pre-wrap text-sm">{questionMutation.data.answer}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
