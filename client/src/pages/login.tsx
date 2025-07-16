import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, AuthError } from "@/lib/auth";
import { Code } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await auth.login(username, password);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof AuthError ? error.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--github-dark)" }}>
      <Card className="w-full max-w-md github-surface border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Code className="github-blue" size={32} />
            <h1 className="text-2xl font-bold text-white">LocalReplit</h1>
          </div>
          <CardTitle className="text-white">Sign in to your account</CardTitle>
          <CardDescription className="github-gray">
            Enter your credentials to access your development environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="github-elevated border-0 text-white mt-1"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="github-elevated border-0 text-white mt-1"
                placeholder="Enter your password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ backgroundColor: "var(--github-blue)" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <span className="github-gray">Don't have an account? </span>
            <Link href="/register" className="github-blue hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
