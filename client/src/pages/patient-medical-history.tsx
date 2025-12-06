import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Download, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientFile {
  id: string;
  patientId: string;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  description?: string;
  category?: string;
  uploadedBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

export default function PatientMedicalHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("lab_result");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientFiles();
    }
  }, [selectedPatient, filterType]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/patients", {
        headers: { "user-id": user?.id || "" }
      });
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const fetchPatientFiles = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("file_type", filterType);
      
      const response = await fetch(
        `http://localhost:5000/api/patient-files/patient/${selectedPatient}?${params}`,
        { headers: { "user-id": user?.id || "" } }
      );
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patient files",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedPatient) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/patient-files/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": user?.id || ""
          },
          body: JSON.stringify({
            patient_id: selectedPatient,
            file_type: fileType,
            file_name: uploadFile.name,
            file_data: reader.result as string,
            description,
            category
          })
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "File uploaded successfully"
          });
          setUploadDialogOpen(false);
          resetUploadForm();
          fetchPatientFiles();
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive"
        });
      }
    };
    reader.readAsDataURL(uploadFile);
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setFileType("lab_result");
    setCategory("");
    setDescription("");
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/patient-files/${fileId}`, {
        method: "DELETE",
        headers: { "user-id": user?.id || "" }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "File deleted successfully"
        });
        fetchPatientFiles();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const filteredFiles = files.filter(file =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canUpload = ["doctor", "nurse", "lab_tech", "pharmacist", "admin", "system_admin"].includes(user?.role || "");
  const canDelete = ["doctor", "admin", "system_admin"].includes(user?.role || "");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patient Medical History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - MRN: {patient.mrn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPatient && (
        <>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="lab_result">Lab Results</SelectItem>
                <SelectItem value="prescription">Prescriptions</SelectItem>
                <SelectItem value="scan">Scans</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {canUpload && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Patient File</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <Label>File Type</Label>
                      <Select value={fileType} onValueChange={setFileType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lab_result">Lab Result</SelectItem>
                          <SelectItem value="prescription">Prescription</SelectItem>
                          <SelectItem value="scan">Scan</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Category (Optional)</Label>
                      <Input
                        placeholder="e.g., Blood Test, X-Ray, MRI"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Description (Optional)</Label>
                      <Textarea
                        placeholder="Add notes about this file"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>File</Label>
                      <Input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">Upload</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Medical Files ({filteredFiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : filteredFiles.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No files found</p>
              ) : (
                <div className="space-y-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{file.fileName}</p>
                            <Badge variant="outline">{file.fileType.replace("_", " ")}</Badge>
                            {file.category && (
                              <Badge variant="secondary">{file.category}</Badge>
                            )}
                          </div>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Uploaded by: {file.uploadedBy.name} ({file.uploadedBy.role})</span>
                            <span>Size: {file.fileSize}</span>
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
