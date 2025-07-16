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
import EnvironmentSnapshots from "./pages/environment-snapshots";
import IntelligentSuggestions from "./pages/intelligent-suggestions";
import AIChat from "./pages/ai-chat";
import CodeSnippets from "./pages/code-snippets";
import DemoCodeSnippets from "./pages/demo-code-snippets";
import AnthropicKeyDemo from "./pages/anthropic-key-demo";
import MainDashboard from "./pages/main-dashboard";
import SecurityFramework from "./pages/security-framework";
import CodeRefactoring from "./pages/code-refactoring";
import FileExplorer from "./pages/file-explorer";
import DebugDashboard from "./pages/debug-dashboard";
import AICodingAssistant from "./pages/ai-coding-assistant";
import { Navigation } from "./components/navigation";
import NotFound from "./pages/not-found";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="pt-16">
        <Switch>
          <Route path="/chat" component={AIChat} />
          <Route path="/code-snippets" component={CodeSnippets} />
          <Route path="/demo-snippets" component={DemoCodeSnippets} />
          <Route path="/anthropic-demo" component={AnthropicKeyDemo} />
          <Route path="/data" component={DataDashboard} />
          <Route path="/ai-discovery" component={AIDiscovery} />
          <Route path="/autonomous-learning" component={AutonomousLearning} />
          <Route path="/testing" component={TestingDashboard} />
          <Route path="/snapshots" component={EnvironmentSnapshots} />
          <Route path="/intelligent-suggestions" component={IntelligentSuggestions} />
          <Route path="/ai-coding-assistant" component={AICodingAssistant} />
          <Route path="/security-framework" component={SecurityFramework} />
          <Route path="/code-refactoring" component={CodeRefactoring} />
          <Route path="/file-explorer" component={FileExplorer} />
          <Route path="/debug-dashboard" component={DebugDashboard} />
          <Route path="/ide" component={Dashboard} />
          <Route path="/" component={MainDashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
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
