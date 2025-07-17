import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Code, 
  Database,
  Terminal,
  Package,
  Settings,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  GitBranch,
  Monitor,
  Cpu,
  HardDrive,
  Activity
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SystemStatus {
  status: 'running' | 'stopped' | 'error';
  memory: { used: number; total: number };
  cpu: number;
  disk: { used: number; total: number };
  services: {
    webServer: boolean;
    database: boolean;
    terminal: boolean;
    packageManager: boolean;
  };
}

interface DevEnvironment {
  id: string;
  name: string;
  framework: string;
  nodeVersion: string;
  status: 'running' | 'stopped' | 'starting' | 'error';
  port?: number;
  createdAt: Date;
}

export default function LocalDevEnvironment() {
  const { toast } = useToast();
  const [selectedEnv, setSelectedEnv] = useState<DevEnvironment | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Fetch system status
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/local-dev/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch environments
  const { data: environments = [], isLoading: envsLoading } = useQuery({
    queryKey: ["/api/local-dev/environments"],
  });

  // Create environment mutation
  const createEnvironment = useMutation({
    mutationFn: async (data: { name: string; framework: string; nodeVersion: string }) => {
      return await apiRequest("/api/local-dev/create", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Environment Created",
        description: `${data.name} is ready to use`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/local-dev/environments"] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start/stop environment
  const toggleEnvironment = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'start' | 'stop' }) => {
      return await apiRequest(`/api/local-dev/${id}/${action}`, {
        method: "POST",
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'start' ? "Environment Started" : "Environment Stopped",
        description: variables.action === 'start' ? "Your development server is running" : "Environment has been stopped",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/local-dev/environments"] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'stopped':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'starting':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Monitor className="h-8 w-8" />
            Local Dev Environment
          </h1>
          <p className="text-gray-400">Manage your local development environment and services</p>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {systemStatus?.status === 'running' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-white font-medium">Running</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-white font-medium">Stopped</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">{systemStatus?.cpu || 0}%</div>
                <Progress value={systemStatus?.cpu || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-white">
                  {systemStatus && formatBytes(systemStatus.memory.used)} / {systemStatus && formatBytes(systemStatus.memory.total)}
                </div>
                <Progress 
                  value={systemStatus ? (systemStatus.memory.used / systemStatus.memory.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Disk Space
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-white">
                  {systemStatus && formatBytes(systemStatus.disk.used)} / {systemStatus && formatBytes(systemStatus.disk.total)}
                </div>
                <Progress 
                  value={systemStatus ? (systemStatus.disk.used / systemStatus.disk.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Status */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Services</CardTitle>
            <CardDescription className="text-gray-400">
              Core services running in your development environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                <Server className={`h-5 w-5 ${systemStatus?.services.webServer ? 'text-green-500' : 'text-gray-500'}`} />
                <div>
                  <p className="text-white font-medium">Web Server</p>
                  <p className="text-xs text-gray-400">{systemStatus?.services.webServer ? 'Running' : 'Stopped'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                <Database className={`h-5 w-5 ${systemStatus?.services.database ? 'text-green-500' : 'text-gray-500'}`} />
                <div>
                  <p className="text-white font-medium">Database</p>
                  <p className="text-xs text-gray-400">{systemStatus?.services.database ? 'Running' : 'Stopped'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                <Terminal className={`h-5 w-5 ${systemStatus?.services.terminal ? 'text-green-500' : 'text-gray-500'}`} />
                <div>
                  <p className="text-white font-medium">Terminal</p>
                  <p className="text-xs text-gray-400">{systemStatus?.services.terminal ? 'Available' : 'Unavailable'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                <Package className={`h-5 w-5 ${systemStatus?.services.packageManager ? 'text-green-500' : 'text-gray-500'}`} />
                <div>
                  <p className="text-white font-medium">Package Manager</p>
                  <p className="text-xs text-gray-400">{systemStatus?.services.packageManager ? 'Ready' : 'Not Ready'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Environments */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Development Environments</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your project environments
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  createEnvironment.mutate({
                    name: `Project ${environments.length + 1}`,
                    framework: "Next.js",
                    nodeVersion: "18.x"
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Environment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {envsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading environments...</div>
            ) : environments.length === 0 ? (
              <div className="text-center py-8">
                <Code className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No environments yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first development environment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {environments.map((env: DevEnvironment) => (
                  <div key={env.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-medium">{env.name}</h3>
                          {getStatusIcon(env.status)}
                          <Badge variant="secondary">{env.framework}</Badge>
                          <Badge variant="outline">Node {env.nodeVersion}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            /workspace/{env.name.toLowerCase().replace(/\s+/g, '-')}
                          </span>
                          {env.port && (
                            <span className="flex items-center gap-1">
                              <Server className="h-3 w-3" />
                              Port {env.port}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            main
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {env.status === 'running' && env.port && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`http://localhost:${env.port}`, '_blank')}
                            className="border-gray-600"
                          >
                            Open Browser
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleEnvironment.mutate({ 
                            id: env.id, 
                            action: env.status === 'running' ? 'stop' : 'start' 
                          })}
                          disabled={toggleEnvironment.isPending || env.status === 'starting'}
                          className="border-gray-600"
                        >
                          {env.status === 'running' ? (
                            <>
                              <Square className="h-3 w-3 mr-1" />
                              Stop
                            </>
                          ) : env.status === 'starting' ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}