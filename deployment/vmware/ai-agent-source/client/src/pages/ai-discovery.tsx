import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, Brain, Scan, Key, ExternalLink, Download, Shield, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

interface DiscoveredAPI {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  authType: string;
  signupUrl?: string;
  documentationUrl?: string;
  category: string;
  confidence: number;
  keyFeatures: string[];
  autoCreationPossible: boolean;
}

interface ScanResult {
  credentials: Array<{
    source: string;
    apiId: string;
    keyType: string;
    keyValue: string;
    confidence: number;
    location: string;
    apiName?: string;
  }>;
  potentialAPIs: string[];
  recommendations: string[];
  securityWarnings: string[];
}

export default function AIDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [features, setFeatures] = useState('');
  const [useCase, setUseCase] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const { toast } = useToast();

  // API Discovery Mutation
  const discoverAPIsMutation = useMutation({
    mutationFn: async (params: { query: string; category?: string; features?: string[]; useCase?: string }) => {
      return apiRequest('/api/ai/discover-apis', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: () => {
      toast({
        title: "APIs Discovered",
        description: "AI has found relevant APIs for your needs",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/discovered-apis'] });
    },
    onError: (error) => {
      toast({
        title: "Discovery Failed",
        description: error instanceof Error ? error.message : "Failed to discover APIs",
        variant: "destructive",
      });
    },
  });

  // Credential Scanning Mutation
  const scanCredentialsMutation = useMutation({
    mutationFn: async (params: { environment: string; autoExtract: boolean }) => {
      return apiRequest('/api/ai/scan-credentials', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: () => {
      toast({
        title: "Credential Scan Complete",
        description: "AI has scanned for existing credentials",
      });
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan credentials",
        variant: "destructive",
      });
    },
  });

  // Account Creation Mutation
  const createAccountMutation = useMutation({
    mutationFn: async (apiId: string) => {
      return apiRequest(`/api/ai/create-account/${apiId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Account Creation Attempted",
        description: "AI has attempted to create an account for this API",
      });
    },
    onError: (error) => {
      toast({
        title: "Account Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    },
  });

  // Fetch discovered APIs
  const { data: discoveredAPIs } = useQuery({
    queryKey: ['/api/ai/discovered-apis'],
    retry: false,
  });

  // Fetch credential audit
  const { data: credentialAudit } = useQuery({
    queryKey: ['/api/ai/credential-audit'],
    retry: false,
  });

  const handleDiscoverAPIs = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a search query to discover APIs",
        variant: "destructive",
      });
      return;
    }

    const featuresArray = features ? features.split(',').map(f => f.trim()) : [];
    
    discoverAPIsMutation.mutate({
      query: searchQuery,
      category: category || undefined,
      features: featuresArray.length > 0 ? featuresArray : undefined,
      useCase: useCase || undefined,
    });
  };

  const handleScanCredentials = () => {
    scanCredentialsMutation.mutate({
      environment: selectedEnvironment,
      autoExtract: true,
    });
  };

  const handleCreateAccount = (apiId: string) => {
    createAccountMutation.mutate(apiId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Brain className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">AI-Powered API Discovery</h1>
      </div>

      <Tabs defaultValue="discover" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover APIs</TabsTrigger>
          <TabsTrigger value="scan">Scan Credentials</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>AI API Discovery</span>
              </CardTitle>
              <CardDescription>
                Use AI to discover APIs that match your requirements and automatically create accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-query">Search Query</Label>
                  <Input
                    id="search-query"
                    placeholder="e.g., payment processing, weather data, social media"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="payments">Payments</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="ai">AI/ML</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="cloud">Cloud Services</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="data">Data & Analytics</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="features">Required Features (comma-separated)</Label>
                <Input
                  id="features"
                  placeholder="e.g., REST API, webhooks, real-time data"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="use-case">Use Case Description</Label>
                <Textarea
                  id="use-case"
                  placeholder="Describe what you want to build or integrate..."
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleDiscoverAPIs}
                disabled={discoverAPIsMutation.isPending}
                className="w-full"
              >
                {discoverAPIsMutation.isPending ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    AI Discovering APIs...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Discover APIs with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scan className="h-5 w-5" />
                <span>Credential Scanner</span>
              </CardTitle>
              <CardDescription>
                Automatically scan and extract existing API credentials from your environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="environment">Scan Environment</Label>
                <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="browser">Browser Storage</SelectItem>
                    <SelectItem value="system">System Environment</SelectItem>
                    <SelectItem value="cloud">Cloud Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Security Note</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Credentials will be encrypted and stored securely. Only accessible by you.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleScanCredentials}
                disabled={scanCredentialsMutation.isPending}
                className="w-full"
              >
                {scanCredentialsMutation.isPending ? (
                  <>
                    <Scan className="h-4 w-4 mr-2 animate-spin" />
                    Scanning for Credentials...
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan & Extract Credentials
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid gap-4">
            {discoveredAPIs?.apis?.map((api: DiscoveredAPI) => (
              <Card key={api.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{api.name}</span>
                        <Badge variant={api.confidence > 80 ? 'default' : 'secondary'}>
                          {api.confidence}% match
                        </Badge>
                      </CardTitle>
                      <CardDescription>{api.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{api.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {api.keyFeatures?.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Key className="h-4 w-4" />
                    <span>Auth: {api.authType}</span>
                    {api.autoCreationPossible && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 dark:text-green-400 flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          Auto-creation possible
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {api.autoCreationPossible && (
                      <Button 
                        size="sm"
                        onClick={() => handleCreateAccount(api.id)}
                        disabled={createAccountMutation.isPending}
                      >
                        {createAccountMutation.isPending ? (
                          <>Creating...</>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-1" />
                            Auto Create Account
                          </>
                        )}
                      </Button>
                    )}
                    
                    {api.signupUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={api.signupUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Sign Up
                        </a>
                      </Button>
                    )}
                    
                    {api.documentationUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={api.documentationUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Docs
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {discoveredAPIs?.apis?.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No APIs Discovered Yet</h3>
                  <p className="text-muted-foreground">Use the AI Discovery tab to find APIs that match your needs.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{credentialAudit?.audit?.storedCredentials || 0}</p>
                    <p className="text-sm text-muted-foreground">Stored Credentials</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{credentialAudit?.audit?.activeCredentials || 0}</p>
                    <p className="text-sm text-muted-foreground">Active Credentials</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{credentialAudit?.audit?.securityIssues?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Security Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{credentialAudit?.audit?.duplicateCredentials || 0}</p>
                    <p className="text-sm text-muted-foreground">Duplicates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {credentialAudit?.audit?.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {credentialAudit.audit.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {credentialAudit?.audit?.securityIssues && credentialAudit.audit.securityIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600 dark:text-yellow-400">Security Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {credentialAudit.audit.securityIssues.map((issue: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span className="text-sm">{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}