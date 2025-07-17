import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Cloud, 
  Settings, 
  Search, 
  Key, 
  Shield, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  Database,
  Server,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  platform: string;
  url?: string;
  logs: string[];
  metadata: any;
  timestamp: string;
  duration: number;
}

interface DiscoveredAPI {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  documentation: string;
  pricing: string;
  authType: string;
  endpoint: string;
  status: 'active' | 'inactive';
  rating: number;
  popularity: number;
}

interface CredentialScan {
  source: string;
  credentials: Array<{
    platform: string;
    type: string;
    status: 'valid' | 'invalid' | 'expired';
    lastChecked: string;
    scope: string[];
  }>;
  securityScore: number;
  recommendations: string[];
}

export default function DeploymentDashboard() {
  const [activeTab, setActiveTab] = useState('deploy');
  const [selectedPlatform, setSelectedPlatform] = useState('heroku');
  const [deploymentConfig, setDeploymentConfig] = useState({
    appName: '',
    buildpack: 'heroku/nodejs',
    environment: {},
    region: 'us-east-1'
  });
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiCategory, setApiCategory] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deployments
  const { data: deploymentsData, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['/api/deployment/list'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deployment/list');
      return response.json();
    },
  });
  
  const deployments = deploymentsData?.deployments || [];

  // Fetch discovered APIs
  const { data: discoveredAPIs = [], isLoading: apisLoading } = useQuery({
    queryKey: ['/api/ai/discovered-apis'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai/discovered-apis');
      const data = await response.json();
      return data.apis || [];
    },
  });

  // Fetch credential audit
  const { data: credentialAudit, isLoading: credentialsLoading } = useQuery({
    queryKey: ['/api/ai/credential-audit'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai/credential-audit');
      const data = await response.json();
      return data.audit || {};
    },
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async (data: { platform: string; config: any }) => {
      const response = await apiRequest('POST', `/api/deployment/${data.platform}`, data.config);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: `Deployment to ${selectedPlatform} completed successfully!` });
      queryClient.invalidateQueries({ queryKey: ['/api/deployment/list'] });
      setIsDeploying(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Deployment failed' });
      setIsDeploying(false);
    },
  });

  // API discovery mutation
  const discoverAPIsMutation = useMutation({
    mutationFn: async (data: { query: string; category: string; useCase: string }) => {
      const response = await apiRequest('POST', '/api/ai/discover-apis', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'APIs discovered successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/discovered-apis'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'API discovery failed' });
    },
  });

  // Credential scan mutation
  const credentialScanMutation = useMutation({
    mutationFn: async (data: { environment: string; autoExtract: boolean }) => {
      const response = await apiRequest('POST', '/api/ai/scan-credentials', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Credential scan completed successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/credential-audit'] });
      setIsScanning(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Credential scan failed' });
      setIsScanning(false);
    },
  });

  const handleDeploy = async () => {
    setIsDeploying(true);
    await deployMutation.mutateAsync({
      platform: selectedPlatform,
      config: deploymentConfig
    });
  };

  const handleAPIDiscovery = async () => {
    await discoverAPIsMutation.mutateAsync({
      query: apiSearchQuery,
      category: apiCategory,
      useCase: 'development'
    });
  };

  const handleCredentialScan = async () => {
    setIsScanning(true);
    await credentialScanMutation.mutateAsync({
      environment: 'all',
      autoExtract: true
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: 'Copied to clipboard' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deployment Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Deploy applications, discover APIs, and manage credentials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{deployments.length} deployments</Badge>
          <Badge variant="outline">{discoveredAPIs.length} APIs</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deploy" className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="apis" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            API Discovery
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Deploy Application
                </CardTitle>
                <CardDescription>
                  Deploy your application to multiple platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heroku">Heroku</SelectItem>
                      <SelectItem value="vercel">Vercel</SelectItem>
                      <SelectItem value="aws">AWS Lambda</SelectItem>
                      <SelectItem value="docker">Docker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    placeholder="my-awesome-app"
                    value={deploymentConfig.appName}
                    onChange={(e) => setDeploymentConfig({...deploymentConfig, appName: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select value={deploymentConfig.region} onValueChange={(value) => setDeploymentConfig({...deploymentConfig, region: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                      <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleDeploy} 
                  disabled={isDeploying || !deploymentConfig.appName}
                  className="w-full"
                >
                  {isDeploying ? 'Deploying...' : `Deploy to ${selectedPlatform}`}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Deployments</CardTitle>
                <CardDescription>
                  Your latest deployment activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deploymentsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : deployments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No deployments yet</p>
                ) : (
                  <div className="space-y-4">
                    {deployments.slice(0, 5).map((deployment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${deployment.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="font-medium">{deployment.platform}</p>
                            <p className="text-sm text-gray-500">{deployment.timestamp}</p>
                          </div>
                        </div>
                        {deployment.url && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(deployment.url, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                API Discovery
              </CardTitle>
              <CardDescription>
                Discover and integrate external APIs automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for APIs (e.g., stripe payment, twilio sms)"
                  value={apiSearchQuery}
                  onChange={(e) => setApiSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Select value={apiCategory} onValueChange={setApiCategory}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="ai">AI/ML</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAPIDiscovery} disabled={!apiSearchQuery.trim()}>
                  <Search className="w-4 h-4 mr-2" />
                  Discover
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apisLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : discoveredAPIs.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No APIs discovered yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">Search for APIs to discover new integrations</p>
                </CardContent>
              </Card>
            ) : (
              discoveredAPIs.map((api: DiscoveredAPI) => (
                <Card key={api.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{api.name}</CardTitle>
                        <CardDescription>{api.category}</CardDescription>
                      </div>
                      <Badge variant={api.status === 'active' ? 'default' : 'secondary'}>
                        {api.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {api.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {api.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{api.authType}</span>
                      <Button variant="ghost" size="sm" onClick={() => window.open(api.documentation, '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Credential Management
              </CardTitle>
              <CardDescription>
                Scan and manage your API credentials securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Button onClick={handleCredentialScan} disabled={isScanning}>
                  {isScanning ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  {isScanning ? 'Scanning...' : 'Scan Credentials'}
                </Button>
                <Button variant="outline" onClick={() => setShowSecrets(!showSecrets)}>
                  {showSecrets ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showSecrets ? 'Hide' : 'Show'} Secrets
                </Button>
              </div>

              {credentialsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : credentialAudit?.credentials ? (
                <div className="space-y-4">
                  {credentialAudit.credentials.map((cred: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          cred.status === 'valid' ? 'bg-green-500' : 
                          cred.status === 'expired' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{cred.platform}</p>
                          <p className="text-sm text-gray-500">{cred.type} • {cred.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{cred.scope?.length || 0} scopes</Badge>
                        {showSecrets && (
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cred.key || 'Hidden')}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No credentials found. Run a scan to discover credentials.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Deployments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Active: {deployments.filter((d: any) => d.success).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Failed: {deployments.filter((d: any) => !d.success).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  APIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Active: {discoveredAPIs.filter((api: DiscoveredAPI) => api.status === 'active').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm">Inactive: {discoveredAPIs.filter((api: DiscoveredAPI) => api.status === 'inactive').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    credentialAudit?.securityScore > 80 ? 'bg-green-500' :
                    credentialAudit?.securityScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm">Score: {credentialAudit?.securityScore || 0}/100</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}