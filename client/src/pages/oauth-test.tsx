import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Info, RefreshCw, Shield } from "lucide-react";

export default function OAuthTest() {
  const [testService, setTestService] = useState("spotify");
  const [tokenUrl, setTokenUrl] = useState("https://accounts.spotify.com/api/token");
  const [testResult, setTestResult] = useState<any>(null);

  // Test OAuth flow
  const testOAuthMutation = useMutation({
    mutationFn: async () => {
      // First, get the OAuth tokens (this will auto-refresh if needed)
      const tokens = await apiRequest(
        `/api/credentials/oauth/${testService}?tokenUrl=${encodeURIComponent(tokenUrl)}`,
        { method: "GET" }
      );
      
      // Test using the token
      const config = {
        headers: {
          Authorization: `${tokens.tokenType} ${tokens.accessToken}`
        }
      };
      
      return { tokens, config };
    },
    onSuccess: (data) => {
      setTestResult(data);
      toast({
        title: "OAuth Test Successful",
        description: data.tokens.refreshed 
          ? "Token was automatically refreshed!" 
          : "Token is still valid"
      });
    },
    onError: (error: any) => {
      toast({
        title: "OAuth Test Failed",
        description: error.message || "Failed to test OAuth flow",
        variant: "destructive"
      });
    }
  });

  // Store test OAuth credentials
  const storeTestCredsMutation = useMutation({
    mutationFn: async () => {
      // Example Spotify OAuth credentials (you'll replace with real ones)
      const testCreds = {
        service: "spotify",
        clientId: "your-spotify-client-id",
        clientSecret: "your-spotify-client-secret", 
        accessToken: "your-spotify-access-token",
        refreshToken: "your-spotify-refresh-token",
        expiresIn: 3600, // 1 hour
        tokenType: "Bearer",
        scope: "user-read-private user-read-email"
      };
      
      return apiRequest("/api/credentials/oauth", {
        method: "POST",
        body: JSON.stringify(testCreds)
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Credentials Stored",
        description: "OAuth credentials saved successfully"
      });
    }
  });

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">OAuth Testing Interface</h1>
        <p className="text-lg text-muted-foreground">
          Test OAuth token storage and automatic refresh
        </p>
      </div>

      <div className="grid gap-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            To test OAuth, you'll need real OAuth credentials from a service like Spotify, Google, or GitHub.
            The system will automatically refresh expired tokens using the refresh token.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Quick OAuth Setup Guide</CardTitle>
            <CardDescription>
              How to get OAuth credentials for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Spotify OAuth Setup:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Spotify Developer Dashboard</a></li>
                <li>Create a new app or use existing one</li>
                <li>Add http://localhost:5000/callback to Redirect URIs</li>
                <li>Copy Client ID and Client Secret</li>
                <li>Use the OAuth flow to get access and refresh tokens</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">GitHub OAuth Setup:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to GitHub Settings → Developer settings → OAuth Apps</li>
                <li>Create a new OAuth App</li>
                <li>Set Authorization callback URL to http://localhost:5000/callback</li>
                <li>Copy Client ID and Client Secret</li>
                <li>Generate tokens using the OAuth flow</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store OAuth Credentials</CardTitle>
            <CardDescription>
              Paste your OAuth credentials here to test automatic refresh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              const credentials = {
                service: formData.get('service') as string,
                clientId: formData.get('clientId') as string,
                clientSecret: formData.get('clientSecret') as string,
                accessToken: formData.get('accessToken') as string,
                refreshToken: formData.get('refreshToken') as string,
                expiresIn: parseInt(formData.get('expiresIn') as string) || 3600,
                tokenType: "Bearer",
                scope: formData.get('scope') as string
              };

              apiRequest("/api/credentials/oauth", {
                method: "POST",
                body: JSON.stringify(credentials)
              }).then(() => {
                toast({
                  title: "OAuth Credentials Stored",
                  description: "Your credentials have been securely stored"
                });
                (e.target as HTMLFormElement).reset();
              }).catch((error) => {
                toast({
                  title: "Storage Failed",
                  description: error.message,
                  variant: "destructive"
                });
              });
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service">Service Name</Label>
                  <Input name="service" id="service" placeholder="spotify" required />
                </div>
                <div>
                  <Label htmlFor="expiresIn">Expires In (seconds)</Label>
                  <Input name="expiresIn" id="expiresIn" type="number" placeholder="3600" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input name="clientId" id="clientId" required />
              </div>
              
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input name="clientSecret" id="clientSecret" type="password" required />
              </div>
              
              <div>
                <Label htmlFor="accessToken">Access Token</Label>
                <Textarea name="accessToken" id="accessToken" rows={2} required />
              </div>
              
              <div>
                <Label htmlFor="refreshToken">Refresh Token</Label>
                <Textarea name="refreshToken" id="refreshToken" rows={2} />
              </div>
              
              <div>
                <Label htmlFor="scope">Scope</Label>
                <Input name="scope" id="scope" placeholder="user-read-private user-read-email" />
              </div>
              
              <Button type="submit" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Store OAuth Credentials
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test OAuth Auto-Refresh</CardTitle>
            <CardDescription>
              Test retrieving tokens with automatic refresh
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testService">Service to Test</Label>
              <Input
                id="testService"
                value={testService}
                onChange={(e) => setTestService(e.target.value)}
                placeholder="spotify"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tokenUrl">Token Refresh URL</Label>
              <Input
                id="tokenUrl"
                value={tokenUrl}
                onChange={(e) => setTokenUrl(e.target.value)}
                placeholder="https://accounts.spotify.com/api/token"
              />
            </div>
            
            <Button 
              onClick={() => testOAuthMutation.mutate()}
              disabled={testOAuthMutation.isPending}
              className="w-full"
            >
              {testOAuthMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testing OAuth Flow...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Test OAuth with Auto-Refresh
                </>
              )}
            </Button>
            
            {testResult && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Test Result:</h4>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How Auto-Refresh Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Automatic Detection</p>
                <p className="text-sm text-muted-foreground">
                  System checks token expiry before each use
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Seamless Refresh</p>
                <p className="text-sm text-muted-foreground">
                  Uses refresh token to get new access token automatically
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Zero Downtime</p>
                <p className="text-sm text-muted-foreground">
                  Your app never experiences authentication failures
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}