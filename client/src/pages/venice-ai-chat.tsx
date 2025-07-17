import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bot, Code, FileCode, Send, Settings, Sparkles, Copy, Check, Download } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface VeniceModel {
  id: string;
  name: string;
}

interface GeneratedCode {
  code: string;
  language: string;
  description: string;
  dependencies?: string[];
}

export default function VeniceAIChat() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('qwen2.5-coder-32b');
  const [language, setLanguage] = useState('typescript');
  const [framework, setFramework] = useState('');
  const [codeType, setCodeType] = useState<'function' | 'api' | 'frontend' | 'backend' | 'fullstack' | 'script' | 'class'>('function');
  const [includeTests, setIncludeTests] = useState(false);
  const [includeDocumentation, setIncludeDocumentation] = useState(true);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch available models
  const { data: modelsData } = useQuery({
    queryKey: ['/api/venice/models'],
    retry: false
  });

  // Generate code mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/venice/generate', data);
    },
    onSuccess: (data) => {
      if (data.code) {
        setGeneratedCode({
          code: data.code,
          language: data.language || language,
          description: data.description || 'Generated code',
          dependencies: data.dependencies
        });
        toast({
          title: "Code Generated",
          description: "Venice AI has generated your code successfully!"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Review code mutation
  const reviewMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/venice/review', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Code Review Complete",
        description: `Score: ${data.review?.score || 'N/A'}/100`
      });
    },
    onError: (error) => {
      toast({
        title: "Review Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description of what you want to generate",
        variant: "destructive"
      });
      return;
    }

    generateMutation.mutate({
      prompt,
      language,
      framework: framework === 'none' ? undefined : framework || undefined,
      type: codeType,
      includeTests,
      includeDocumentation
    });
  };

  const handleCopy = () => {
    if (generatedCode?.code) {
      navigator.clipboard.writeText(generatedCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard"
      });
    }
  };

  const handleDownload = () => {
    if (generatedCode?.code) {
      const blob = new Blob([generatedCode.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `venice-generated.${generatedCode.language}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReview = () => {
    if (generatedCode?.code) {
      reviewMutation.mutate({
        code: generatedCode.code,
        language: generatedCode.language
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Venice AI Code Generator</h1>
        <Badge variant="secondary">Uncensored</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qwen2.5-coder-32b">Qwen 2.5 Coder 32B (Best for coding)</SelectItem>
                  <SelectItem value="llama-3.3-70b">Llama 3.3 70B</SelectItem>
                  <SelectItem value="venice-uncensored">Venice Uncensored</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Code Type</Label>
              <Select value={codeType} onValueChange={(value: any) => setCodeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="function">Function</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                  <SelectItem value="frontend">Frontend Component</SelectItem>
                  <SelectItem value="backend">Backend Service</SelectItem>
                  <SelectItem value="fullstack">Full Stack App</SelectItem>
                  <SelectItem value="script">Script/Automation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Framework (Optional)</Label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="vue">Vue</SelectItem>
                  <SelectItem value="angular">Angular</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="fastapi">FastAPI</SelectItem>
                  <SelectItem value="django">Django</SelectItem>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="nextjs">Next.js</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Include Tests</Label>
                <Switch checked={includeTests} onCheckedChange={setIncludeTests} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Include Documentation</Label>
                <Switch checked={includeDocumentation} onCheckedChange={setIncludeDocumentation} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Generation Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Code
            </CardTitle>
            <CardDescription>
              Describe what you want to build and Venice AI will generate production-ready code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Prompt</Label>
                <Textarea
                  placeholder="Example: Create a REST API endpoint that validates email addresses and stores them in a database with rate limiting..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate} 
                  disabled={generateMutation.isPending}
                  className="flex-1"
                >
                  {generateMutation.isPending ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Generate Code
                    </>
                  )}
                </Button>
                {generatedCode && (
                  <Button 
                    onClick={handleReview}
                    variant="outline"
                    disabled={reviewMutation.isPending}
                  >
                    <FileCode className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                )}
              </div>

              {/* Generated Code Display */}
              {generatedCode && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">Generated Code</h3>
                      <p className="text-sm text-muted-foreground">{generatedCode.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {generatedCode.dependencies && generatedCode.dependencies.length > 0 && (
                    <div className="mb-3">
                      <Label className="text-sm">Dependencies:</Label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {generatedCode.dependencies.map((dep, idx) => (
                          <Badge key={idx} variant="secondary">{dep}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <ScrollArea className="h-[400px] w-full rounded-md border">
                    <SyntaxHighlighter
                      language={generatedCode.language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {generatedCode.code}
                    </SyntaxHighlighter>
                  </ScrollArea>
                </div>
              )}

              {/* Review Results */}
              {reviewMutation.data && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Code Review Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reviewMutation.data.review?.score && (
                        <div>
                          <Label>Score</Label>
                          <div className="text-2xl font-bold">{reviewMutation.data.review.score}/100</div>
                        </div>
                      )}
                      {reviewMutation.data.review?.issues && (
                        <div>
                          <Label>Issues Found</Label>
                          <ul className="list-disc list-inside text-sm">
                            {reviewMutation.data.review.issues.map((issue: string, idx: number) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {reviewMutation.data.review?.suggestions && (
                        <div>
                          <Label>Suggestions</Label>
                          <ul className="list-disc list-inside text-sm">
                            {reviewMutation.data.review.suggestions.map((suggestion: string, idx: number) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}