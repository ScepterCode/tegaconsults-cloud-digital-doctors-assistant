import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Patient } from "@shared/schema";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = patients?.filter(patient =>
    `${patient.firstName} ${patient.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getVitalStatus = (patient: Patient) => {
    if (!patient.bloodPressureSystolic) return "No vitals";
    const systolic = patient.bloodPressureSystolic;
    if (systolic > 140) return { label: "High BP", color: "bg-destructive text-destructive-foreground" };
    if (systolic < 90) return { label: "Low BP", color: "bg-warning text-warning-foreground" };
    return { label: "Normal", color: "bg-success text-success-foreground" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-patients-title">Patients</h1>
          <p className="text-muted-foreground mt-1">
            Browse and search patient records
          </p>
        </div>
        <Button asChild data-testid="button-add-patient">
          <Link href="/patients/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Patient
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, MRN, or NIN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-patients"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover-elevate active-elevate-2" data-testid={`card-patient-${patient.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getInitials(patient.firstName, patient.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      MRN: {patient.mrn}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium" data-testid={`text-age-${patient.id}`}>{patient.age} years</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="font-medium capitalize" data-testid={`text-gender-${patient.id}`}>{patient.gender}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Blood Group:</span>
                    <Badge variant="outline" data-testid={`badge-blood-group-${patient.id}`}>{patient.bloodGroup}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Genotype:</span>
                    <Badge variant="outline" data-testid={`badge-genotype-${patient.id}`}>{patient.genotype}</Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <Badge className={getVitalStatus(patient).color} data-testid={`badge-vital-status-${patient.id}`}>
                    {getVitalStatus(patient).label}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild data-testid={`button-view-patient-${patient.id}`}>
                    <Link href={`/patients/${patient.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium">No patients found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? "Try adjusting your search" : "Start by adding your first patient"}
            </p>
            {!searchTerm && (
              <Button asChild className="mt-4" data-testid="button-add-first-patient">
                <Link href="/patients/new">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Patient
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
