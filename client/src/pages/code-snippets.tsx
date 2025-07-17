import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Star, Search, Filter, Code, Zap, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  rating: string;
  views: number;
  isPublic: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

// Built-in code templates for offline operation
const builtInTemplates = {
  'react-component': {
    title: 'React Functional Component',
    description: 'Modern React component with TypeScript, hooks, and best practices',
    code: `import React, { useState, useEffect } from 'react';

interface Props {
  title?: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<Props> = ({ title = 'Default Title', onAction }) => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounted');
  }, []);

  const handleClick = () => {
    setIsLoading(true);
    setCount(prev => prev + 1);
    onAction?.();
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="component-container">
      <h2>{title}</h2>
      <p>Count: {count}</p>
      <button 
        onClick={handleClick} 
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? 'Loading...' : 'Click me'}
      </button>
    </div>
  );
};`,
    language: 'typescript',
    category: 'React',
    difficulty: 'intermediate',
    tags: ['react', 'typescript', 'hooks', 'component']
  },
  
  'express-api': {
    title: 'Express API with Authentication',
    description: 'Secure Express.js API with JWT authentication and middleware',
    code: `import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await findUserByUsername(username);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/protected', authenticateToken, (req: any, res) => {
  res.json({ message: 'Protected route accessed', user: req.user });
});

app.listen(5000, () => console.log('Server running on port 5000'));`,
    language: 'typescript',
    category: 'Backend',
    difficulty: 'advanced',
    tags: ['express', 'authentication', 'jwt', 'api']
  },

  'python-data': {
    title: 'Python Data Processing Utility',
    description: 'Complete data processing utility with pandas and error handling',
    code: `import json
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime
import logging

class DataProcessor:
    def __init__(self, log_level=logging.INFO):
        logging.basicConfig(level=log_level)
        self.logger = logging.getLogger(__name__)
        
    def load_json(self, file_path: str) -> Dict[str, Any]:
        try:
            with open(file_path, 'r') as file:
                data = json.load(file)
                self.logger.info(f"Successfully loaded JSON from {file_path}")
                return data
        except FileNotFoundError:
            self.logger.error(f"File {file_path} not found")
            return {}
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in {file_path}: {e}")
            return {}
    
    def process_csv(self, file_path: str) -> pd.DataFrame:
        try:
            df = pd.read_csv(file_path)
            df = df.dropna().drop_duplicates()
            df['processed_at'] = datetime.now()
            
            self.logger.info(f"Processed {len(df)} rows from {file_path}")
            return df
            
        except Exception as e:
            self.logger.error(f"Error processing CSV: {e}")
            return pd.DataFrame()
    
    def export_results(self, data: pd.DataFrame, output_path: str):
        try:
            if output_path.endswith('.json'):
                data.to_json(output_path, orient='records', indent=2)
            elif output_path.endswith('.csv'):
                data.to_csv(output_path, index=False)
            else:
                raise ValueError("Unsupported file format")
                
            self.logger.info(f"Data exported to {output_path}")
        except Exception as e:
            self.logger.error(f"Export failed: {e}")

# Example usage
if __name__ == "__main__":
    processor = DataProcessor()
    df = processor.process_csv('input.csv')
    processor.export_results(df, 'output.json')`,
    language: 'python',
    category: 'Data Processing',
    difficulty: 'intermediate',
    tags: ['python', 'pandas', 'data-processing', 'csv', 'json']
  },

  'js-algorithm': {
    title: 'JavaScript Algorithms & Data Structures',
    description: 'Advanced algorithms including binary search tree and sorting',
    code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(val) {
    const newNode = new TreeNode(val);
    if (!this.root) {
      this.root = newNode;
      return;
    }

    let current = this.root;
    while (true) {
      if (val < current.val) {
        if (!current.left) {
          current.left = newNode;
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          break;
        }
        current = current.right;
      }
    }
  }

  inOrderTraversal(node = this.root, result = []) {
    if (node) {
      this.inOrderTraversal(node.left, result);
      result.push(node.val);
      this.inOrderTraversal(node.right, result);
    }
    return result;
  }
}

const ArrayUtils = {
  quickSort(arr) {
    if (arr.length <= 1) return arr;
    
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = arr.filter(x => x < pivot);
    const middle = arr.filter(x => x === pivot);
    const right = arr.filter(x => x > pivot);
    
    return [...this.quickSort(left), ...middle, ...this.quickSort(right)];
  },

  binarySearch(sortedArray, target) {
    let left = 0, right = sortedArray.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (sortedArray[mid] === target) return mid;
      if (sortedArray[mid] < target) left = mid + 1;
      else right = mid - 1;
    }
    return -1;
  }
};

