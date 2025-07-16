import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle, Info, XCircle, Wand2, Brain, Target, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SuggestionResult {
  file: string;
  line: number;
  column: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  suggestion: string;
  autoFixAvailable: boolean;
  repairPattern?: string;
}

interface PatternStats {
  totalPatterns: number;
  highConfidencePatterns: number;
  recentlyLearned: number;
}

export default function IntelligentSuggestions() {
  const [selectedFile, setSelectedFile] = useState('');
  const [activeTab, setActiveTab] = useState('project');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch project-wide suggestions
  const { data: projectSuggestions, isLoading: projectLoading, refetch: refetchProject } = useQuery({
    queryKey: ['/api/suggestions/project-analysis'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch pattern statistics
  const { data: patternStats } = useQuery({
    queryKey: ['/api/suggestions/pattern-stats'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch file-specific suggestions
  const { data: fileSuggestions, isLoading: fileLoading, refetch: refetchFile } = useQuery({
    queryKey: ['/api/suggestions/analyze-file', selectedFile],
    enabled: !!selectedFile,
  });

  // Apply auto-fix mutation
  const applyFixMutation = useMutation({
    mutationFn: async (suggestion: SuggestionResult) => {
      const response = await fetch('/api/suggestions/apply-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Auto-fix Applied",
          description: "The suggestion has been automatically fixed.",
        });
        // Refresh suggestions
        refetchProject();
        if (selectedFile) refetchFile();
      } else {
        toast({
          title: "Auto-fix Failed",
          description: data.message || "Unable to apply automatic fix.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to apply auto-fix.",
        variant: "destructive",
      });
    }
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const renderSuggestion = (suggestion: SuggestionResult, index: number) => (
    <Card key={index} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getSeverityIcon(suggestion.severity)}
            <CardTitle className="text-sm">{suggestion.message}</CardTitle>
            <Badge variant={getSeverityColor(suggestion.severity)}>
              {suggestion.severity}
            </Badge>
          </div>
          {suggestion.autoFixAvailable && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyFixMutation.mutate(suggestion)}
              disabled={applyFixMutation.isPending}
              className="ml-2"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Auto-fix
            </Button>
          )}
        </div>
        <CardDescription>
          {suggestion.file}:{suggestion.line}:{suggestion.column}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-2">{suggestion.suggestion}</p>
        {suggestion.repairPattern && (
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
            Pattern: {suggestion.repairPattern}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Brain className="h-8 w-8 mr-3 text-purple-500" />
          Intelligent Code Suggestion Wizard
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-powered code suggestions based on autonomous repair patterns and system learning
        </p>
      </div>

      {/* Pattern Statistics */}
      {patternStats?.success && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patternStats.stats.totalPatterns}</div>
              <p className="text-xs text-muted-foreground">
                Learned from repairs and AI analysis
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patternStats.stats.highConfidencePatterns}</div>
              <p className="text-xs text-muted-foreground">
                Patterns with &gt;80% confidence
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Learned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patternStats.stats.recentlyLearned}</div>
              <p className="text-xs text-muted-foreground">
                New patterns in last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project">Project Analysis</TabsTrigger>
          <TabsTrigger value="file">File Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project-wide Suggestions</CardTitle>
                  <CardDescription>
                    AI-powered analysis of your entire codebase based on repair patterns
                  </CardDescription>
                </div>
                <Button onClick={() => refetchProject()} disabled={projectLoading}>
                  {projectLoading ? 'Analyzing...' : 'Refresh Analysis'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Analyzing codebase...</span>
                </div>
              ) : projectSuggestions?.success ? (
                <ScrollArea className="h-[600px]">
                  {projectSuggestions.suggestions.length > 0 ? (
                    <div className="space-y-4">
                      {projectSuggestions.suggestions.map((suggestion: SuggestionResult, index: number) =>
                        renderSuggestion(suggestion, index)
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No Issues Found</h3>
                      <p className="text-muted-foreground">
                        Your codebase looks great! The AI couldn't find any patterns that need attention.
                      </p>
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Analysis Failed</h3>
                  <p className="text-muted-foreground">
                    Unable to analyze the project. Please try again.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File-specific Analysis</CardTitle>
              <CardDescription>
                Analyze individual files for potential improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="file-path">File Path</Label>
                  <Input
                    id="file-path"
                    placeholder="e.g., server/routes.ts or client/src/App.tsx"
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => refetchFile()} 
                  disabled={!selectedFile || fileLoading}
                  className="mt-6"
                >
                  {fileLoading ? 'Analyzing...' : 'Analyze File'}
                </Button>
              </div>

              {selectedFile && (
                <>
                  {fileLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Analyzing file...</span>
                    </div>
                  ) : fileSuggestions?.success ? (
                    <ScrollArea className="h-[500px]">
                      {fileSuggestions.suggestions.length > 0 ? (
                        <div className="space-y-4">
                          {fileSuggestions.suggestions.map((suggestion: SuggestionResult, index: number) =>
                            renderSuggestion(suggestion, index)
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold">File Looks Good</h3>
                          <p className="text-muted-foreground">
                            No suggestions found for this file. Great job!
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  ) : fileSuggestions && !fileSuggestions.success ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Analysis Failed</h3>
                      <p className="text-muted-foreground">
                        Could not analyze the specified file. Please check the path.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Severity Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm">Critical - Immediate attention required</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm">Error - Should be fixed soon</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Warning - Consider improving</span>
            </div>
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Info - Optional improvement</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}