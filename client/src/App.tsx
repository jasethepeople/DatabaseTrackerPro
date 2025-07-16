import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { auth } from "./lib/auth";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import DataDashboard from "./pages/data-dashboard";
import AIDiscovery from "./pages/ai-discovery";
import AutonomousLearning from "./pages/autonomous-learning";
import TestingDashboard from "./pages/testing-dashboard";

function Router() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        console.log("Current user:", currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--github-dark)" }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/data" component={DataDashboard} />
      <Route path="/ai-discovery" component={AIDiscovery} />
      <Route path="/autonomous-learning" component={AutonomousLearning} />
      <Route path="/testing" component={TestingDashboard} />
      <Route path="/" component={Dashboard} />
      <Route component={Dashboard} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
