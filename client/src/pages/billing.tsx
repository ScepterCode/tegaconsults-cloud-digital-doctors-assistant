import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subscription } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const adminUserId = isAdmin ? user?.id : user?.hospitalAdminId;
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "paystack" | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription", adminUserId],
    enabled: !!adminUserId,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (data: { billingCycle: "monthly" | "yearly"; paymentMethod: "bank" | "paystack" }) => {
      const res = await apiRequest("POST", `/api/subscription/${adminUserId}/upgrade`, {
        billingCycle: data.billingCycle,
        paymentMethod: data.paymentMethod,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You've upgraded to Hospital plan! Your entire team gets access.",
      });
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upgrade subscription",
        variant: "destructive",
      });
    },
  });

  const handleCopyBank = () => {
    navigator.clipboard.writeText("1228732577");
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handlePaystackPayment = () => {
    if (selectedBilling === "monthly") {
      window.location.href = `https://paystack.com/pay/hospital-plan-monthly?reference=${adminUserId}`;
    } else {
      window.location.href = `https://paystack.com/pay/hospital-plan-yearly?reference=${adminUserId}`;
    }
  };

  const handleBankPayment = () => {
    upgradeMutation.mutate({ billingCycle: selectedBilling!, paymentMethod: "bank" });
    setPaymentDialog(false);
  };

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/subscription/${adminUserId}/cancel`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your Hospital subscription has been cancelled.",
      });
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const isTrialActive = subscription?.status === "trial";
  const isHospitalActive = subscription?.status === "active" && subscription?.tier === "hospital";

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Appointment Booking</p>
        </div>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Appointment Fee</h3>
                <p className="text-blue-800 mt-1">
                  Each appointment booking costs <span className="font-bold">₦1,000</span>
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-800">
                Your hospital admin manages the hospital subscription. You have access to all features through your hospital's plan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDaysLeft = () => {
    if (!subscription?.trialEndDate) return 0;
    const now = new Date();
    const endDate = new Date(subscription.trialEndDate);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const daysLeft = getDaysLeft();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription plan and billing settings
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading subscription info...</p>
        </div>
      ) : (
        <>
          {/* Current Plan Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {isHospitalActive ? "Hospital Plan" : "Free Trial"}
                    </h3>
                    <Badge variant={isHospitalActive ? "default" : "secondary"}>
                      {isHospitalActive ? "Active" : "Trial"}
                    </Badge>
                  </div>
                  {isTrialActive && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {daysLeft} days remaining in your free trial
                    </p>
                  )}
                  {isHospitalActive && subscription?.billingCycle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {subscription.billingCycle === "monthly" ? "₦15,000 per month" : "₦100,000 per year"} - All staff get access
                    </p>
                  )}
                </div>
              </div>

              {isHospitalActive && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Warning</h4>
                      <p className="text-sm text-red-800 mt-1">
                        If you cancel your subscription, all hospital records will be lost permanently.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hospital Subscription Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle>Monthly</CardTitle>
                  <CardDescription>Perfect for ongoing access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold">₦15,000</span>
                    <p className="text-sm text-muted-foreground mt-1">per month</p>
                  </div>

                  <ul className="space-y-3">
                    {[
                      "All staff get full access",
                      "All AI features",
                      "Advanced diagnostics",
                      "Lab analysis",
                      "Appointment management",
                      "Email support",
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedBilling("monthly");
                      setPaymentDialog(true);
                    }}
                    disabled={isHospitalActive}
                    data-testid="button-upgrade-monthly"
                  >
                    {isHospitalActive ? "Current Plan" : "Upgrade Now"}
                  </Button>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className="relative border-2 border-blue-600">
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-md text-sm font-semibold">
                  Save 33%
                </div>
                <CardHeader>
                  <CardTitle>Yearly</CardTitle>
                  <CardDescription>Best value - Save 2 months</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold">₦100,000</span>
                    <p className="text-sm text-muted-foreground mt-1">per year</p>
                  </div>

                  <ul className="space-y-3">
                    {[
                      "All staff get full access",
                      "All AI features",
                      "Advanced diagnostics",
                      "Lab analysis",
                      "Appointment management",
                      "Priority support",
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedBilling("yearly");
                      setPaymentDialog(true);
                    }}
                    disabled={isHospitalActive}
                    data-testid="button-upgrade-yearly"
                  >
                    {isHospitalActive ? "Current Plan" : "Upgrade Now"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trial Info */}
          {isTrialActive && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Free Trial Information</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-800">
                <p>
                  You're currently on a free 30-day trial with access to all Pro features. After your trial
                  ends, you'll need to upgrade to continue using advanced features like AI diagnostics, lab analysis, and more.
                </p>
                <p className="mt-4 font-semibold">
                  Trial ends on: {subscription?.trialEndDate ? new Date(subscription.trialEndDate).toLocaleDateString() : "N/A"}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Payment Method Selection Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>
              {selectedBilling === "monthly"
                ? "₦15,000 per month - All staff get full access"
                : "₦100,000 per year - All staff get full access"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Bank Transfer Option */}
            <div className="border rounded-lg p-4 space-y-3 hover-elevate cursor-pointer" onClick={() => setPaymentMethod("bank")}>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="payment"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={() => setPaymentMethod("bank")}
                  className="mt-1"
                  data-testid="radio-bank-transfer"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Bank Transfer</h3>
                  <p className="text-xs text-muted-foreground mt-1">Transfer to Zenith Bank</p>
                </div>
              </div>
            </div>

            {/* Bank Details - Show when selected */}
            {paymentMethod === "bank" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Bank</p>
                  <p className="text-sm font-semibold">Zenith Bank</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Account Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono font-bold">1228732577</p>
                    <button
                      onClick={handleCopyBank}
                      className="p-1 hover-elevate rounded"
                      data-testid="button-copy-account"
                    >
                      {copiedBank ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-xs text-blue-700 bg-blue-100 rounded p-2">
                  Please note your reference ID for verification after transfer
                </div>
              </div>
            )}

            {/* Paystack Option */}
            <div className="border rounded-lg p-4 space-y-3 hover-elevate cursor-pointer" onClick={() => setPaymentMethod("paystack")}>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="payment"
                  value="paystack"
                  checked={paymentMethod === "paystack"}
                  onChange={() => setPaymentMethod("paystack")}
                  className="mt-1"
                  data-testid="radio-paystack"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Paystack</h3>
                  <p className="text-xs text-muted-foreground mt-1">Online card payment</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentDialog(false);
                  setPaymentMethod(null);
                }}
                data-testid="button-cancel-payment"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (paymentMethod === "bank") {
                    handleBankPayment();
                  } else if (paymentMethod === "paystack") {
                    handlePaystackPayment();
                  }
                }}
                disabled={!paymentMethod || upgradeMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-proceed-payment"
              >
                {upgradeMutation.isPending ? "Processing..." : "Proceed"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
