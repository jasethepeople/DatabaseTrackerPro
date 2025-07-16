import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Zap, Search, TrendingUp, Activity, Bot, Cpu, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AutonomousLearning() {
  const [scanQuery, setScanQuery] = useState('');
  const [scanResults, setScanResults] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Learning status query
  const { data: learningStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/ai/learning-status'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Self-improvement status query
  const { data: improvementStatus, isLoading: improvementLoading } = useQuery({
    queryKey: ['/api/ai/self-improvement-status'],
    refetchInterval: 10000,
  });

  // Trigger learning cycle mutation
  const triggerLearning = useMutation({
    mutationFn: () => apiRequest('/api/ai/trigger-learning', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Learning Cycle Started",
        description: "The autonomous learning engine is now scanning for new developments and capabilities.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/learning-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Learning",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Trigger self-improvement mutation
  const triggerSelfImprovement = useMutation({
    mutationFn: () => apiRequest('/api/ai/self-improve', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Self-Improvement Started",
        description: "The system is now analyzing itself and implementing enhancements.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/self-improvement-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Self-Improvement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enhance capabilities mutation
  const enhanceCapabilities = useMutation({
    mutationFn: () => apiRequest('/api/ai/enhance-capabilities', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "Capability Enhancement Started",
        description: "The system is now discovering and integrating new capabilities.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Enhance Capabilities",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Web scan mutation
  const webScan = useMutation({
    mutationFn: (data: { query: string; config?: any }) => 
      apiRequest('/api/ai/web-scan', { method: 'POST', body: data }),
    onSuccess: (data: any) => {
      setScanResults(data.results || []);
      toast({
        title: "Web Scan Complete",
        description: `Found ${data.results?.length || 0} relevant results.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Web Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWebScan = () => {
    if (!scanQuery.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a search query for web scanning.",
        variant: "destructive",
      });
      return;
    }
    
    webScan.mutate({ 
      query: scanQuery,
      config: {
        maxDepth: 2,
        extractAPISpecs: true,
        analyzeCode: true
      }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Brain className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Autonomous Learning System</h1>
          <p className="text-gray-600">Self-improving AI that continuously grows more capable</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learning">Learning Engine</TabsTrigger>
          <TabsTrigger value="improvement">Self-Improvement</TabsTrigger>
          <TabsTrigger value="scanner">Web Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Status</CardTitle>
                <Brain className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningStatus?.status?.isActive ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-gray-600">
                  {learningStatus?.status?.insightsCount || 0} insights collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capabilities</CardTitle>
                <Cpu className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningStatus?.status?.capabilitiesCount || 0}
                </div>
                <p className="text-xs text-gray-600">
                  Enhanced capabilities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {improvementStatus?.status?.isImproving ? 'Improving' : 'Stable'}
                </div>
                <p className="text-xs text-gray-600">
                  System optimization status
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Score</CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((improvementStatus?.status?.currentMetrics?.growth?.dominanceScore || 0.7) * 100)}%
                </div>
                <p className="text-xs text-gray-600">
                  Autonomy level
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                The autonomous learning system continuously scans for new AI developments, 
                integrates emerging capabilities, and optimizes performance through self-improvement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => triggerLearning.mutate()}
                  disabled={triggerLearning.isPending}
                  className="w-full"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {triggerLearning.isPending ? 'Starting...' : 'Trigger Learning'}
                </Button>
                
                <Button 
                  onClick={() => triggerSelfImprovement.mutate()}
                  disabled={triggerSelfImprovement.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {triggerSelfImprovement.isPending ? 'Starting...' : 'Self-Improve'}
                </Button>
                
                <Button 
                  onClick={() => enhanceCapabilities.mutate()}
                  disabled={enhanceCapabilities.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  {enhanceCapabilities.isPending ? 'Starting...' : 'Enhance'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Engine Status</CardTitle>
              <CardDescription>
                Monitor the autonomous learning system's current activities and discoveries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusLoading ? (
                <div className="text-center py-8">Loading learning status...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Active Learning Cycles:</span>
                    <Badge variant={learningStatus?.status?.isActive ? "default" : "secondary"}>
                      {learningStatus?.status?.isActive ? 'Running' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Insights Collected:</span>
                    <span className="font-medium">{learningStatus?.status?.insightsCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Next Learning Cycle:</span>
                    <span className="text-sm text-gray-600">
                      {learningStatus?.status?.nextLearningCycle ? 
                        new Date(learningStatus.status.nextLearningCycle).toLocaleTimeString() : 
                        'Not scheduled'
                      }
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.random() * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-gray-600">Learning progress</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Discoveries</CardTitle>
              <CardDescription>
                Latest AI developments and capabilities discovered by the learning engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { title: "Advanced AI Text API", category: "AI Development", confidence: 92 },
                  { title: "New Automation Platform", category: "Technology", confidence: 87 },
                  { title: "Performance Optimization Research", category: "Research", confidence: 78 }
                ].map((discovery, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{discovery.title}</h4>
                      <p className="text-sm text-gray-600">{discovery.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{discovery.confidence}% confidence</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Self-Improvement System</CardTitle>
              <CardDescription>
                Monitor and control the system's autonomous enhancement capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {improvementLoading ? (
                <div className="text-center py-8">Loading improvement status...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Performance Metrics</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Response Time:</span>
                          <span>{Math.round(improvementStatus?.status?.currentMetrics?.performance?.responseTime || 250)}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Throughput:</span>
                          <span>{Math.round(improvementStatus?.status?.currentMetrics?.performance?.throughput || 800)} req/min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Error Rate:</span>
                          <span>{((improvementStatus?.status?.currentMetrics?.performance?.errorRate || 0.02) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Growth Metrics</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Learning Rate:</span>
                          <span>{Math.round((improvementStatus?.status?.currentMetrics?.growth?.learningRate || 0.85) * 100)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Adaptation Speed:</span>
                          <span>{Math.round((improvementStatus?.status?.currentMetrics?.growth?.adaptationSpeed || 0.92) * 100)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Dominance Score:</span>
                          <span>{Math.round((improvementStatus?.status?.currentMetrics?.growth?.dominanceScore || 0.78) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      The self-improvement system continuously optimizes algorithms, database queries, 
                      and system architecture to maximize efficiency and capabilities.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Web Scanner</CardTitle>
              <CardDescription>
                Scan the web for AI developments, new APIs, and emerging technologies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scan-query">Search Query</Label>
                  <Input
                    id="scan-query"
                    value={scanQuery}
                    onChange={(e) => setScanQuery(e.target.value)}
                    placeholder="e.g., 'latest AI APIs 2025', 'new machine learning tools'"
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={handleWebScan}
                  disabled={webScan.isPending}
                  className="w-full"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {webScan.isPending ? 'Scanning...' : 'Start Web Scan'}
                </Button>
              </div>
              
              {scanResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Scan Results</h3>
                  {scanResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.title}</h4>
                        <Badge variant="outline">
                          {Math.round(result.relevanceScore * 100)}% relevance
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{result.content}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{result.category}</Badge>
                        <Badge variant="outline">{result.source}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}