import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Code, 
  Copy, 
  Check, 
  Sparkles, 
  Star,
  Eye,
  Search,
  Plus,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css'
];

const CATEGORIES = [
  'algorithms', 'data-structures', 'web-development', 'mobile', 'api',
  'database', 'ai-ml', 'security', 'testing', 'devops', 'utilities', 'other'
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export default function CodeSnippets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showGenerator, setShowGenerator] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // Generator form state
  const [generatorForm, setGeneratorForm] = useState({
    prompt: "",
    language: "javascript",
    category: "utilities",
    difficulty: "intermediate"
  });

  const queryClient = useQueryClient();

  // Fetch code snippets
  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ['/api/code-snippets', searchQuery, selectedLanguage, selectedCategory],
    queryFn: () => apiRequest(`/api/code-snippets?search=${searchQuery}&language=${selectedLanguage}&category=${selectedCategory}`),
  });

  // Generate snippet mutation
  const generateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/code-snippets/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      // Create and save the generated snippet
      createSnippetMutation.mutate(data);
    },
  });

  // Create snippet mutation
  const createSnippetMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/code-snippets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/code-snippets'] });
      setShowGenerator(false);
      setGeneratorForm({
        prompt: "",
        language: "javascript",
        category: "utilities",
        difficulty: "intermediate"
      });
    },
  });

  // Rate snippet mutation
  const rateMutation = useMutation({
    mutationFn: ({ id, rating }: { id: number; rating: number }) => 
      apiRequest(`/api/code-snippets/${id}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/code-snippets'] });
    },
  });

  const handleCopy = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleGenerate = () => {
    if (!generatorForm.prompt.trim()) return;
    generateMutation.mutate(generatorForm);
  };

  const handleRate = (snippetId: number, rating: number) => {
    rateMutation.mutate({ id: snippetId, rating });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Code className="w-8 h-8 text-blue-500" />
            Code Snippet Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered code generation with one-click copy functionality
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 items-center">
            <Button
              onClick={() => setShowGenerator(!showGenerator)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate New Snippet
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generator Form */}
        {showGenerator && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Generate Code Snippet
              </CardTitle>
              <CardDescription>
                Describe what you want to create and let AI generate it for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(generateMutation.error || createSnippetMutation.error) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {generateMutation.error?.message || createSnippetMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <Textarea
                placeholder="Describe the code you want to generate (e.g., 'Create a function to validate email addresses with regex')"
                value={generatorForm.prompt}
                onChange={(e) => setGeneratorForm(prev => ({...prev, prompt: e.target.value}))}
                rows={3}
              />
              
              <div className="flex gap-4">
                <Select 
                  value={generatorForm.language} 
                  onValueChange={(value) => setGeneratorForm(prev => ({...prev, language: value}))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={generatorForm.category} 
                  onValueChange={(value) => setGeneratorForm(prev => ({...prev, category: value}))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={generatorForm.difficulty} 
                  onValueChange={(value) => setGeneratorForm(prev => ({...prev, difficulty: value}))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((diff) => (
                      <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate}
                  disabled={!generatorForm.prompt.trim() || generateMutation.isPending || createSnippetMutation.isPending}
                  className="gap-2"
                >
                  {(generateMutation.isPending || createSnippetMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate Code
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowGenerator(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && snippets.length === 0 && (
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No snippets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Generate your first code snippet to get started
            </p>
            <Button onClick={() => setShowGenerator(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Generate Snippet
            </Button>
          </div>
        )}

        {/* Snippets List */}
        <div className="space-y-6">
          {snippets.map((snippet: any) => (
            <Card key={snippet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{snippet.title}</CardTitle>
                    <CardDescription className="mt-2 text-base">{snippet.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(snippet.code, snippet.id)}
                    className="gap-2 shrink-0"
                  >
                    {copiedId === snippet.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedId === snippet.id ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">{snippet.language}</Badge>
                  <Badge variant="outline">{snippet.category}</Badge>
                  <Badge variant="outline">{snippet.difficulty}</Badge>
                  {snippet.tags?.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{snippet.code}</code>
                  </pre>
                  
                  {snippet.usage && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Usage Instructions:</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {snippet.usage}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {snippet.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {snippet.rating || 0}/5.0
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(snippet.id, star)}
                          disabled={rateMutation.isPending}
                        >
                          <Star
                            className={`w-4 h-4 cursor-pointer hover:text-yellow-400 ${
                              star <= (snippet.rating || 0)
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}