// Example usage
const bst = new BinarySearchTree();
[5, 3, 7, 2, 4, 6, 8].forEach(val => bst.insert(val));
console.log('BST traversal:', bst.inOrderTraversal());`,
    language: 'javascript',
    category: 'Algorithms',
    difficulty: 'advanced',
    tags: ['algorithms', 'data-structures', 'binary-tree', 'sorting']
  },

  'security-audit': {
    title: 'Security Audit Script',
    description: 'Comprehensive security analysis and vulnerability detection',
    code: `#!/usr/bin/env python3
import subprocess
import json
import hashlib
import os
from pathlib import Path

class SecurityAuditor:
    def __init__(self):
        self.report = {
            'timestamp': datetime.now().isoformat(),
            'vulnerabilities': [],
            'recommendations': [],
            'file_hashes': {}
        }
    
    def check_file_permissions(self, directory):
        """Check for files with dangerous permissions"""
        dangerous_files = []
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                filepath = os.path.join(root, file)
                try:
                    stat = os.stat(filepath)
                    mode = oct(stat.st_mode)[-3:]
                    
                    # Check for world-writable files
                    if mode.endswith('2') or mode.endswith('6') or mode.endswith('7'):
                        dangerous_files.append({
                            'file': filepath,
                            'permissions': mode,
                            'risk': 'high'
                        })
                except OSError:
                    continue
        
        return dangerous_files
    
    def scan_dependencies(self, package_file):
        """Scan package.json for known vulnerabilities"""
        try:
            result = subprocess.run(['npm', 'audit', '--json'], 
                                  capture_output=True, text=True)
            if result.stdout:
                audit_data = json.loads(result.stdout)
                return audit_data.get('vulnerabilities', {})
        except (subprocess.CalledProcessError, json.JSONDecodeError):
            return {}
    
    def check_secrets_exposure(self, directory):
        """Check for exposed secrets in code"""
        secret_patterns = [
            r'api[_-]?key[s]?\\s*[=:]\\s*[\'"][^\'"]',
            r'password\\s*[=:]\\s*[\'"][^\'"]',
            r'secret[_-]?key\\s*[=:]\\s*[\'"][^\'"]',
            r'token\\s*[=:]\\s*[\'"][^\'"]'
        ]
        
        exposed_secrets = []
        for pattern in secret_patterns:
            cmd = ['grep', '-r', '-i', '-n', pattern, directory]
            try:
                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.stdout:
                    exposed_secrets.extend(result.stdout.strip().split('\\n'))
            except subprocess.CalledProcessError:
                continue
        
        return exposed_secrets
    
    def generate_report(self):
        return {
            'summary': f"Found {len(self.report['vulnerabilities'])} vulnerabilities",
            'details': self.report,
            'recommendations': [
                'Update all dependencies to latest versions',
                'Review file permissions regularly',
                'Use environment variables for secrets',
                'Enable HTTPS and security headers'
            ]
        }

