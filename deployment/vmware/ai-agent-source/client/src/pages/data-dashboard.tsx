import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Database, 
  Globe, 
  Key, 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Server,
  Activity
} from "lucide-react";

interface ApiCredential {
  id: number;
  apiId: string;
  name: string;
  isActive: boolean;
  permissions: string[];
  lastUsed?: string;
  createdAt: string;
}

interface BackgroundJob {
  id: number;
  name: string;
  type: 'sync_data' | 'poll_data' | 'webhook' | 'cache_update';
  apiId: string;
  endpoint: string;
  schedule: string;
  status: 'active' | 'paused' | 'failed';
  lastRun?: string;
  nextRun: string;
  metadata?: any;
  createdAt: string;
}

interface AvailableData {
  [apiId: string]: {
    endpoints: string[];
    lastUpdate: string;
    dataPreview: any;
  };
}

export default function DataDashboard() {
  const [selectedApi, setSelectedApi] = useState<string>("");
  const [newCredentialDialog, setNewCredentialDialog] = useState(false);
  const [newJobDialog, setNewJobDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch external APIs
  const { data: externalApis = [] } = useQuery({
    queryKey: ["/api/external-apis"],
  });

  // Fetch user credentials
  const { data: credentialsResponse } = useQuery({
    queryKey: ["/api/credentials"],
  });
  const credentials = credentialsResponse?.credentials || [];

  // Fetch background jobs
  const { data: jobsResponse } = useQuery({
    queryKey: ["/api/background-jobs"],
  });
  const backgroundJobs = jobsResponse?.jobs || [];

  // Fetch available data
  const { data: availableDataResponse } = useQuery({
    queryKey: ["/api/data/available"],
  });
  const availableData: AvailableData = availableDataResponse?.data || {};

  // Create credential mutation
  const createCredentialMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/credentials", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      setNewCredentialDialog(false);
      toast({
        title: "Success",
        description: "API credential stored securely",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to store credential",
        variant: "destructive",
      });
    },
  });

  // Create background job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/background-jobs", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/background-jobs"] });
      setNewJobDialog(false);
      toast({
        title: "Success",
        description: "Background job created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create background job",
        variant: "destructive",
      });
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/credentials/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      toast({
        title: "Success",
        description: "Credential deleted successfully",
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/background-jobs/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/background-jobs"] });
      toast({
        title: "Success",
        description: "Background job deleted successfully",
      });
    },
  });

  // Setup auto-sync mutation
  const setupAutoSyncMutation = useMutation({
    mutationFn: async (data: { apiId: string; endpoint: string; schedule?: string }) => 
      apiRequest("/api/data/auto-sync", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/background-jobs"] });
      toast({
        title: "Success",
        description: "Auto-sync setup successfully",
      });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async (apiId?: string) => apiRequest("/api/cache", {
      method: "DELETE",
      params: apiId ? { apiId } : {},
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data/available"] });
      toast({
        title: "Success",
        description: "Cache cleared successfully",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Dashboard</h1>
          <p className="text-muted-foreground">
            Manage external API integrations, credentials, and automated data syncing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => clearCacheMutation.mutate()}
            disabled={clearCacheMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear All Cache
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apis">External APIs</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
          <TabsTrigger value="data">Available Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">External APIs</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{externalApis.length}</div>
                <p className="text-xs text-muted-foreground">Available integrations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stored Credentials</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{credentials.length}</div>
                <p className="text-xs text-muted-foreground">Encrypted & secure</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Background Jobs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backgroundJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {backgroundJobs.filter(j => j.status === 'active').length} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(availableData).length}</div>
                <p className="text-xs text-muted-foreground">With cached data</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest data syncs and job executions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {backgroundJobs.slice(0, 10).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="font-medium">{job.name}</span>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.lastRun ? `Last: ${new Date(job.lastRun).toLocaleString()}` : 'Never run'}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External API Integrations</CardTitle>
              <CardDescription>
                Available APIs for data collection, security research, and automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {externalApis.map((api: any) => (
                    <Card key={api.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{api.name}</CardTitle>
                          <Badge variant={api.requiresAuth ? "default" : "secondary"}>
                            {api.requiresAuth ? "Auth Required" : "Public"}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="w-fit">
                          {api.category}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{api.description}</p>
                        <div className="space-y-2">
                          <p className="text-xs font-medium">Available Endpoints:</p>
                          {api.endpoints.slice(0, 3).map((endpoint: any, idx: number) => (
                            <div key={idx} className="text-xs p-2 bg-muted rounded">
                              <span className="font-mono">{endpoint.method}</span> {endpoint.path}
                            </div>
                          ))}
                          {api.endpoints.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{api.endpoints.length - 3} more endpoints
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setupAutoSyncMutation.mutate({
                              apiId: api.id,
                              endpoint: api.endpoints[0]?.path || '/'
                            })}
                            disabled={setupAutoSyncMutation.isPending}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Auto-Sync
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">API Credentials</h3>
              <p className="text-sm text-muted-foreground">Securely stored API keys and tokens</p>
            </div>
            <Dialog open={newCredentialDialog} onOpenChange={setNewCredentialDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credential
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add API Credential</DialogTitle>
                  <DialogDescription>
                    Store API keys securely with encryption
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createCredentialMutation.mutate({
                    apiId: formData.get('apiId'),
                    name: formData.get('name'),
                    keyType: formData.get('keyType'),
                    keyValue: formData.get('keyValue'),
                    permissions: formData.get('permissions')?.toString().split(',') || [],
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apiId">API Service</Label>
                      <Select name="apiId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select API service" />
                        </SelectTrigger>
                        <SelectContent>
                          {externalApis.map((api: any) => (
                            <SelectItem key={api.id} value={api.id}>
                              {api.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="name">Credential Name</Label>
                      <Input name="name" placeholder="My API Key" required />
                    </div>
                    <div>
                      <Label htmlFor="keyType">Key Type</Label>
                      <Select name="keyType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select key type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api-key">API Key</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="oauth">OAuth Token</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="keyValue">Key Value</Label>
                      <Textarea name="keyValue" placeholder="Enter your API key..." required />
                    </div>
                    <div>
                      <Label htmlFor="permissions">Permissions (comma-separated)</Label>
                      <Input name="permissions" placeholder="read, write, admin" />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="submit" disabled={createCredentialMutation.isPending}>
                      {createCredentialMutation.isPending ? "Storing..." : "Store Credential"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {credentials.map((credential: ApiCredential) => (
              <Card key={credential.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Shield className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-medium">{credential.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        API: {credential.apiId} • 
                        {credential.lastUsed 
                          ? ` Last used: ${new Date(credential.lastUsed).toLocaleDateString()}`
                          : ' Never used'}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {credential.permissions.map(perm => (
                          <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={credential.isActive ? "default" : "secondary"}>
                      {credential.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteCredentialMutation.mutate(credential.id)}
                      disabled={deleteCredentialMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Background Jobs</h3>
              <p className="text-sm text-muted-foreground">Automated data syncing and polling tasks</p>
            </div>
            <Dialog open={newJobDialog} onOpenChange={setNewJobDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Background Job</DialogTitle>
                  <DialogDescription>
                    Setup automated data collection or processing
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createJobMutation.mutate({
                    name: formData.get('name'),
                    type: formData.get('type'),
                    apiId: formData.get('apiId'),
                    endpoint: formData.get('endpoint'),
                    schedule: formData.get('schedule'),
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Job Name</Label>
                      <Input name="name" placeholder="Daily Data Sync" required />
                    </div>
                    <div>
                      <Label htmlFor="type">Job Type</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sync_data">Sync Data</SelectItem>
                          <SelectItem value="poll_data">Poll Data</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="cache_update">Cache Update</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="apiId">API Service</Label>
                      <Select name="apiId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select API service" />
                        </SelectTrigger>
                        <SelectContent>
                          {externalApis.map((api: any) => (
                            <SelectItem key={api.id} value={api.id}>
                              {api.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="endpoint">Endpoint</Label>
                      <Input name="endpoint" placeholder="/api/data" required />
                    </div>
                    <div>
                      <Label htmlFor="schedule">Schedule (cron format)</Label>
                      <Input name="schedule" placeholder="0 */6 * * *" defaultValue="0 */6 * * *" required />
                      <p className="text-xs text-muted-foreground mt-1">
                        Examples: "0 */6 * * *" (every 6 hours), "0 0 * * *" (daily)
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="submit" disabled={createJobMutation.isPending}>
                      {createJobMutation.isPending ? "Creating..." : "Create Job"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {backgroundJobs.map((job: BackgroundJob) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
                      <div>
                        <h4 className="font-medium">{job.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {job.type} • {job.apiId} • {job.endpoint}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Schedule: {job.schedule} • 
                          Next run: {new Date(job.nextRun).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{job.status}</Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteJobMutation.mutate(job.id)}
                        disabled={deleteJobMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Data Sources</CardTitle>
              <CardDescription>
                Cached data from your connected APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(availableData).map(([apiId, data]) => (
                  <Card key={apiId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{apiId}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => clearCacheMutation.mutate(apiId)}
                            disabled={clearCacheMutation.isPending}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Clear Cache
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(data.lastUpdate).toLocaleString()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Available Endpoints:</p>
                        <div className="grid gap-2">
                          {data.endpoints.map((endpoint, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-mono text-sm">{endpoint}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // Implement data preview
                                  toast({
                                    title: "Data Preview",
                                    description: `Viewing data for ${endpoint}`,
                                  });
                                }}
                              >
                                View Data
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      {data.dataPreview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Data Preview:</p>
                          <ScrollArea className="h-32 w-full border rounded p-2">
                            <pre className="text-xs">
                              {JSON.stringify(data.dataPreview, null, 2)}
                            </pre>
                          </ScrollArea>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}