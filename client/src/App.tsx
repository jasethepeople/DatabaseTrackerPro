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
import SimpleChat from "./pages/simple-chat";
import CodeSnippets from "./pages/code-snippets";
import DemoCodeSnippets from "./pages/demo-code-snippets";
import AnthropicKeyDemo from "./pages/anthropic-key-demo";
import APIKeyGenerator from "./pages/api-key-generator";
import WorkingDashboard from "./pages/working-dashboard";
import SecurityFramework from "./pages/security-framework";
import CodeRefactoring from "./pages/code-refactoring";
import FileExplorer from "./pages/file-explorer";
import DebugDashboard from "./pages/debug-dashboard";
import AICodingAssistant from "./pages/ai-coding-assistant";
import DeploymentDashboard from "./pages/deployment-dashboard";
import VeniceAIChat from "./pages/venice-ai-chat";
import Multiplayer from "./pages/multiplayer";
import SecretsManager from "./pages/secrets-manager";
import DatabaseBrowser from "./pages/database-browser";
import VersionControl from "./pages/version-control";
import LocalDevEnvironment from "./pages/local-dev-environment";
import DownloadDeployment from "./pages/download-deployment";
import CredentialManager from "./pages/credential-manager";
import { Navigation } from "./components/navigation";
import NotFound from "./pages/not-found";

function Router() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        console.log("Token check:", token ? "Present" : "Missing");
        
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const currentUser = await response.json();
          console.log("Current user:", currentUser);
          setUser(currentUser);
        } else {
          console.log("Auth failed, removing token");
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("auth_token");
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
          <Route path="/chat" component={SimpleChat} />
          <Route path="/code-snippets" component={CodeSnippets} />
          <Route path="/demo-snippets" component={DemoCodeSnippets} />
          <Route path="/anthropic-demo" component={AnthropicKeyDemo} />
          <Route path="/api-keys" component={APIKeyGenerator} />
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
          <Route path="/deployment" component={DeploymentDashboard} />
          <Route path="/venice-ai" component={VeniceAIChat} />
          <Route path="/multiplayer" component={Multiplayer} />
          <Route path="/secrets" component={SecretsManager} />
          <Route path="/database" component={DatabaseBrowser} />
          <Route path="/version-control" component={VersionControl} />
          <Route path="/local-dev-environment" component={LocalDevEnvironment} />
          <Route path="/download" component={DownloadDeployment} />
          <Route path="/credentials" component={CredentialManager} />
          <Route path="/ide" component={Dashboard} />
          <Route path="/" component={WorkingDashboard} />
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
