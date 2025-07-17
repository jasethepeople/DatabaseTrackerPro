import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Key, 
  RefreshCw, 
  Shield, 
  Scan, 
  Trash2, 
  Plus,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

interface Credential {
  id: number;
  service: string;
  type: string;
  identifier: string;
  metadata?: any;
  autoDetected: boolean;
  useCount: number;
  lastUsed?: string;
  createdAt: string;
}

export default function CredentialManager() {
  const [selectedService, setSelectedService] = useState<string>("");
  const [oauthForm, setOauthForm] = useState({
    service: "",
    clientId: "",
    clientSecret: "",
    accessToken: "",
    refreshToken: "",
    expiresIn: "",
    tokenType: "Bearer",
    scope: ""
  });

  // Query credentials
  const { data: credentials = [], isLoading } = useQuery<Credential[]>({
    queryKey: ["/api/credentials", selectedService],
    queryFn: async () => {
      const params = selectedService ? `?service=${selectedService}` : "";
      return apiRequest(`/api/credentials${params}`);
    }
  });

  // Scan for credentials
  const scanMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/credentials/scan", {
        method: "POST"
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Scan Complete",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
    },
    onError: () => {
      toast({
        title: "Scan Failed",
        description: "Failed to scan for credentials",
        variant: "destructive"
      });
    }
  });

  // Store OAuth credentials
  const storeOAuthMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/credentials/oauth", {
        method: "POST",
        body: JSON.stringify({
          ...oauthForm,
          expiresIn: oauthForm.expiresIn ? parseInt(oauthForm.expiresIn) : undefined
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "OAuth Credentials Stored",
        description: "OAuth tokens have been securely stored"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      // Reset form
      setOauthForm({
        service: "",
        clientId: "",
        clientSecret: "",
        accessToken: "",
        refreshToken: "",
        expiresIn: "",
        tokenType: "Bearer",
        scope: ""
      });
    },
    onError: () => {
      toast({
        title: "Storage Failed",
        description: "Failed to store OAuth credentials",
        variant: "destructive"
      });
    }
  });

  // Get unique services from credentials
  const services = Array.from(new Set(credentials.map(c => c.service)));

  const getCredentialIcon = (type: string) => {
    if (type.includes("oauth")) return <Shield className="h-4 w-4" />;
    if (type.includes("api_key")) return <Key className="h-4 w-4" />;
    return <Key className="h-4 w-4" />;
  };

  const getCredentialBadgeVariant = (cred: Credential) => {
    if (cred.autoDetected) return "secondary";
    if (cred.useCount > 5) return "default";
    return "outline";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Universal Credential Manager</h1>
          <p className="text-lg text-muted-foreground">
            Manage OAuth tokens and API credentials with automatic renewal
          </p>
        </div>
        <Button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
        >
          <Scan className="mr-2 h-4 w-4" />
          {scanMutation.isPending ? "Scanning..." : "Scan for Credentials"}
        </Button>
      </div>

      <Tabs defaultValue="stored" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stored">Stored Credentials</TabsTrigger>
          <TabsTrigger value="oauth">Add OAuth Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="stored" className="space-y-6">
          {/* Service Filter */}
          <div className="flex items-center gap-4">
            <Label htmlFor="service-filter">Filter by Service:</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="service-filter" className="w-[200px]">
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Credentials List */}
          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading credentials...</p>
                </CardContent>
              </Card>
            ) : credentials.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Key className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No credentials found</p>
                  <Button 
                    className="mt-4"
                    onClick={() => scanMutation.mutate()}
                  >
                    Scan for Credentials
                  </Button>
                </CardContent>
              </Card>
            ) : (
              credentials.map(cred => (
                <Card key={cred.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getCredentialIcon(cred.type)}
                        {cred.service}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getCredentialBadgeVariant(cred)}>
                          {cred.autoDetected ? "Auto-detected" : "Manual"}
                        </Badge>
                        {cred.metadata?.expiresAt && (
                          <Badge 
                            variant={new Date(cred.metadata.expiresAt) > new Date() ? "default" : "destructive"}
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            {new Date(cred.metadata.expiresAt) > new Date() ? "Valid" : "Expired"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      Type: {cred.type} • Identifier: {cred.identifier}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Use Count:</span>
                        <span className="ml-2 font-medium">{cred.useCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Used:</span>
                        <span className="ml-2 font-medium">{formatDate(cred.lastUsed)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-2 font-medium">{formatDate(cred.createdAt)}</span>
                      </div>
                      {cred.metadata?.tokenType && (
                        <div>
                          <span className="text-muted-foreground">Token Type:</span>
                          <span className="ml-2 font-medium">{cred.metadata.tokenType}</span>
                        </div>
                      )}
                      {cred.metadata?.scope && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Scope:</span>
                          <span className="ml-2 font-medium">{cred.metadata.scope}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="oauth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add OAuth Credentials</CardTitle>
              <CardDescription>
                Store OAuth tokens with automatic refresh capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                storeOAuthMutation.mutate();
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service">Service Name</Label>
                    <Input
                      id="service"
                      placeholder="e.g., google, github, spotify"
                      value={oauthForm.service}
                      onChange={(e) => setOauthForm({...oauthForm, service: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenType">Token Type</Label>
                    <Select 
                      value={oauthForm.tokenType} 
                      onValueChange={(value) => setOauthForm({...oauthForm, tokenType: value})}
                    >
                      <SelectTrigger id="tokenType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bearer">Bearer</SelectItem>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="OAuth">OAuth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      placeholder="OAuth Client ID"
                      value={oauthForm.clientId}
                      onChange={(e) => setOauthForm({...oauthForm, clientId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      placeholder="OAuth Client Secret"
                      value={oauthForm.clientSecret}
                      onChange={(e) => setOauthForm({...oauthForm, clientSecret: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    placeholder="OAuth Access Token"
                    value={oauthForm.accessToken}
                    onChange={(e) => setOauthForm({...oauthForm, accessToken: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="refreshToken">Refresh Token (Optional)</Label>
                    <Input
                      id="refreshToken"
                      placeholder="OAuth Refresh Token"
                      value={oauthForm.refreshToken}
                      onChange={(e) => setOauthForm({...oauthForm, refreshToken: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiresIn">Expires In (seconds)</Label>
                    <Input
                      id="expiresIn"
                      type="number"
                      placeholder="3600"
                      value={oauthForm.expiresIn}
                      onChange={(e) => setOauthForm({...oauthForm, expiresIn: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Scope (Optional)</Label>
                  <Input
                    id="scope"
                    placeholder="e.g., read write delete"
                    value={oauthForm.scope}
                    onChange={(e) => setOauthForm({...oauthForm, scope: e.target.value})}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={storeOAuthMutation.isPending}
                  className="w-full"
                >
                  {storeOAuthMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Storing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Store OAuth Credentials
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OAuth Auto-Refresh</CardTitle>
              <CardDescription>
                When OAuth tokens expire, the system will automatically refresh them using the stored refresh token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Automatic Token Renewal</p>
                  <p className="text-sm text-muted-foreground">
                    Expired access tokens are automatically refreshed when needed
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Secure Storage</p>
                  <p className="text-sm text-muted-foreground">
                    All tokens are encrypted using AES-256-GCM encryption
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Universal Support</p>
                  <p className="text-sm text-muted-foreground">
                    Works with Google, GitHub, Microsoft, Spotify, and any OAuth 2.0 provider
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}