import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, AlertTriangle, FileText, Calendar, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LabResult } from "@shared/schema";

interface LabResultsDisplayProps {
  patientId: string;
}

export function LabResultsDisplay({ patientId }: LabResultsDisplayProps) {
  const { data: labResults, isLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/patients", patientId, "lab-results"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-900";
      case "abnormal":
        return "bg-yellow-100 text-yellow-900";
      case "critical":
        return "bg-red-100 text-red-900";
      default:
        return "bg-gray-100 text-gray-900";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "abnormal":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!labResults || labResults.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg font-medium">No lab results yet</p>
          <p className="text-sm text-muted-foreground">Upload lab results to get automated analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {(labResults || []).map((result) => {
        const analysis = result.automatedAnalysis ? JSON.parse(result.automatedAnalysis) : null;

        return (
          <Card key={result.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{result.testName}</CardTitle>
                    <CardDescription>{result.testCategory}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p className="font-medium">
                    {result.uploadedAt ? new Date(result.uploadedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">File</p>
                  <p className="font-medium truncate">{result.fileName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{result.testCategory}</p>
                </div>
              </div>

              {/* Test Values */}
              {result.testValues && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Test Values</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.testValues}</p>
                </div>
              )}

              {/* Automated Analysis */}
              {analysis && (
                <Tabs defaultValue="analysis" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                    <TabsTrigger value="notes">Doctor Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="space-y-3 mt-3">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Overall Status</p>
                      <p className="text-sm text-blue-800">{analysis.overallStatus?.toUpperCase() || "Analyzing..."}</p>
                    </div>

                    {analysis.flaggedAbnormalities && analysis.flaggedAbnormalities.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Flagged Abnormalities</p>
                        <div className="space-y-2">
                          {analysis.flaggedAbnormalities.map((item: any, idx: number) => (
                            <div key={idx} className="border-l-4 border-yellow-400 pl-3 py-2">
                              <p className="text-sm font-medium">{item.parameter}</p>
                              <p className="text-xs text-gray-600">
                                Value: {item.value} (Normal: {item.normalRange})
                              </p>
                              <p className="text-xs text-gray-700 mt-1">{item.clinicalSignificance}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Recommendations</p>
                        <ul className="space-y-1">
                          {analysis.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-700 flex gap-2">
                              <span className="text-blue-600">•</span> {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-3 mt-3">
                    {result.doctorNotes ? (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.doctorNotes}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No doctor notes yet</p>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
