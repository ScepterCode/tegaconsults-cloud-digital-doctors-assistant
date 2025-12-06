import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Search, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Prescription {
  id: string;
  patient: {
    id: string;
    name: string;
    mrn: string;
  };
  doctor: {
    id: string;
    name: string;
  };
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  status: string;
  dispensedBy?: {
    id: string;
    name: string;
  };
  dispensedAt?: string;
  notes?: string;
  createdAt: string;
}

export default function PharmacistPrescriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("pending");
  const [dispenseDialogOpen, setDispenseDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [dispenseNotes, setDispenseNotes] = useState("");

  useEffect(() => {
    fetchPrescriptions();
  }, [selectedTab]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const endpoint = selectedTab === "pending"
        ? "http://localhost:5000/api/prescriptions/pending"
        : "http://localhost:5000/api/prescriptions/pending"; // You can add a filter param
      
      const response = await fetch(endpoint, {
        headers: { "user-id": user?.id || "" }
      });
      const data = await response.json();
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch prescriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!selectedPrescription) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/prescriptions/${selectedPrescription.id}/dispense`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": user?.id || ""
          },
          body: JSON.stringify({ notes: dispenseNotes })
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Prescription dispensed successfully"
        });
        setDispenseDialogOpen(false);
        setDispenseNotes("");
        setSelectedPrescription(null);
        fetchPrescriptions();
      } else {
        throw new Error("Failed to dispense");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dispense prescription",
        variant: "destructive"
      });
    }
  };

  const openDispenseDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDispenseDialogOpen(true);
  };

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rx.patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rx.medicationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingPrescriptions = filteredPrescriptions.filter(rx => rx.status === "pending");
  const dispensedPrescriptions = filteredPrescriptions.filter(rx => rx.status === "dispensed");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prescription Management</h1>
        <div className="flex gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Clock className="mr-2 h-4 w-4" />
            Pending: {pendingPrescriptions.length}
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <CheckCircle className="mr-2 h-4 w-4" />
            Dispensed: {dispensedPrescriptions.length}
          </Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name, MRN, or medication..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending ({pendingPrescriptions.length})</TabsTrigger>
          <TabsTrigger value="dispensed">Dispensed ({dispensedPrescriptions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : pendingPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No pending prescriptions</p>
              </CardContent>
            </Card>
          ) : (
            pendingPrescriptions.map((rx) => (
              <Card key={rx.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        {rx.medicationName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Patient: {rx.patient.name} (MRN: {rx.patient.mrn})
                      </p>
                    </div>
                    <Badge variant="secondary">{rx.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Dosage</Label>
                      <p className="font-medium">{rx.dosage}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Frequency</Label>
                      <p className="font-medium">{rx.frequency}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Duration</Label>
                      <p className="font-medium">{rx.duration}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prescribed By</Label>
                      <p className="font-medium">{rx.doctor.name}</p>
                    </div>
                  </div>

                  {rx.instructions && (
                    <div>
                      <Label className="text-muted-foreground">Instructions</Label>
                      <p className="text-sm mt-1">{rx.instructions}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(rx.createdAt).toLocaleString()}
                    </p>
                    <Button onClick={() => openDispenseDialog(rx)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Dispense
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="dispensed" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : dispensedPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No dispensed prescriptions</p>
              </CardContent>
            </Card>
          ) : (
            dispensedPrescriptions.map((rx) => (
              <Card key={rx.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        {rx.medicationName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Patient: {rx.patient.name} (MRN: {rx.patient.mrn})
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {rx.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Dosage</Label>
                      <p className="font-medium">{rx.dosage}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Frequency</Label>
                      <p className="font-medium">{rx.frequency}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Duration</Label>
                      <p className="font-medium">{rx.duration}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prescribed By</Label>
                      <p className="font-medium">{rx.doctor.name}</p>
                    </div>
                  </div>

                  {rx.dispensedBy && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <Label className="text-muted-foreground">Dispensed By</Label>
                      <p className="font-medium">{rx.dispensedBy.name}</p>
                      {rx.dispensedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(rx.dispensedAt).toLocaleString()}
                        </p>
                      )}
                      {rx.notes && (
                        <p className="text-sm mt-2">{rx.notes}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dispenseDialogOpen} onOpenChange={setDispenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispense Prescription</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="bg-accent p-4 rounded-lg space-y-2">
                <p><strong>Patient:</strong> {selectedPrescription.patient.name}</p>
                <p><strong>Medication:</strong> {selectedPrescription.medicationName}</p>
                <p><strong>Dosage:</strong> {selectedPrescription.dosage}</p>
                <p><strong>Frequency:</strong> {selectedPrescription.frequency}</p>
                <p><strong>Duration:</strong> {selectedPrescription.duration}</p>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about dispensing this prescription..."
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDispense} className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Dispense
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDispenseDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
