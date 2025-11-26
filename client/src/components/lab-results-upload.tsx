import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LabResult } from "@shared/schema";

interface LabResultsUploadProps {
  patientId: string;
  onUploadSuccess?: () => void;
}

export function LabResultsUpload({ patientId, onUploadSuccess }: LabResultsUploadProps) {
  const { toast } = useToast();
  const [testName, setTestName] = useState("");
  const [testCategory, setTestCategory] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [fileType, setFileType] = useState("");
  const [testValues, setTestValues] = useState("");
  const [normalRange, setNormalRange] = useState("");

  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/lab-results", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lab Result Uploaded",
        description: "Lab result has been uploaded and analyzed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "lab-results"] });
      resetForm();
      onUploadSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTestName("");
    setTestCategory("");
    setFileName("");
    setFileData("");
    setFileType("");
    setTestValues("");
    setNormalRange("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileData(content);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!testName || !testCategory || !fileName) {
      toast({
        title: "Missing Information",
        description: "Please fill in test name, category, and upload a file.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      patientId,
      testName,
      testCategory,
      fileName,
      fileData,
      fileType,
      testValues,
      normalRange,
      status: "normal",
      uploadedBy: "current-user",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Lab Result
        </CardTitle>
        <CardDescription>
          Upload lab test files for automated analysis (PDF, images, or data)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testName">Test Name *</Label>
              <Input
                id="testName"
                placeholder="e.g., Blood Test, ECG"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                data-testid="input-test-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testCategory">Test Category *</Label>
              <Select value={testCategory} onValueChange={setTestCategory}>
                <SelectTrigger id="testCategory" data-testid="select-test-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hematology">Hematology</SelectItem>
                  <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                  <SelectItem value="Immunology">Immunology</SelectItem>
                  <SelectItem value="Imaging">Imaging</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Microbiology">Microbiology</SelectItem>
                  <SelectItem value="Radiology">Radiology</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileUpload">Upload File *</Label>
            <Input
              id="fileUpload"
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.json,.csv"
              data-testid="input-file-upload"
            />
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {fileName}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testValues">Test Values (Optional)</Label>
              <Textarea
                id="testValues"
                placeholder="e.g., RBC: 4.5, WBC: 7.2"
                value={testValues}
                onChange={(e) => setTestValues(e.target.value)}
                className="h-20"
                data-testid="textarea-test-values"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="normalRange">Normal Range (Optional)</Label>
              <Textarea
                id="normalRange"
                placeholder="e.g., RBC: 4.5-5.5, WBC: 4.5-11.0"
                value={normalRange}
                onChange={(e) => setNormalRange(e.target.value)}
                className="h-20"
                data-testid="textarea-normal-range"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Uploaded lab results will be automatically analyzed using AI to detect abnormalities and provide clinical insights.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-submit-upload"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
