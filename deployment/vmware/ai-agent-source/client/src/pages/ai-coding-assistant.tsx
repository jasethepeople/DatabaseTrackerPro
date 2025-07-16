import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bot, 
  Code, 
  Lightbulb, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Play,
  Copy,
  Wand2,
  Brain,
  FileCode,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeSuggestion {
  id: string;
  type: 'optimization' | 'bug_fix' | 'best_practice' | 'security' | 'performance';
  title: string;
  description: string;
  code: string;
  confidence: number;
  line?: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoApplicable: boolean;
}

interface CodeCompletion {
  id: string;
  insertText: string;
  displayText: string;
  detail: string;
  kind: 'function' | 'variable' | 'class' | 'method' | 'property' | 'keyword';
  confidence: number;
}

interface ContextualHelp {
  documentation: string;
  examples: string[];
  relatedFiles: string[];
  usagePatterns: string[];
}

interface RefactoringSuggestion {
  id: string;
  title: string;
  description: string;
  before: string;
  after: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  benefits: string[];
}

interface AIResponse {
  suggestions: CodeSuggestion[];
  completions: CodeCompletion[];
  contextualHelp: ContextualHelp;
  refactoringSuggestions: RefactoringSuggestion[];
}

export default function AICodingAssistant() {
  const [activeTab, setActiveTab] = useState('editor');
  const [code, setCode] = useState(`// Welcome to the AI Coding Assistant!
// Start typing your code and get intelligent suggestions

function calculateSum(numbers) {
  let total = 0;
  for (var i = 0; i < numbers.length; i++) {
    total = total + numbers[i];
  }
  return total;
}

// This function could be improved...
async function fetchUserData(userId) {
  const response = await fetch('/api/users/' + userId);
  const data = response.json();
  return data;
}`);
  const [language, setLanguage] = useState('typescript');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI analysis
  const { data: aiAnalysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ['/api/ai-assistant/analyze'],
    enabled: false // We'll trigger this manually
  });

  // Fetch assistant stats
  const { data: assistantStats } = useQuery({
    queryKey: ['/api/ai-assistant/stats']
  });

  // Apply suggestion mutation
  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestion: CodeSuggestion) => {
      return apiRequest('/api/ai-assistant/apply-suggestion', 'POST', {
        suggestionId: suggestion.id,
        code,
        cursorPosition
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        setCode(data.updatedCode);
        setAppliedSuggestions(prev => [...prev, data.suggestionId]);
        toast({
          title: "Suggestion Applied",
          description: "Code has been updated successfully.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to apply suggestion.",
        variant: "destructive",
      });
    }
  });

  // Analyze code mutation
  const analyzeCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/ai-assistant/analyze', 'POST', {
        currentFile: 'editor.ts',
        currentCode: code,
        cursorPosition,
        selectedText,
        projectFiles: ['app.ts', 'utils.ts', 'components.tsx'],
        recentFiles: ['app.ts'],
        language
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/ai-assistant/analyze'], data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.suggestions?.length || 0} suggestions and ${data.completions?.length || 0} completions.`,
      });
    }
  });

  const handleCodeChange = (value: string) => {
    setCode(value);
    
    // Auto-trigger analysis on code changes (debounced)
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        analyzeCodeMutation.mutate();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handleCursorPositionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
      setSelectedText(textareaRef.current.value.substring(
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd
      ));
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard.",
    });
  };

  const renderSuggestion = (suggestion: CodeSuggestion, index: number) => (
    <Card key={suggestion.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon(suggestion.severity)}
            <CardTitle className="text-base">{suggestion.title}</CardTitle>
            <Badge className={getSeverityColor(suggestion.severity)}>
              {suggestion.severity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {Math.round(suggestion.confidence * 100)}% confidence
            </Badge>
          </div>
          <div className="flex gap-2">
            {suggestion.autoApplicable && (
              <Button
                size="sm"
                onClick={() => applySuggestionMutation.mutate(suggestion)}
                disabled={applySuggestionMutation.isPending}
                className="gap-2"
              >
                <Wand2 className="h-3 w-3" />
                Auto Apply
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(suggestion.code)}
              className="gap-2"
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
          </div>
        </div>
        <CardDescription>{suggestion.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
          <pre className="text-sm overflow-x-auto"><code>{suggestion.code}</code></pre>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompletion = (completion: CodeCompletion, index: number) => (
    <Card key={completion.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-sm">{completion.displayText}</div>
              <div className="text-xs text-muted-foreground">{completion.detail}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {completion.kind}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(completion.insertText)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRefactoringSuggestion = (suggestion: RefactoringSuggestion, index: number) => (
    <Card key={suggestion.id} className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-base">{suggestion.title}</CardTitle>
            <Badge variant={suggestion.impact === 'high' ? 'default' : 'secondary'}>
              {suggestion.impact} impact
            </Badge>
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <Play className="h-3 w-3" />
            Preview
          </Button>
        </div>
        <CardDescription>{suggestion.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Before:</h4>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            <pre className="text-sm"><code>{suggestion.before}</code></pre>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">After:</h4>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <pre className="text-sm"><code>{suggestion.after}</code></pre>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Benefits:</h4>
          <ul className="text-sm list-disc list-inside space-y-1">
            {suggestion.benefits.map((benefit, i) => (
              <li key={i} className="text-muted-foreground">{benefit}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-blue-500" />
              AI Coding Assistant
            </h1>
            <p className="text-muted-foreground mt-2">
              Intelligent code analysis, suggestions, and context-aware completions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => analyzeCodeMutation.mutate()}
              disabled={analyzeCodeMutation.isPending}
              className="gap-2"
            >
              <Brain className="h-4 w-4" />
              {analyzeCodeMutation.isPending ? 'Analyzing...' : 'Analyze Code'}
            </Button>
          </div>
        </div>

        {/* Assistant Stats */}
        {assistantStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistantStats.knowledgeBaseSize}</div>
                <p className="text-xs text-muted-foreground">Pattern libraries loaded</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning History</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistantStats.learningHistorySize}</div>
                <p className="text-xs text-muted-foreground">Interactions recorded</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Context Cache</CardTitle>
                <FileCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistantStats.contextCacheSize}</div>
                <p className="text-xs text-muted-foreground">Cached contexts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applied Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appliedSuggestions.length}</div>
                <p className="text-xs text-muted-foreground">Suggestions applied</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="editor">Code Editor</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="completions">Completions</TabsTrigger>
            <TabsTrigger value="refactoring">Refactoring</TabsTrigger>
            <TabsTrigger value="help">Contextual Help</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Smart Code Editor</CardTitle>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="react">React/JSX</SelectItem>
                      <SelectItem value="node">Node.js</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription>
                  Write your code below and get real-time AI-powered suggestions and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onSelect={handleCursorPositionChange}
                  onKeyUp={handleCursorPositionChange}
                  placeholder="Start typing your code here..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                  <span>Language: {language}</span>
                  <span>Cursor: {cursorPosition}</span>
                  <span>Selected: {selectedText.length} chars</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Suggestions
                  {analysisLoading && <Badge variant="secondary">Analyzing...</Badge>}
                </CardTitle>
                <CardDescription>
                  Intelligent suggestions to improve your code quality, performance, and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiAnalysis?.suggestions?.length > 0 ? (
                  aiAnalysis.suggestions.map((suggestion: CodeSuggestion, index: number) =>
                    renderSuggestion(suggestion, index)
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No suggestions available. Analyze your code to get AI-powered recommendations.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Smart Completions
                </CardTitle>
                <CardDescription>
                  Context-aware code completions and intelligent snippets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiAnalysis?.completions?.length > 0 ? (
                  aiAnalysis.completions.map((completion: CodeCompletion, index: number) =>
                    renderCompletion(completion, index)
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completions available. Start typing to see intelligent suggestions.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refactoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Refactoring Opportunities
                </CardTitle>
                <CardDescription>
                  AI-identified opportunities to improve code structure and maintainability
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiAnalysis?.refactoringSuggestions?.length > 0 ? (
                  aiAnalysis.refactoringSuggestions.map((suggestion: RefactoringSuggestion, index: number) =>
                    renderRefactoringSuggestion(suggestion, index)
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No refactoring opportunities found. Your code looks well-structured!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-green-500" />
                  Contextual Help
                </CardTitle>
                <CardDescription>
                  Documentation, examples, and usage patterns for your current code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiAnalysis?.contextualHelp ? (
                  <div className="space-y-6">
                    {aiAnalysis.contextualHelp.documentation && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Documentation</h3>
                        <p className="text-muted-foreground">{aiAnalysis.contextualHelp.documentation}</p>
                      </div>
                    )}
                    
                    {aiAnalysis.contextualHelp.examples.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Examples</h3>
                        <div className="space-y-3">
                          {aiAnalysis.contextualHelp.examples.map((example: string, index: number) => (
                            <div key={index} className="bg-muted p-3 rounded-md">
                              <pre className="text-sm"><code>{example}</code></pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {aiAnalysis.contextualHelp.relatedFiles.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Related Files</h3>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.contextualHelp.relatedFiles.map((file: string, index: number) => (
                            <Badge key={index} variant="outline">{file}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No contextual help available. Analyze your code to get relevant documentation and examples.</p>
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