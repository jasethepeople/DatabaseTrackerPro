import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkingDashboard() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    setToken(storedToken);
    
    if (storedToken) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error("Auth check failed:", err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Agent System Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Welcome to your development environment
          </p>
        </div>

        {/* Debug Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>User:</strong> {user ? user.username : "Not loaded"}</p>
              <p><strong>Token:</strong> {token ? "Present" : "Missing"}</p>
              <p><strong>Server:</strong> Running on port 5000</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Test the AI chat functionality
              </p>
              <Link href="/chat">
                <Button className="w-full">Open Chat</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Code Snippets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Generate and manage code snippets
              </p>
              <Link href="/code-snippets">
                <Button className="w-full">View Snippets</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Discover and integrate APIs
              </p>
              <Link href="/ai-discovery">
                <Button className="w-full">Explore APIs</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Run system tests and validation
              </p>
              <Link href="/testing">
                <Button className="w-full">Run Tests</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Framework</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Advanced security tools and analysis
              </p>
              <Link href="/security-framework">
                <Button className="w-full">Security Tools</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Venice AI Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Uncensored AI code generation with Venice
              </p>
              <Link href="/venice-ai">
                <Button className="w-full">Generate Code</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Backup and restore system state
              </p>
              <Link href="/snapshots">
                <Button className="w-full">Manage Snapshots</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("auth_token");
                  window.location.href = "/login";
                }}
              >
                Logout
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Current token:", localStorage.getItem("auth_token"));
                  console.log("Current user:", user);
                }}
              >
                Debug Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}