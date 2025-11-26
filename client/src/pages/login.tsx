import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Activity, Camera, Fingerprint, User, Lock } from "lucide-react";
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
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState<"facial" | "fingerprint">("facial");

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.fullName}!`,
      });
      setLocation("/dashboard");
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

  const handleBiometricAuth = (type: "facial" | "fingerprint") => {
    setBiometricType(type);
    setShowBiometric(true);
  };

  const closeBiometricDialog = () => {
    setShowBiometric(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Activity className="h-10 w-10" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Digital Doctors Assistant</CardTitle>
            <CardDescription className="mt-2">
              Sign in to access patient records and management
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or authenticate with biometrics
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleBiometricAuth("facial")}
              data-testid="button-facial-recognition"
            >
              <Camera className="h-4 w-4 mr-2" />
              Facial Scan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleBiometricAuth("fingerprint")}
              data-testid="button-fingerprint"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Fingerprint
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-md space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Default Credentials:</p>
            <div className="space-y-1 text-xs">
              <p className="font-mono">Admin: admin / adminpass</p>
              <p className="font-mono">Doctor: doctor1 / pass123</p>
              <p className="font-mono">Nurse: nurse1 / nursepass</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <div className="absolute inset-0 border-4 border-primary/50 rounded-lg animate-pulse" />
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

            <Button variant="outline" onClick={closeBiometricDialog} data-testid="button-cancel-biometric">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