# Usage
auditor = SecurityAuditor()
report = auditor.generate_report()
print(json.dumps(report, indent=2))`,
    language: 'python',
    category: 'Security',
    difficulty: 'advanced',
    tags: ['security', 'audit', 'vulnerability', 'scanning']
  }
};

const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift'];
const categories = ['React', 'Backend', 'Data Processing', 'Algorithms', 'Security', 'AI/ML', 'DevOps', 'Database', 'Mobile', 'Web APIs'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

export default function CodeSnippets() {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  
  // Generation form state
  const [prompt, setPrompt] = useState('');
  const [genLanguage, setGenLanguage] = useState('typescript');
  const [genCategory, setGenCategory] = useState('React');
  const [genDifficulty, setGenDifficulty] = useState('intermediate');
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ['/api/code-snippets'],
  });

  const generateSnippetMutation = useMutation({
    mutationFn: async (data: { prompt: string; language: string; category: string; difficulty: string }) => {
      // Use built-in templates for offline operation
      const templates = Object.keys(builtInTemplates);
      const matchedTemplate = templates.find(key => 
        data.prompt.toLowerCase().includes(key.split('-')[0]) ||
        data.category.toLowerCase() === builtInTemplates[key as keyof typeof builtInTemplates].category.toLowerCase()
      ) || 'react-component';

      const template = builtInTemplates[matchedTemplate as keyof typeof builtInTemplates];
      
      const snippetData = {
        title: `${template.title} - ${data.prompt}`,
        description: `${template.description} - Generated for: ${data.prompt}`,
        code: template.code,
        language: data.language,
        category: data.category,
        difficulty: data.difficulty,
        tags: template.tags,
        isPublic: true
      };

      return apiRequest('/api/code-snippets', {
        method: 'POST',
        body: JSON.stringify(snippetData),
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Code snippet generated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/code-snippets'] });
      setPrompt('');
      setActiveTab('browse');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to generate snippet' });
    },
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Error', description: 'Please enter a prompt' });
      return;
    }

    setIsGenerating(true);
    try {
      await generateSnippetMutation.mutateAsync({
        prompt,
        language: genLanguage,
        category: genCategory,
        difficulty: genDifficulty
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: 'Copied!', description: 'Code copied to clipboard' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy code' });
    }
  };

  const filteredSnippets = snippets.filter((snippet: CodeSnippet) => {
    const matchesSearch = !searchTerm || 
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLanguage = !selectedLanguage || snippet.language === selectedLanguage;
    const matchesCategory = !selectedCategory || snippet.category === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || snippet.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesLanguage && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Code Snippets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate and browse AI-powered code snippets with built-in templates
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Browse Snippets
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Generate New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <Input
                placeholder="Search snippets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Languages</SelectItem>
                  {languages.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  {difficulties.map(diff => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Snippets Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
            <div className="text-center py-12">
              <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {snippets.length === 0 ? 'No snippets yet' : 'No matching snippets'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {snippets.length === 0 
                  ? 'Generate your first code snippet to get started'
                  : 'Try adjusting your search or filters'
                }
              </p>
              <Button onClick={() => setActiveTab('generate')} className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Generate Snippet
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSnippets.map((snippet: CodeSnippet) => (
                <Card key={snippet.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{snippet.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {snippet.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(snippet.code)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary">{snippet.language}</Badge>
                      <Badge variant="outline">{snippet.category}</Badge>
                      <Badge 
                        variant="outline" 
                        className={
                          snippet.difficulty === 'Beginner' ? 'text-green-600 border-green-600' :
                          snippet.difficulty === 'Intermediate' ? 'text-yellow-600 border-yellow-600' :
                          'text-red-600 border-red-600'
                        }
                      >
                        {snippet.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto max-h-48">
                      <code>{snippet.code}</code>
                    </pre>
                    
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {snippet.rating || '0'}
                        </span>
                        <span>{snippet.views} views</span>
                      </div>
                      <div className="flex gap-1">
                        {snippet.tags?.map((tag: string) => (
                          <span key={tag} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Generate Code Snippet
              </CardTitle>
              <CardDescription>
                Create custom code snippets using built-in templates and AI-powered generation
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Describe what you want to build</label>
                <Textarea
                  placeholder="e.g., React component for user authentication, Python script for data analysis, Express API with error handling..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <Select value={genLanguage} onValueChange={setGenLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={genCategory} onValueChange={setGenCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <Select value={genDifficulty} onValueChange={setGenDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map(diff => (
                        <SelectItem key={diff} value={diff.toLowerCase()}>{diff}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Code Snippet'}
              </Button>
            </CardContent>
          </Card>

          {/* Template Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>
                Built-in templates for common development patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(builtInTemplates).map(([key, template]) => (
                  <div key={key} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                       onClick={() => setPrompt(template.title)}>
                    <h4 className="font-medium">{template.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{template.language}</Badge>
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    </div>
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