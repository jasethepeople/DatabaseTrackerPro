import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Wand2, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Eye, 
  Code, 
  Zap,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock
} from "lucide-react";

interface RefactoringSuggestion {
  id: string;
  type: 'performance' | 'readability' | 'security' | 'modern' | 'optimization';
  title: string;
  description: string;
  original: string;
  refactored: string;
  impact: 'low' | 'medium' | 'high';
  language: string;
  explanation: string;
  benefits: string[];
  confidence: number;
}

interface AnalysisMetrics {
  complexity: number;
  maintainability: number;
  performance: number;
  security: number;
  codeSmells: number;
  linesOfCode: number;
}

export default function CodeRefactoring() {
  const [code, setCode] = useState(`function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    if (items[i].price && items[i].quantity) {
      total = total + (items[i].price * items[i].quantity);
    }
  }
  return total;
}

const users = [
  { name: "John", age: 25, active: true },
  { name: "Jane", age: 30, active: false },
  { name: "Bob", age: 35, active: true }
];

function getActiveUsers(users) {
  const result = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].active === true) {
      result.push(users[i]);
    }
  }
  return result;
}`);
  
  const [language, setLanguage] = useState('javascript');
  const [suggestions, setSuggestions] = useState<RefactoringSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<RefactoringSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [previewMode, setPreviewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const { toast } = useToast();

  const analyzeCode = useCallback(async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/code/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      setSuggestions(data.suggestions);
      setMetrics(data.metrics);
      
      toast({
        title: "Analysis Complete",
        description: `Found ${data.suggestions.length} refactoring opportunities`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language, toast]);

  const applyRefactoring = (suggestion: RefactoringSuggestion) => {
    const updatedCode = code.replace(suggestion.original, suggestion.refactored);
    setCode(updatedCode);
    setSelectedSuggestion(null);
    
    toast({
      title: "Refactoring Applied",
      description: suggestion.title,
    });
    
    // Re-analyze after applying refactoring
    setTimeout(analyzeCode, 500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  // Auto-analyze on code changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim() && code.length > 50) {
        analyzeCode();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, analyzeCode]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'readability': return <Eye className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'modern': return <TrendingUp className="w-4 h-4" />;
      case 'optimization': return <Code className="w-4 h-4" />;
      default: return <Wand2 className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'bg-yellow-500';
      case 'readability': return 'bg-blue-500';
      case 'security': return 'bg-red-500';
      case 'modern': return 'bg-green-500';
      case 'optimization': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Code Refactoring
        </h1>
        <p className="text-gray-400">
          Get intelligent suggestions to improve your code quality, performance, and maintainability
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code Input Section */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Code Editor</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={analyzeCode}
                    disabled={isAnalyzing || !code.trim()}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    Analyze
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here for analysis..."
                className="min-h-[400px] font-mono text-sm bg-gray-800 border-gray-600"
              />
              
              {metrics && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{metrics.complexity}</div>
                    <div className="text-xs text-gray-400">Complexity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{metrics.maintainability}%</div>
                    <div className="text-xs text-gray-400">Maintainability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{metrics.performance}%</div>
                    <div className="text-xs text-gray-400">Performance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{metrics.security}%</div>
                    <div className="text-xs text-gray-400">Security</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{metrics.codeSmells}</div>
                    <div className="text-xs text-gray-400">Code Smells</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{metrics.linesOfCode}</div>
                    <div className="text-xs text-gray-400">Lines of Code</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Panel */}
        <div>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Suggestions ({suggestions.length})
              </CardTitle>
              <CardDescription>
                AI-powered refactoring opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-400">Analyzing code...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No suggestions available</p>
                  <p className="text-sm">Add code above to get started</p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSuggestion?.id === suggestion.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${getTypeColor(suggestion.type)}`}>
                          {getTypeIcon(suggestion.type)}
                        </div>
                        <span className="font-medium text-white text-sm">
                          {suggestion.title}
                        </span>
                      </div>
                      <Badge className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                        {suggestion.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {suggestion.confidence}% confidence
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyRefactoring(suggestion);
                        }}
                        className="text-xs h-6"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Section */}
      {selectedSuggestion && (
        <Card className="mt-6 bg-gray-900 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Refactoring Preview: {selectedSuggestion.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(previewMode === 'side-by-side' ? 'overlay' : 'side-by-side')}
                >
                  {previewMode === 'side-by-side' ? 'Overlay' : 'Side by Side'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyRefactoring(selectedSuggestion)}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Apply Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSuggestion(null)}
                >
                  <XCircle className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="font-semibold text-white mb-2">Benefits:</h4>
              <ul className="list-disc list-inside space-y-1">
                {selectedSuggestion.benefits.map((benefit, index) => (
                  <li key={index} className="text-sm text-gray-300">{benefit}</li>
                ))}
              </ul>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400">{selectedSuggestion.explanation}</p>
            </div>

            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comparison">Code Comparison</TabsTrigger>
                <TabsTrigger value="metrics">Impact Metrics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comparison" className="space-y-4">
                {previewMode === 'side-by-side' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-red-400">Original Code</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedSuggestion.original)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto border border-red-500/30">
                        <code className="text-gray-300">{selectedSuggestion.original}</code>
                      </pre>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-green-400">Refactored Code</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedSuggestion.refactored)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto border border-green-500/30">
                        <code className="text-gray-300">{selectedSuggestion.refactored}</code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="w-3 h-3 bg-red-500 rounded"></span>
                      Removed
                      <span className="w-3 h-3 bg-green-500 rounded ml-4"></span>
                      Added
                    </div>
                    <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                      <code className="text-gray-300">
                        <span className="bg-red-500/20 text-red-300">- {selectedSuggestion.original}</span>
                        {'\n'}
                        <span className="bg-green-500/20 text-green-300">+ {selectedSuggestion.refactored}</span>
                      </code>
                    </pre>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="metrics">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-800 rounded">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="text-lg font-bold text-white">+15%</div>
                    <div className="text-xs text-gray-400">Performance</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded">
                    <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-lg font-bold text-white">+25%</div>
                    <div className="text-xs text-gray-400">Readability</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <div className="text-lg font-bold text-white">-30%</div>
                    <div className="text-xs text-gray-400">Complexity</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded">
                    <Code className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-lg font-bold text-white">-5</div>
                    <div className="text-xs text-gray-400">Lines</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}