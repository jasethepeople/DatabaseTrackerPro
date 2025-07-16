/**
 * Testing Dashboard - Comprehensive testing interface
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  PlayCircle, 
  RefreshCw, 
  Bug, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";

export default function TestingDashboard() {
  const [selectedFramework, setSelectedFramework] = useState('jest');
  const [testOptions, setTestOptions] = useState({
    framework: 'jest',
    testTypes: ['unit', 'integration'],
    coverage: true,
    generateFixtures: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate test suite mutation
  const generateTestsMutation = useMutation({
    mutationFn: async (options: any) => {
      return apiRequest('/api/testing/generate', {
        method: 'POST',
        body: { projectPath: './', options }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Test Suite Generated",
        description: `Generated ${data.testsGenerated} tests across ${data.files.length} files`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/testing/status'] });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Run tests mutation
  const runTestsMutation = useMutation({
    mutationFn: async (options: any) => {
      return apiRequest('/api/testing/run', {
        method: 'POST',
        body: { projectPath: './', options }
      });
    },
    onSuccess: (data) => {
      const result = data.result;
      toast({
        title: result.summary.success ? "Tests Passed" : "Tests Failed",
        description: `${result.summary.passed}/${result.summary.total} tests passed`,
        variant: result.summary.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/testing/results'] });
    },
    onError: (error) => {
      toast({
        title: "Test Run Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Debug project mutation
  const debugProjectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/testing/debug', {
        method: 'POST',
        body: { projectPath: './' }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Debug Complete",
        description: `Found ${data.debug.bugs.length} bugs and ${data.debug.performanceIssues.length} performance issues`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/testing/debug'] });
    },
    onError: (error) => {
      toast({
        title: "Debug Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Mock test results for demonstration
  const testResults = {
    summary: {
      total: 24,
      passed: 22,
      failed: 2,
      skipped: 0,
      duration: 1450,
      success: false
    },
    tests: [
      { name: 'User authentication', status: 'passed', duration: 45, assertions: 3 },
      { name: 'API endpoint validation', status: 'passed', duration: 32, assertions: 5 },
      { name: 'Database connection', status: 'failed', duration: 120, assertions: 2, error: 'Connection timeout' },
      { name: 'Form validation', status: 'passed', duration: 28, assertions: 4 },
      { name: 'Error handling', status: 'failed', duration: 55, assertions: 3, error: 'Unexpected error format' }
    ],
    coverage: {
      lines: { total: 450, covered: 405, percentage: 90 },
      functions: { total: 65, covered: 58, percentage: 89.2 },
      branches: { total: 120, covered: 108, percentage: 90 },
      statements: { total: 520, covered: 468, percentage: 90 }
    }
  };

  const debugResults = {
    bugs: [
      {
        type: 'logic',
        severity: 'high',
        file: 'src/auth/validator.js',
        line: 42,
        message: 'Potential null pointer exception',
        suggestion: 'Add null check before accessing property'
      },
      {
        type: 'performance',
        severity: 'medium',
        file: 'src/components/List.jsx',
        line: 15,
        message: 'Inefficient rendering in loop',
        suggestion: 'Use React.memo or useMemo for optimization'
      }
    ],
    performanceIssues: [
      {
        type: 'memory',
        severity: 'high',
        file: 'src/hooks/useData.js',
        description: 'Memory leak in event listeners',
        solution: 'Clean up event listeners in useEffect cleanup'
      }
    ],
    securityVulnerabilities: [
      {
        type: 'xss',
        severity: 'critical',
        file: 'src/components/Comment.jsx',
        description: 'Unsafe HTML rendering',
        solution: 'Use DOMPurify to sanitize user input'
      }
    ],
    suggestions: [
      'Add TypeScript for better type safety',
      'Implement error boundaries for better error handling',
      'Add automated security scanning to CI/CD pipeline'
    ]
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Automated testing, debugging, and code quality analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => generateTestsMutation.mutate(testOptions)}
            disabled={generateTestsMutation.isPending}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {generateTestsMutation.isPending ? 'Generating...' : 'Generate Tests'}
          </Button>
          <Button
            onClick={() => runTestsMutation.mutate(testOptions)}
            disabled={runTestsMutation.isPending}
            variant="outline"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {runTestsMutation.isPending ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="debug">Debug Analysis</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testResults.summary.total}</div>
                <p className="text-xs text-muted-foreground">
                  Generated automatically
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {testResults.summary.passed}/{testResults.summary.total} passed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Code Coverage</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testResults.coverage.lines.percentage}%</div>
                <p className="text-xs text-muted-foreground">
                  Lines covered
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                <Bug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {debugResults.bugs.length + debugResults.performanceIssues.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bugs and performance issues
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Generation Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Framework</label>
                  <select 
                    value={selectedFramework} 
                    onChange={(e) => {
                      setSelectedFramework(e.target.value);
                      setTestOptions(prev => ({ ...prev, framework: e.target.value }));
                    }}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="jest">Jest</option>
                    <option value="vitest">Vitest</option>
                    <option value="mocha">Mocha</option>
                    <option value="playwright">Playwright (E2E)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Test Types</label>
                  <div className="mt-2 space-y-2">
                    {['unit', 'integration', 'e2e', 'performance'].map(type => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={testOptions.testTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTestOptions(prev => ({
                                ...prev,
                                testTypes: [...prev.testTypes, type]
                              }));
                            } else {
                              setTestOptions(prev => ({
                                ...prev,
                                testTypes: prev.testTypes.filter(t => t !== type)
                              }));
                            }
                          }}
                        />
                        <span className="capitalize">{type} Tests</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => debugProjectMutation.mutate()}
                  disabled={debugProjectMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  {debugProjectMutation.isPending ? 'Analyzing...' : 'Debug Project'}
                </Button>
                
                <Button
                  onClick={() => runTestsMutation.mutate({ ...testOptions, coverage: true })}
                  disabled={runTestsMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Run with Coverage
                </Button>
                
                <Button
                  onClick={() => runTestsMutation.mutate({ ...testOptions, watch: true })}
                  disabled={runTestsMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Watch Mode
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Test Results</CardTitle>
                <Badge variant={testResults.summary.success ? "default" : "destructive"}>
                  {testResults.summary.success ? "All Passed" : "Some Failed"}
                </Badge>
              </div>
              <CardDescription>
                Duration: {testResults.summary.duration}ms | 
                {testResults.summary.passed} passed, {testResults.summary.failed} failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.tests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      {test.status === 'passed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        {test.error && (
                          <div className="text-sm text-red-600">{test.error}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{test.duration}ms</span>
                      <span>({test.assertions} assertions)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(testResults.coverage).map(([key, data]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="capitalize">{key} Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{data.covered} / {data.total}</span>
                      <span>{data.percentage}%</span>
                    </div>
                    <Progress value={data.percentage} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bugs Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {debugResults.bugs.map((bug, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={bug.severity === 'high' ? "destructive" : "secondary"}>
                          {bug.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{bug.type}</span>
                      </div>
                      <div className="text-sm font-medium">{bug.message}</div>
                      <div className="text-sm text-muted-foreground">{bug.file}:{bug.line}</div>
                      <div className="text-sm text-blue-600 mt-1">{bug.suggestion}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {debugResults.performanceIssues.map((issue, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={issue.severity === 'high' ? "destructive" : "secondary"}>
                          {issue.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{issue.type}</span>
                      </div>
                      <div className="text-sm font-medium">{issue.description}</div>
                      <div className="text-sm text-muted-foreground">{issue.file}</div>
                      <div className="text-sm text-blue-600 mt-1">{issue.solution}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {debugResults.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Vulnerabilities</CardTitle>
              <CardDescription>
                Automated security analysis and vulnerability detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {debugResults.securityVulnerabilities.map((vuln, index) => (
                  <div key={index} className="p-3 border rounded border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive">{vuln.severity}</Badge>
                      <span className="text-sm text-muted-foreground">{vuln.type.toUpperCase()}</span>
                    </div>
                    <div className="text-sm font-medium">{vuln.description}</div>
                    <div className="text-sm text-muted-foreground">{vuln.file}</div>
                    <div className="text-sm text-blue-600 mt-1">Solution: {vuln.solution}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}