import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Camera, Fingerprint, User, Lock, BarChart3, Brain, Shield, Zap, FileText, BookOpen } from "lucide-react";
import logoUrl from "@assets/DDA LOGO 2_1764200378521.jpeg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getRoleBasedDashboard } from "@/lib/navigation";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const features = [
  {
    icon: Fingerprint,
    title: "Biometric Authentication",
    description: "Secure access with fingerprint and facial recognition technology",
  },
  {
    icon: Brain,
    title: "AI Diagnosis",
    description: "Predictive diagnosis powered by advanced AI algorithms",
  },
  {
    icon: BarChart3,
    title: "Result Analysis",
    description: "Intelligent analysis of medical test results and lab reports",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure access control for doctors, nurses, and administrators",
  },
  {
    icon: FileText,
    title: "Digital Records",
    description: "Say goodbye to hard copy files with secure digital storage",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Instant access to patient information and medical history",
  },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [authMethod, setAuthMethod] = useState<"credentials" | "nin" | "facial" | "fingerprint">("credentials");
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState<"facial" | "fingerprint">("facial");
  const [nin, setNin] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      authMethod: "credentials",
      username: "",
      password: "",
    } as any,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Login successful! User data:", data.user);
      console.log("User role:", data.user.role);
      login(data.user);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.fullName}!`,
      });
      // Redirect based on user role
      const dashboardRoute = getRoleBasedDashboard(data.user.role);
      console.log("Calculated dashboard route:", dashboardRoute);
      setLocation(dashboardRoute);
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  const handleNINLogin = () => {
    if (!nin.trim()) {
      toast({
        title: "NIN Required",
        description: "Please enter your NIN to continue",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({
      authMethod: "nin",
      nin: nin,
    } as any);
  };

  const handleBiometricAuth = (type: "facial" | "fingerprint") => {
    setBiometricType(type);
    setShowBiometric(true);
  };

  const handleBiometricCapture = (type: "facial" | "fingerprint") => {
    const demoData = `${type}_${Date.now()}_captured`;
    loginMutation.mutate({
      authMethod: type,
      ...(type === "facial" ? { facialData: demoData } : { fingerprintData: demoData }),
    } as any);
    setShowBiometric(false);
  };

  const closeBiometricDialog = () => {
    setShowBiometric(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-blue-50 to-white">
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-8 pb-12">
        {/* Logo and Title */}
        <div className="text-center mb-8 space-y-4">
          <img src={logoUrl} alt="Digital Doctors Assistant" className="mx-auto h-32 w-auto object-contain" data-testid="img-dda-logo" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Digital Doctors Assistant
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Revolutionary healthcare management system with biometric authentication, AI-powered diagnostics, and secure patient record management.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 mb-16">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8"
            onClick={() => window.location.href = "/register"}
            data-testid="button-get-started"
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8"
            onClick={() => setShowSignIn(true)}
            data-testid="button-sign-in"
          >
            Sign In
          </Button>
        </div>

        {/* Features Grid */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-sm hover-elevate">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sign In Modal */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
            <DialogDescription>
              Access your account with secure authentication methods
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {authMethod === "credentials" && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="Enter username"
                              className="pl-10"
                              data-testid="input-username"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter password"
                              className="pl-10"
                              data-testid="input-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="text-center text-sm">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-blue-600 hover:text-blue-700"
                      onClick={() => setLocation("/forgot-password")}
                      data-testid="link-forgot-password"
                    >
                      Forgot Password?
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {authMethod === "nin" && (
              <div className="space-y-4">
                <div>
                  <Label>National Identification Number (NIN)</Label>
                  <Input
                    value={nin}
                    onChange={(e) => setNin(e.target.value)}
                    placeholder="Enter your NIN"
                    data-testid="input-nin"
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleNINLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                  data-testid="button-nin-login"
                >
                  {loginMutation.isPending ? "Verifying NIN..." : "Verify NIN"}
                </Button>
              </div>
            )}

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  More options
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={authMethod === "credentials" ? "default" : "outline"}
                onClick={() => setAuthMethod("credentials")}
                size="sm"
                data-testid="button-auth-credentials"
              >
                <User className="h-3 w-3 mr-1" />
                Username
              </Button>
              <Button
                type="button"
                variant={authMethod === "nin" ? "default" : "outline"}
                onClick={() => setAuthMethod("nin")}
                size="sm"
                data-testid="button-auth-nin"
              >
                <Lock className="h-3 w-3 mr-1" />
                NIN
              </Button>
              <Button
                type="button"
                variant={authMethod === "facial" ? "default" : "outline"}
                onClick={() => handleBiometricAuth("facial")}
                size="sm"
                data-testid="button-facial-recognition"
              >
                <Camera className="h-3 w-3 mr-1" />
                Face
              </Button>
              <Button
                type="button"
                variant={authMethod === "fingerprint" ? "default" : "outline"}
                onClick={() => handleBiometricAuth("fingerprint")}
                size="sm"
                data-testid="button-fingerprint"
              >
                <Fingerprint className="h-3 w-3 mr-1" />
                Fingerprint
              </Button>
            </div>

            <div className="bg-muted p-3 rounded-md space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Demo Credentials:</p>
              <div className="space-y-1 text-xs font-mono">
                <p>doctor1 / pass123</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Biometric Dialog */}
      <Dialog open={showBiometric} onOpenChange={setShowBiometric}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {biometricType === "facial" ? "Facial Recognition" : "Fingerprint Authentication"}
            </DialogTitle>
            <DialogDescription>
              {biometricType === "facial"
                ? "Position your face within the frame for authentication"
                : "Place your finger on the scanner"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {biometricType === "facial" ? (
              <div className="relative w-full max-w-md aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Camera className="h-24 w-24 text-muted-foreground" />
                <div className="absolute inset-0 border-4 border-blue-600/50 rounded-lg animate-pulse" />
              </div>
            ) : (
              <div className="relative w-48 h-48 bg-muted rounded-full flex items-center justify-center">
                <Fingerprint className="h-32 w-32 text-muted-foreground animate-pulse" />
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Scanning...</p>
              <p className="text-xs text-muted-foreground">
                This is a demonstration interface. Biometric hardware integration required.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleBiometricCapture(biometricType)}
                data-testid="button-complete-biometric"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Authenticate"}
              </Button>
              <Button variant="outline" onClick={closeBiometricDialog} data-testid="button-cancel-biometric">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
