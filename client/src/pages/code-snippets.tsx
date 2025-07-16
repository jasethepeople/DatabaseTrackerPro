import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Code, 
  Copy, 
  Check, 
  Sparkles, 
  Search, 
  Star,
  Download,
  Eye,
  Filter,
  Zap,
  BookOpen,
  Settings
} from "lucide-react";

interface CodeSnippet {
  id: number;
  title: string;
  description: string;
  code: string;
  language: string;
  category: string;
  difficulty: string;
  tags: string[];
  usage: string;
  createdAt: string;
  rating: number;
  views: number;
}

export default function CodeSnippets() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [category, setCategory] = useState("general");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing snippets
  const { data: snippets = [], isLoading: snippetsLoading } = useQuery({
    queryKey: ["/api/code-snippets", { search: searchQuery, language: filterLanguage, category: filterCategory }],
  });

  // Generate new snippet mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/code-snippets/generate", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/code-snippets"] });
      setPrompt("");
      toast({
        title: "Snippet Generated",
        description: "Your AI-powered code snippet has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate code snippet",
        variant: "destructive",
      });
    },
  });

  // Save snippet mutation
  const saveMutation = useMutation({
    mutationFn: async (snippet: any) => {
      return await apiRequest("/api/code-snippets", {
        method: "POST",
        body: snippet,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/code-snippets"] });
      toast({
        title: "Snippet Saved",
        description: "Code snippet has been saved to your library.",
      });
    },
  });

  // Rate snippet mutation
  const rateMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: number; rating: number }) => {
      return await apiRequest(`/api/code-snippets/${id}/rate`, {
        method: "POST",
        body: { rating },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/code-snippets"] });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please describe what code you want to generate.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      prompt,
      language,
      category,
      difficulty,
    });
  };

  const handleCopy = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Code snippet has been copied successfully.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy code to clipboard.",
        variant: "destructive",
      });
    }
  };

  const languages = [
    "javascript", "typescript", "python", "java", "cpp", "csharp", 
    "go", "rust", "php", "ruby", "swift", "kotlin", "html", "css"
  ];

  const categories = [
    "general", "algorithms", "data-structures", "web-development", 
    "mobile", "api", "database", "ai-ml", "security", "testing", 
    "devops", "utilities"
  ];

  const difficulties = ["beginner", "intermediate", "advanced"];

  const filteredSnippets = snippets.filter((snippet: CodeSnippet) => {
    const matchesSearch = !searchQuery || 
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLanguage = filterLanguage === "all" || snippet.language === filterLanguage;
    const matchesCategory = filterCategory === "all" || snippet.category === filterCategory;
    
    return matchesSearch && matchesLanguage && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            AI Code Snippet Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate, save, and manage code snippets with AI-powered assistance
          </p>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Zap className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <BookOpen className="w-4 h-4" />
              My Library
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-500" />
                  Generate New Snippet
                </CardTitle>
                <CardDescription>
                  Describe what you want to code and let AI generate it for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Difficulty</label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((diff) => (
                          <SelectItem key={diff} value={diff}>
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">What do you want to code?</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the functionality you want to implement (e.g., 'A function to validate email addresses', 'API endpoint for user authentication', 'React component for data visualization')"
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !prompt.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Settings className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Code Snippet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Result */}
            {generateMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-green-500" />
                      Generated Snippet
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(generateMutation.data.code, 0)}
                        className="gap-2"
                      >
                        {copiedId === 0 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveMutation.mutate(generateMutation.data)}
                        disabled={saveMutation.isPending}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Save
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>{generateMutation.data.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Badge variant="outline">{generateMutation.data.language}</Badge>
                      <Badge variant="outline">{generateMutation.data.category}</Badge>
                      <Badge variant="outline">{generateMutation.data.difficulty}</Badge>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{generateMutation.data.code}</code>
                    </pre>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Usage Instructions:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {generateMutation.data.usage}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Search snippets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Languages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Snippets Grid */}
            {snippetsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredSnippets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No snippets found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || filterLanguage !== "all" || filterCategory !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Generate your first code snippet to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSnippets.map((snippet: CodeSnippet) => (
                  <Card key={snippet.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{snippet.title}</CardTitle>
                          <CardDescription className="mt-1">{snippet.description}</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(snippet.code, snippet.id)}
                          className="gap-2"
                        >
                          {copiedId === snippet.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          Copy
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{snippet.language}</Badge>
                        <Badge variant="outline">{snippet.category}</Badge>
                        <Badge variant="outline">{snippet.difficulty}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto max-h-48">
                        <code>{snippet.code}</code>
                      </pre>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {snippet.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {snippet.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 cursor-pointer ${
                                star <= snippet.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                              onClick={() => rateMutation.mutate({ id: snippet.id, rating: star })}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}