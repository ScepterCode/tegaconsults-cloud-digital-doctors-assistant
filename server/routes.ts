// ← CHANGE ONLY THIS PART — REST OF YOUR FILE STAYS THE SAME
const loginMutation = useMutation({
  mutationFn: async (data: LoginCredentials) => {
    // CORRECT PATH FOR YOUR EXPRESS BACKEND
    const res = await apiRequest("POST", "/api/auth/login", data);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Login failed");
    }
    return await res.json();
  },
  onSuccess: (data) => {
    login(data.user);
    toast({
      title: "Login Successful",
      description: `Welcome back, ${data.user.fullName || data.user.username}!`,
    });
    setLocation("/dashboard");
  },
  onError: (error: Error) => {
    toast({
      title: "Login Failed",
      description: error.message || "Invalid credentials",
      variant: "destructive",
    });
  },
});
