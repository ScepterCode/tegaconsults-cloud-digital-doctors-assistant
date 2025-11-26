import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Fingerprint, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Patient } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = patients?.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.nin.toLowerCase().includes(query) ||
      patient.firstName.toLowerCase().includes(query) ||
      patient.lastName.toLowerCase().includes(query)
    );
  }) || [];

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleSearch = () => {
    // Search is real-time via state, just for UI feedback
  };

  const handleClear = () => {
    setSearchQuery("");
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
          <Button 
            onClick={handleLogout}
            variant="destructive"
            data-testid="button-logout"
          >
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
              <div className="flex gap-3 flex-wrap items-center">
                <Input
                  placeholder="Search by NIN or name (e.g. NIN123)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-patient-search"
                />
                <Button 
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-search"
                >
                  Search
                </Button>
                <Button 
                  onClick={handleClear}
                  variant="outline"
                  data-testid="button-clear"
                >
                  Clear
                </Button>
                <span className="text-sm text-gray-600">
                  Tip: you can enter full or partial NIN or name.
                </span>
              </div>
            </Card>
          </div>

          {/* Patient Records Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 text-gray-600">📋</div>
              <h2 className="text-2xl font-bold text-gray-900">Patient Records</h2>
            </div>
            
            <div className="text-sm text-gray-700 font-semibold">
              Total Patients: <span data-testid="text-total-patients">{patients?.length || 0}</span>
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
                        <th className="px-6 py-3 text-left text-sm font-semibold">Symptoms</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">BP</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Temp (°C)</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Fingerprint ID</th>
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
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {patient.allergies || "—"}
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
                            {patient.fingerprintData ? "✓" : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    {searchQuery ? "No patients found matching your search." : "No patients registered yet."}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
