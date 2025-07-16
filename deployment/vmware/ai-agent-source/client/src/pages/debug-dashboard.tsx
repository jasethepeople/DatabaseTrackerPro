/**
 * Debug Dashboard - Autonomous Self-Repair System Monitor
 * Shows real-time system health, AI debugging sessions, and repair history
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  Zap, 
  Bug, 
  RefreshCw,
  Play,
  Clock,
  Database,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DebugSession {
  id: string;
  issue: string;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
  tests?: any[];
  results?: any[];
  aiLearning?: any;
}

interface RepairLog {
  id: string;
  timestamp: string;
  issue: string;
  diagnosis: string;
  solution: string;
  success: boolean;
  learningData?: any;
}

interface SystemHealth {
  services: { [key: string]: boolean };
  apis: { [key: string]: boolean };
  database: boolean;
  filesystem: boolean;
  network: boolean;
  memory: number;
  cpu: number;
}

export default function DebugDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [debugSessions, setDebugSessions] = useState<DebugSession[]>([]);
  const [repairHistory, setRepairHistory] = useState<RepairLog[]>([]);
  const [aiKnowledge, setAiKnowledge] = useState<any[]>([]);
  const [knowledgeBaseSize, setKnowledgeBaseSize] = useState(0);
  const [newIssue, setNewIssue] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [healthRes, sessionsRes, historyRes, knowledgeRes, sizeRes] = await Promise.all([
        apiRequest('/api/repair/system-status'),
        apiRequest('/api/debug/sessions'),
        apiRequest('/api/repair/history'),
        apiRequest('/api/debug/ai-knowledge'),
        apiRequest('/api/repair/knowledge-base-size')
      ]);

      setSystemHealth(healthRes.status);
      setDebugSessions(sessionsRes.sessions || []);
      setRepairHistory(historyRes.history || []);
      setAiKnowledge(knowledgeRes.knowledge || []);
      setKnowledgeBaseSize(sizeRes.size || 0);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const createDebugSession = async () => {
    if (!newIssue.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiRequest('/api/debug/debug-issue', 'POST', { issue: newIssue });
      toast({
        title: 'Debug Session Created',
        description: `Running diagnostics for: ${newIssue}`,
      });
      setNewIssue('');
      loadDashboardData();
    } catch (error) {
      toast({
        title: 'Failed to Create Session',
        description: 'Unable to create debug session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const forceRepair = async (issue: string) => {
    try {
      const response = await apiRequest('/api/repair/force-repair', 'POST', { issue });
      toast({
        title: response.success ? 'Repair Completed' : 'Repair Failed',
        description: response.message,
        variant: response.success ? 'default' : 'destructive',
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: 'Repair Error',
        description: 'Failed to execute repair',
        variant: 'destructive',
      });
    }
  };

  const getHealthColor = (value: boolean | number) => {
    if (typeof value === 'boolean') {
      return value ? 'text-green-500' : 'text-red-500';
    }
    return value > 80 ? 'text-red-500' : value > 60 ? 'text-yellow-500' : 'text-green-500';
  };

  const getHealthIcon = (value: boolean | number) => {
    if (typeof value === 'boolean') {
      return value ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
    }
    return value > 80 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🤖 Autonomous Debug & Self-Repair System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-powered debugging, system monitoring, and autonomous repair capabilities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Brain className="h-3 w-3" />
            <span>{knowledgeBaseSize} Known Solutions</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>{debugSessions.length} Active Sessions</span>
          </Badge>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Real-Time System Health</span>
          </CardTitle>
          <CardDescription>
            Live monitoring of system components and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systemHealth ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="flex items-center space-x-2">
                <div className={getHealthColor(systemHealth.database)}>
                  {getHealthIcon(systemHealth.database)}
                </div>
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={getHealthColor(systemHealth.filesystem)}>
                  {getHealthIcon(systemHealth.filesystem)}
                </div>
                <span className="text-sm">File System</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={getHealthColor(systemHealth.network)}>
                  {getHealthIcon(systemHealth.network)}
                </div>
                <span className="text-sm">Network</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={getHealthColor(systemHealth.memory)}>
                  {getHealthIcon(systemHealth.memory)}
                </div>
                <span className="text-sm">Memory ({systemHealth.memory}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={getHealthColor(systemHealth.cpu)}>
                  {getHealthIcon(systemHealth.cpu)}
                </div>
                <span className="text-sm">CPU ({systemHealth.cpu}%)</span>
              </div>
              {Object.entries(systemHealth.services).map(([service, status]) => (
                <div key={service} className="flex items-center space-x-2">
                  <div className={getHealthColor(status)}>
                    {getHealthIcon(status)}
                  </div>
                  <span className="text-sm">{service}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading system health...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Debug Session Creator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="h-5 w-5" />
            <span>Create Debug Session</span>
          </CardTitle>
          <CardDescription>
            Describe an issue to start AI-powered debugging and repair
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Describe the issue (e.g., 'High memory usage', 'Database connection failed', 'Port conflict')"
              value={newIssue}
              onChange={(e) => setNewIssue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createDebugSession()}
              className="flex-1"
            />
            <Button 
              onClick={createDebugSession} 
              disabled={loading || !newIssue.trim()}
              className="flex items-center space-x-2"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              <span>Debug</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">Debug Sessions</TabsTrigger>
          <TabsTrigger value="repairs">Repair History</TabsTrigger>
          <TabsTrigger value="knowledge">AI Knowledge</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Debug Sessions</CardTitle>
              <CardDescription>
                AI diagnostic sessions and automated testing results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {debugSessions.length > 0 ? (
                  <div className="space-y-4">
                    {debugSessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              session.status === 'completed' ? 'default' :
                              session.status === 'failed' ? 'destructive' : 'secondary'
                            }>
                              {session.status}
                            </Badge>
                            <span className="font-medium">{session.issue}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(session.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {session.results && session.results.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">
                              Tests: {session.results.filter(r => r.success).length}/{session.results.length} passed
                            </p>
                            <Progress 
                              value={(session.results.filter(r => r.success).length / session.results.length) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                        {session.aiLearning && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p>AI Confidence: {(session.aiLearning.confidence * 100).toFixed(1)}%</p>
                            <p>Solutions Found: {session.aiLearning.solutions?.length || 0}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No active debug sessions. Create one above to start diagnosing issues.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repairs">
          <Card>
            <CardHeader>
              <CardTitle>Repair History</CardTitle>
              <CardDescription>
                Autonomous repair attempts and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {repairHistory.length > 0 ? (
                  <div className="space-y-4">
                    {repairHistory.map((repair) => (
                      <div key={repair.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={repair.success ? 'default' : 'destructive'}>
                              {repair.success ? 'Success' : 'Failed'}
                            </Badge>
                            <span className="font-medium">{repair.issue}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {new Date(repair.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><strong>Diagnosis:</strong> {repair.diagnosis}</p>
                          <p><strong>Solution:</strong> {repair.solution}</p>
                        </div>
                        {repair.success && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => forceRepair(repair.issue)}
                            className="mt-2"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Apply Again
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No repair history available. The system will learn as it encounters issues.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>AI Knowledge Base</CardTitle>
              <CardDescription>
                Learned patterns and solutions from previous debugging sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {aiKnowledge.length > 0 ? (
                  <div className="space-y-4">
                    {aiKnowledge.map((knowledge, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Pattern #{index + 1}</span>
                          <Badge variant="outline">
                            Confidence: {(knowledge.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <strong>Patterns:</strong>
                            <ul className="list-disc ml-4">
                              {knowledge.patterns?.map((pattern: string, i: number) => (
                                <li key={i}>{pattern}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong>Solutions:</strong>
                            <ul className="list-disc ml-4">
                              {knowledge.solutions?.map((solution: string, i: number) => (
                                <li key={i}>{solution}</li>
                              ))}
                            </ul>
                          </div>
                          {knowledge.learningMetrics && (
                            <div>
                              <strong>Metrics:</strong>
                              <p>Success Rate: {(knowledge.learningMetrics.successRate * 100).toFixed(1)}%</p>
                              <p>Avg Execution: {knowledge.learningMetrics.avgExecutionTime}ms</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    AI knowledge base is empty. Create debug sessions to train the AI.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>
                Performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {repairHistory.filter(r => r.success).length}
                  </div>
                  <div className="text-sm text-gray-600">Successful Repairs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {repairHistory.filter(r => !r.success).length}
                  </div>
                  <div className="text-sm text-gray-600">Failed Repairs</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {debugSessions.length}
                  </div>
                  <div className="text-sm text-gray-600">Debug Sessions</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {knowledgeBaseSize}
                  </div>
                  <div className="text-sm text-gray-600">Knowledge Patterns</div>
                </div>
              </div>
              
              {repairHistory.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Success Rate</h3>
                  <Progress 
                    value={(repairHistory.filter(r => r.success).length / repairHistory.length) * 100}
                    className="h-4"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    {((repairHistory.filter(r => r.success).length / repairHistory.length) * 100).toFixed(1)}% 
                    success rate across all repair attempts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}