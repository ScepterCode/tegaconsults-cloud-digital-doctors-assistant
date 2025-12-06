import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, Receipt, FileText, TrendingUp, 
  Search, Eye, CreditCard, Calendar 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface DailyReport {
  date: string;
  totalCollected: number;
  paymentMethodsBreakdown: Record<string, number>;
  paymentsCount: number;
  newBills: number;
  outstandingBalance: number;
}

interface Bill {
  id: string;
  billNumber: string;
  patient: {
    id: string;
    name: string;
    mrn: string;
  };
  visitType: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  createdAt: string;
}

export default function BillingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const hospitalId = "5f98058e-9bd6-4c92-9f8f-13b58b4c36f9";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDailyReport(), fetchRecentBills()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReport = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/billing/reports/daily?hospital_id=${hospitalId}`
      );
      const data = await response.json();
      setDailyReport(data);
    } catch (error) {
      console.error("Failed to fetch daily report:", error);
    }
  };

  const fetchRecentBills = async () => {
    try {
      // This would need a new endpoint to get recent bills
      // For now, we'll leave it empty
      setRecentBills([]);
    } catch (error) {
      console.error("Failed to fetch recent bills:", error);
    }
  };

  const handleSearchPatient = async () => {
    if (!searchTerm) return;
    
    toast({
      title: "Search",
      description: "Patient search functionality coming soon"
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Payments</h1>
          <p className="text-muted-foreground mt-1">Manage patient billing and process payments</p>
        </div>
      </div>

      {/* Phase 1 Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Billing System - Phase 1</h3>
              <p className="text-blue-800 mt-1 text-sm">
                Backend API is fully functional with 61 pre-configured services. 
                Additional frontend pages (pricing management, bill details, payment processing) coming in Phase 2.
              </p>
              <div className="mt-3 space-y-1 text-sm text-blue-700">
                <p>✅ Service pricing configured (₦1,000 - ₦300,000)</p>
                <p>✅ Auto-charge API ready for department integration</p>
                <p>✅ Payment processing API functional</p>
                <p>✅ Financial reports API available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Statistics */}
      {dailyReport && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">₦{dailyReport.totalCollected.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Today's Collection</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Receipt className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{dailyReport.paymentsCount}</p>
                  <p className="text-xs text-muted-foreground">Payments Received</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{dailyReport.newBills}</p>
                  <p className="text-xs text-muted-foreground">New Bills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">₦{dailyReport.outstandingBalance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Methods Breakdown */}
      {dailyReport && Object.keys(dailyReport.paymentMethodsBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(dailyReport.paymentMethodsBreakdown).map(([method, amount]) => (
                <div key={method} className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground capitalize">{method.replace('_', ' ')}</p>
                  <p className="text-xl font-bold text-green-600">₦{amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Patient */}
      <Card>
        <CardHeader>
          <CardTitle>Find Patient Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, MRN, or bill number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearchPatient()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearchPatient}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Consultations</span>
                <span className="font-semibold">₦4,000 - ₦35,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Lab Tests</span>
                <span className="font-semibold">₦1,200 - ₦120,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ward Charges (per day)</span>
                <span className="font-semibold">₦3,000 - ₦90,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Procedures</span>
                <span className="font-semibold">₦2,000 - ₦300,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Admin Fees</span>
                <span className="font-semibold">₦500 - ₦7,500</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Total: 61 pre-configured services across 7 categories
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <div>
                  <p className="font-medium">Auto-Charge System</p>
                  <p className="text-xs text-muted-foreground">Charges automatically added from departments</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <div>
                  <p className="font-medium">Payment Processing</p>
                  <p className="text-xs text-muted-foreground">Cash, card, transfer, mobile money</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <div>
                  <p className="font-medium">Discount Management</p>
                  <p className="text-xs text-muted-foreground">Approval workflow based on amount</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <div>
                  <p className="font-medium">Financial Reports</p>
                  <p className="text-xs text-muted-foreground">Daily and monthly analytics</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <div>
                  <p className="font-medium">Complete Audit Trail</p>
                  <p className="text-xs text-muted-foreground">All transactions logged</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Using the Billing API</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            The backend API is ready. Here's how departments can integrate:
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">1. View Service Pricing</p>
              <code className="text-xs bg-white p-2 rounded block overflow-x-auto">
                GET /api/billing/pricing?hospital_id=HOSPITAL_ID
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">2. Add Charge (Auto-Charge)</p>
              <code className="text-xs bg-white p-2 rounded block overflow-x-auto">
                POST /api/billing/charges/add<br/>
                {`{ "patient_id": "P-001", "service_category": "consultation", "service_name": "General Consultation" }`}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                This automatically adds ₦7,500 to the patient's bill
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">3. Process Payment</p>
              <code className="text-xs bg-white p-2 rounded block overflow-x-auto">
                POST /api/billing/payments<br/>
                {`{ "bill_id": "BIL-2024-00001", "amount": 10000, "payment_method": "cash" }`}
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">4. View Daily Report</p>
              <code className="text-xs bg-white p-2 rounded block overflow-x-auto">
                GET /api/billing/reports/daily?hospital_id=HOSPITAL_ID
              </code>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Frontend pages for pricing management, bill details, and payment processing 
                will be added in Phase 2. The API is fully functional and ready for integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
