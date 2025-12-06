import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertTriangle, CreditCard, Calendar, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  hospitalId: string;
  planType: string;
  status: string;
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  amountPaid?: number;
  daysRemaining: number;
  isExpired: boolean;
  needsRenewal: boolean;
}

interface Pricing {
  planType: string;
  price: number;
  currency: string;
  description: string;
  formattedPrice: string;
}

interface Payment {
  id: string;
  amount: number;
  formattedAmount: string;
  paymentMethod?: string;
  paymentReference?: string;
  status: string;
  paymentDate: string;
  paidBy?: {
    name: string;
    role: string;
  };
}

export default function HospitalSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  // For demo, use actual hospital ID - in production, get from user's hospital
  const hospitalId = "5f98058e-9bd6-4c92-9f8f-13b58b4c36f9";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSubscription(),
        fetchPricing(),
        fetchPaymentHistory()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/subscriptions/hospital/${hospitalId}`,
        { headers: { "user-id": user?.id || "" } }
      );
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
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

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/subscriptions/payment-history/${hospitalId}?user_id=${user?.id}`,
        { headers: { "user-id": user?.id || "" } }
      );
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !paymentReference) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/subscriptions/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": user?.id || ""
        },
        body: JSON.stringify({
          hospital_id: hospitalId,
          plan_type: selectedPlan,
          payment_reference: paymentReference,
          payment_method: paymentMethod
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscription activated successfully!"
        });
        setSubscribeDialogOpen(false);
        setPaymentReference("");
        fetchData();
      } else {
        throw new Error("Subscription failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate subscription",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      trial: { variant: "secondary", icon: Clock, text: "Trial Period" },
      active: { variant: "default", icon: CheckCircle, text: "Active", className: "bg-green-500" },
      expired: { variant: "destructive", icon: AlertTriangle, text: "Expired" }
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center py-8">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground mt-1">Manage your hospital's subscription plan</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Your subscription status and details</CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.needsRenewal && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription expires in {subscription.daysRemaining} days. Please renew to avoid service interruption.
                </AlertDescription>
              </Alert>
            )}

            {subscription.isExpired && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription has expired. Please subscribe to continue using the service.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Plan Type</p>
                <p className="text-lg font-semibold capitalize">{subscription.planType}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-lg font-semibold">{subscription.daysRemaining}</p>
              </div>

              {subscription.subscriptionEndDate && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Expires On</p>
                  <p className="text-lg font-semibold">
                    {new Date(subscription.subscriptionEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription.trialEndDate && subscription.status === "trial" && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Trial Ends</p>
                  <p className="text-lg font-semibold">
                    {new Date(subscription.trialEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription.amountPaid && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Payment</p>
                  <p className="text-lg font-semibold">₦{subscription.amountPaid.toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {pricing.map((plan) => (
            <Card key={plan.planType} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {plan.planType === "monthly" ? "Monthly Plan" : "Yearly Plan"}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-4xl font-bold">{plan.formattedPrice}</p>
                  <p className="text-muted-foreground">
                    per {plan.planType === "monthly" ? "month" : "year"}
                  </p>
                </div>

                {plan.planType === "yearly" && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Save ₦400,000 annually
                  </Badge>
                )}

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited users
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    AI Clinical Assistant
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Health Chatbot
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Complete medical records
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    24/7 Support
                  </li>
                </ul>

                <Dialog open={subscribeDialogOpen && selectedPlan === plan.planType} onOpenChange={(open) => {
                  setSubscribeDialogOpen(open);
                  if (open) setSelectedPlan(plan.planType);
                }}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={() => setSelectedPlan(plan.planType)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Subscribe Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Subscribe to {plan.planType === "monthly" ? "Monthly" : "Yearly"} Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-accent rounded-lg">
                        <p className="text-sm text-muted-foreground">Amount to Pay</p>
                        <p className="text-2xl font-bold">{plan.formattedPrice}</p>
                      </div>

                      <div>
                        <Label>Payment Method</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="card">Card Payment</option>
                          <option value="ussd">USSD</option>
                        </select>
                      </div>

                      <div>
                        <Label>Payment Reference / Transaction ID</Label>
                        <Input
                          placeholder="Enter payment reference"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the transaction reference from your payment
                        </p>
                      </div>

                      <Alert>
                        <AlertDescription>
                          Please make payment to our bank account and enter the transaction reference above.
                        </AlertDescription>
                      </Alert>

                      <Button onClick={handleSubscribe} className="w-full">
                        Confirm Subscription
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{payment.formattedAmount}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentMethod}
                    </p>
                    {payment.paymentReference && (
                      <p className="text-xs text-muted-foreground">Ref: {payment.paymentReference}</p>
                    )}
                  </div>
                  <Badge variant={payment.status === "completed" ? "default" : "secondary"} className={payment.status === "completed" ? "bg-green-500" : ""}>
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
