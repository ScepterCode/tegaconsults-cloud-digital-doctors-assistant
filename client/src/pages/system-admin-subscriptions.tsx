import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, AlertTriangle, DollarSign, Building2, Search, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionWithHospital {
  subscription: {
    id: string;
    hospitalId: string;
    planType: string;
    status: string;
    daysRemaining: number;
    isExpired: boolean;
    needsRenewal: boolean;
    subscriptionEndDate?: string;
    trialEndDate?: string;
    amountPaid?: number;
  };
  hospital: {
    id: string;
    name: string;
    address?: string;
  };
  daysRemaining: number;
  needsRenewal: boolean;
}

interface Pricing {
  planType: string;
  price: number;
  formattedPrice: string;
  description: string;
}

export default function SystemAdminSubscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithHospital[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSubscriptions(), fetchPricing()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/subscriptions/all?admin_id=${user?.id}`,
        { headers: { "user-id": user?.id || "" } }
      );
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subscriptions",
        variant: "destructive"
      });
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/subscriptions/pricing");
      const data = await response.json();
      setPricing(data.pricing || []);
    } catch (error) {
      console.error("Failed to fetch pricing:", error);
    }
  };

  const handleUpdatePricing = async () => {
    if (!editingPlan || !newPrice) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/subscriptions/pricing/${editingPlan}?admin_id=${user?.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "user-id": user?.id || ""
          },
          body: JSON.stringify({
            plan_type: editingPlan,
            price: parseFloat(newPrice),
            description: newDescription
          })
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pricing updated successfully"
        });
        setPricingDialogOpen(false);
        setEditingPlan("");
        setNewPrice("");
        setNewDescription("");
        fetchPricing();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pricing",
        variant: "destructive"
      });
    }
  };

  const openPricingDialog = (plan: Pricing) => {
    setEditingPlan(plan.planType);
    setNewPrice(plan.price.toString());
    setNewDescription(plan.description);
    setPricingDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      trial: { variant: "secondary", icon: Clock, text: "Trial", className: "" },
      active: { variant: "default", icon: CheckCircle, text: "Active", className: "bg-green-500" },
      expired: { variant: "destructive", icon: AlertTriangle, text: "Expired", className: "" }
    };
    const config = variants[status] || variants.trial;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const filteredSubscriptions = subscriptions.filter(item =>
    item.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  const activeSubscriptions = filteredSubscriptions.filter(s => s.subscription.status === "active");
  const trialSubscriptions = filteredSubscriptions.filter(s => s.subscription.status === "trial");
  const expiredSubscriptions = filteredSubscriptions.filter(s => s.subscription.status === "expired");
  const needsRenewal = filteredSubscriptions.filter(s => s.needsRenewal);

  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.subscription.amountPaid || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all hospital subscriptions</p>
        </div>
        <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Manage Pricing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Subscription Pricing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plan Type</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={editingPlan}
                  onChange={(e) => {
                    const plan = pricing.find(p => p.planType === e.target.value);
                    if (plan) openPricingDialog(plan);
                  }}
                >
                  <option value="">Select a plan</option>
                  {pricing.map(p => (
                    <option key={p.planType} value={p.planType}>
                      {p.planType === "monthly" ? "Monthly Plan" : "Yearly Plan"}
                    </option>
                  ))}
                </select>
              </div>

              {editingPlan && (
                <>
                  <div>
                    <Label>Price (₦)</Label>
                    <Input
                      type="number"
                      placeholder="Enter price"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="Enter description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleUpdatePricing} className="w-full">
                    Update Pricing
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{subscriptions.length}</p>
              <p className="text-sm text-muted-foreground">Total Hospitals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{activeSubscriptions.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{trialSubscriptions.length}</p>
              <p className="text-sm text-muted-foreground">On Trial</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{expiredSubscriptions.length}</p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {pricing.map(plan => (
              <div key={plan.planType} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold capitalize">{plan.planType} Plan</p>
                  <p className="text-2xl font-bold text-green-600">{plan.formattedPrice}</p>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openPricingDialog(plan)}>
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search hospitals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Subscriptions Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({filteredSubscriptions.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeSubscriptions.length})</TabsTrigger>
          <TabsTrigger value="trial">Trial ({trialSubscriptions.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredSubscriptions.length})</TabsTrigger>
          <TabsTrigger value="renewal">Needs Renewal ({needsRenewal.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : filteredSubscriptions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No subscriptions found</p>
          ) : (
            filteredSubscriptions.map(item => (
              <SubscriptionCard key={item.subscription.id} item={item} getStatusBadge={getStatusBadge} />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeSubscriptions.map(item => (
            <SubscriptionCard key={item.subscription.id} item={item} getStatusBadge={getStatusBadge} />
          ))}
        </TabsContent>

        <TabsContent value="trial" className="space-y-4">
          {trialSubscriptions.map(item => (
            <SubscriptionCard key={item.subscription.id} item={item} getStatusBadge={getStatusBadge} />
          ))}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {expiredSubscriptions.map(item => (
            <SubscriptionCard key={item.subscription.id} item={item} getStatusBadge={getStatusBadge} />
          ))}
        </TabsContent>

        <TabsContent value="renewal" className="space-y-4">
          {needsRenewal.map(item => (
            <SubscriptionCard key={item.subscription.id} item={item} getStatusBadge={getStatusBadge} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubscriptionCard({ item, getStatusBadge }: { item: SubscriptionWithHospital; getStatusBadge: (status: string) => JSX.Element }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4 flex-1">
            <Building2 className="h-10 w-10 text-blue-500" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{item.hospital?.name || "Unknown Hospital"}</h3>
                {getStatusBadge(item.subscription.status)}
              </div>
              {item.hospital?.address && (
                <p className="text-sm text-muted-foreground mb-3">{item.hospital.address}</p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-medium capitalize">{item.subscription.planType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                  <p className="font-medium">{item.daysRemaining}</p>
                </div>
                {item.subscription.subscriptionEndDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="font-medium">
                      {new Date(item.subscription.subscriptionEndDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.subscription.amountPaid && (
                  <div>
                    <p className="text-xs text-muted-foreground">Last Payment</p>
                    <p className="font-medium text-green-600">
                      ₦{item.subscription.amountPaid.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {item.needsRenewal && (
                <div className="mt-3">
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Renewal Required
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
