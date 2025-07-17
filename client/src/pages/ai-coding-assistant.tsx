import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Code, Lightbulb, Zap, FileText, Sparkles, Copy, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CodeSuggestion {
  id: string;
  type: 'improvement' | 'bug_fix' | 'optimization' | 'security' | 'refactor';
  title: string;
  description: string;
  originalCode: string;
  suggestedCode: string;
  confidence: number;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  language: string;
}

interface CodeCompletion {
  id: string;
  trigger: string;
  completion: string;
  description: string;
  confidence: number;
  context: string;
}

interface RefactoringOpportunity {
  id: string;
  type: 'extract_function' | 'remove_duplication' | 'simplify_logic' | 'modernize';
  title: string;
  description: string;
  beforeCode: string;
  afterCode: string;
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
}

interface ContextualHelp {
  id: string;
  topic: string;
  documentation: string;
  examples: string[];
  bestPractices: string[];
  commonPitfalls: string[];
}

export default function AICodingAssistant() {
  const [activeTab, setActiveTab] = useState('editor');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [analysisMode, setAnalysisMode] = useState<'real-time' | 'on-demand'>('real-time');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get AI suggestions based on current code
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['/api/ai/coding-suggestions', code, language],
    enabled: code.length > 10 && analysisMode === 'real-time',
    refetchInterval: analysisMode === 'real-time' ? 3000 : false,
  });

  // Get code completions
  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['/api/ai/code-completions', code, language],
    enabled: code.length > 5,
  });

  // Get refactoring opportunities
  const { data: refactoring = [], isLoading: refactoringLoading } = useQuery({
    queryKey: ['/api/ai/refactoring-opportunities', code, language],
    enabled: code.length > 20,
  });

  // Get contextual help
  const { data: contextualHelp = [], isLoading: helpLoading } = useQuery({
    queryKey: ['/api/ai/contextual-help', code, language],
    enabled: code.length > 10,
  });

  // Apply suggestion mutation
  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestion: CodeSuggestion) => {
      const newCode = code.replace(suggestion.originalCode, suggestion.suggestedCode);
      setCode(newCode);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Suggestion Applied",
        description: "Code has been updated with the AI suggestion",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/coding-suggestions'] });
    },
  });

  // Manual analysis mutation
  const manualAnalysisMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/ai/analyze-code', 'POST', { code, language });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/coding-suggestions'] });
    },
  });

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <Sparkles className="h-4 w-4" />;
      case 'bug_fix': return <Zap className="h-4 w-4" />;
      case 'optimization': return <Bot className="h-4 w-4" />;
      case 'security': return <FileText className="h-4 w-4" />;
      case 'refactor': return <Code className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'bg-blue-100 text-blue-800';
      case 'bug_fix': return 'bg-red-100 text-red-800';
      case 'optimization': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-orange-100 text-orange-800';
      case 'refactor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Coding Assistant
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Context-aware code analysis, intelligent suggestions, and real-time assistance
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="react">React/JSX</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Analysis:</label>
            <select
              value={analysisMode}
              onChange={(e) => setAnalysisMode(e.target.value as 'real-time' | 'on-demand')}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="real-time">Real-time</option>
              <option value="on-demand">On-demand</option>
            </select>
          </div>
          {analysisMode === 'on-demand' && (
            <Button
              onClick={() => manualAnalysisMutation.mutate()}
              disabled={manualAnalysisMutation.isPending}
              size="sm"
            >
              {manualAnalysisMutation.isPending ? 'Analyzing...' : 'Analyze Code'}
            </Button>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="editor">Code Editor</TabsTrigger>
            <TabsTrigger value="suggestions">
              AI Suggestions
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completions">Completions</TabsTrigger>
            <TabsTrigger value="refactoring">Refactoring</TabsTrigger>
            <TabsTrigger value="help">Contextual Help</TabsTrigger>
          </TabsList>

          {/* Code Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Start typing your code here... The AI will provide real-time suggestions and analysis."
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                  <span>Lines: {code.split('\n').length} | Characters: {code.length}</span>
                  <span>Language: {language}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI-Powered Suggestions
                  <Badge variant="outline">{suggestions.length} suggestions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-gray-400 animate-pulse mb-4" />
                    <p className="text-gray-600">Analyzing your code...</p>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No suggestions available. Add more code to get AI-powered insights.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getSuggestionIcon(suggestion.type)}
                                <div>
                                  <h4 className="font-semibold">{suggestion.title}</h4>
                                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getSuggestionColor(suggestion.type)}>
                                  {suggestion.type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline">
                                  {suggestion.confidence}% confidence
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <h5 className="font-medium text-sm mb-2">Current Code:</h5>
                                <div className="relative">
                                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                                    {suggestion.originalCode}
                                  </pre>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(suggestion.originalCode, `orig-${suggestion.id}`)}
                                  >
                                    {copiedStates[`orig-${suggestion.id}`] ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <h5 className="font-medium text-sm mb-2">Suggested Code:</h5>
                                <div className="relative">
                                  <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
                                    {suggestion.suggestedCode}
                                  </pre>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2"
                                    onClick={() => copyToClipboard(suggestion.suggestedCode, `sugg-${suggestion.id}`)}
                                  >
                                    {copiedStates[`sugg-${suggestion.id}`] ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded">
                              <h5 className="font-medium text-sm mb-1">AI Reasoning:</h5>
                              <p className="text-sm text-gray-700">{suggestion.reasoning}</p>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                              <Badge 
                                variant={suggestion.impact === 'high' ? 'destructive' : 
                                        suggestion.impact === 'medium' ? 'default' : 'secondary'}
                              >
                                {suggestion.impact} impact
                              </Badge>
                              <Button
                                onClick={() => applySuggestionMutation.mutate(suggestion)}
                                disabled={applySuggestionMutation.isPending}
                                size="sm"
                              >
                                Apply Suggestion
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Completions Tab */}
          <TabsContent value="completions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Intelligent Code Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completionsLoading ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-gray-400 animate-pulse mb-4" />
                    <p className="text-gray-600">Generating completions...</p>
                  </div>
                ) : completions.length === 0 ? (
                  <div className="text-center py-8">
                    <Code className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Start typing to see intelligent code completions.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completions.map((completion) => (
                      <Card key={completion.id} className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                  {completion.trigger}
                                </code>
                                <Badge variant="outline">
                                  {completion.confidence}% confidence
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{completion.description}</p>
                              <div className="relative">
                                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                                  {completion.completion}
                                </pre>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2"
                                  onClick={() => copyToClipboard(completion.completion, completion.id)}
                                >
                                  {copiedStates[completion.id] ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refactoring Tab */}
          <TabsContent value="refactoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Refactoring Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {refactoringLoading ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-gray-400 animate-pulse mb-4" />
                    <p className="text-gray-600">Analyzing refactoring opportunities...</p>
                  </div>
                ) : refactoring.length === 0 ? (
                  <div className="text-center py-8">
                    <Code className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No refactoring opportunities found. Your code looks well-structured!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {refactoring.map((opportunity) => (
                      <Card key={opportunity.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{opportunity.title}</h4>
                              <p className="text-sm text-gray-600">{opportunity.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-100 text-purple-800">
                                {opportunity.type.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline">
                                {opportunity.effort} effort
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <h5 className="font-medium text-sm mb-2">Before:</h5>
                              <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto">
                                {opportunity.beforeCode}
                              </pre>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm mb-2">After:</h5>
                              <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
                                {opportunity.afterCode}
                              </pre>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-purple-50 rounded">
                            <h5 className="font-medium text-sm mb-2">Benefits:</h5>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {opportunity.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contextual Help Tab */}
          <TabsContent value="help" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contextual Help & Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {helpLoading ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-gray-400 animate-pulse mb-4" />
                    <p className="text-gray-600">Generating contextual help...</p>
                  </div>
                ) : contextualHelp.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Start coding to get contextual help and documentation.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contextualHelp.map((help) => (
                      <Card key={help.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{help.topic}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h5 className="font-medium mb-2">Documentation:</h5>
                            <p className="text-sm text-gray-700">{help.documentation}</p>
                          </div>

                          {help.examples.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Examples:</h5>
                              <div className="space-y-2">
                                {help.examples.map((example, index) => (
                                  <pre key={index} className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                    {example}
                                  </pre>
                                ))}
                              </div>
                            </div>
                          )}

                          {help.bestPractices.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Best Practices:</h5>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {help.bestPractices.map((practice, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    {practice}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {help.commonPitfalls.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Common Pitfalls:</h5>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {help.commonPitfalls.map((pitfall, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    {pitfall}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}