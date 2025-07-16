/**
 * Advanced File Explorer with IDE-like Functionality
 * Matches the Replit interface shown in the screenshot
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Folder, 
  File, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Download,
  Upload,
  Search,
  RefreshCw,
  Terminal,
  Play,
  Settings,
  GitBranch,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  lastModified?: string;
  content?: string;
  children?: FileItem[];
  isOpen?: boolean;
  language?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  rootPath: string;
  lastAccessed: string;
  type: string;
}

export default function FileExplorer() {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [openTabs, setOpenTabs] = useState<FileItem[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const queryClient = useQueryClient();

  // Fetch project structure
  const { data: fileStructure, isLoading: filesLoading } = useQuery({
    queryKey: ['/api/files/structure'],
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Fetch projects list
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });

  // File operations mutations
  const createFileMutation = useMutation({
    mutationFn: async (data: { name: string; type: 'file' | 'folder'; path: string; content?: string }) => {
      const response = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files/structure'] });
      toast({ title: 'Success', description: 'File created successfully' });
      setIsCreatingFile(false);
      setNewFileName('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create file', variant: 'destructive' });
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (path: string) => {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      if (!response.ok) throw new Error('Failed to delete file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files/structure'] });
      toast({ title: 'Success', description: 'File deleted successfully' });
    }
  });

  const saveFileMutation = useMutation({
    mutationFn: async (data: { path: string; content: string }) => {
      const response = await fetch('/api/files/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save file');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'File saved successfully' });
    }
  });

  // File language detection
  const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'sh': 'bash',
      'sql': 'sql'
    };
    return languageMap[ext || ''] || 'text';
  };

  // File icon component
  const FileIcon: React.FC<{ file: FileItem }> = ({ file }) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.path) ? 
        <FolderOpen className="w-4 h-4 text-blue-500" /> : 
        <Folder className="w-4 h-4 text-blue-500" />;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconClasses = "w-4 h-4";
    
    switch (ext) {
      case 'js': return <div className={`${iconClasses} bg-yellow-500 rounded text-white text-xs flex items-center justify-center font-bold`}>JS</div>;
      case 'ts': case 'tsx': return <div className={`${iconClasses} bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold`}>TS</div>;
      case 'py': return <div className={`${iconClasses} bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold`}>PY</div>;
      case 'java': return <div className={`${iconClasses} bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold`}>JA</div>;
      case 'css': return <div className={`${iconClasses} bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold`}>CS</div>;
      case 'html': return <div className={`${iconClasses} bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold`}>HT</div>;
      case 'json': return <div className={`${iconClasses} bg-gray-600 rounded text-white text-xs flex items-center justify-center font-bold`}>JS</div>;
      case 'md': return <div className={`${iconClasses} bg-indigo-500 rounded text-white text-xs flex items-center justify-center font-bold`}>MD</div>;
      default: return <File className={iconClasses} />;
    }
  };

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // Open file in tab
  const openFile = (file: FileItem) => {
    if (file.type === 'file') {
      const existingTab = openTabs.find(tab => tab.path === file.path);
      if (!existingTab) {
        setOpenTabs([...openTabs, file]);
      }
      setActiveTab(file.path);
      setSelectedFile(file);
    }
  };

  // Close tab
  const closeTab = (path: string) => {
    const newTabs = openTabs.filter(tab => tab.path !== path);
    setOpenTabs(newTabs);
    if (activeTab === path) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
    }
  };

  // Render file tree
  const renderFileTree = (items: FileItem[], level = 0): React.ReactNode => {
    if (!items) return null;

    return items
      .filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(item => (
        <div key={item.path} className={`select-none ${level === 0 ? '' : 'ml-4'}`}>
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
              selectedFile?.path === item.path ? 'bg-blue-100 dark:bg-blue-900' : ''
            }`}
            onClick={() => {
              if (item.type === 'folder') {
                toggleFolder(item.path);
              } else {
                openFile(item);
              }
            }}
          >
            <FileIcon file={item} />
            <span className="text-sm truncate flex-1">{item.name}</span>
            {item.type === 'file' && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-6 h-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFileMutation.mutate(item.path);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          {item.type === 'folder' && expandedFolders.has(item.path) && item.children && (
            <div className="ml-4">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      ));
  };

  // Create new file/folder
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const isFolder = newFileName.endsWith('/');
    const cleanName = newFileName.replace('/', '');
    
    createFileMutation.mutate({
      name: cleanName,
      type: isFolder ? 'folder' : 'file',
      path: `/${cleanName}`,
      content: isFolder ? undefined : ''
    });
  };

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Sidebar - File Explorer */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Folder className="w-5 h-5" />
              EXPLORER
            </h2>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                <Plus className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Project selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">LocalReplit</span>
            <Badge variant="secondary" className="text-xs">awesome-app</Badge>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              <GitBranch className="w-3 h-3 mr-1" />
              main
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* File tree */}
        <div className="flex-1 overflow-auto p-2">
          {filesLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Create new file input */}
              {isCreatingFile && (
                <div className="mb-2 px-2">
                  <Input
                    placeholder="File name (end with / for folder)"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleCreateFile();
                      if (e.key === 'Escape') setIsCreatingFile(false);
                    }}
                    autoFocus
                    className="text-sm"
                  />
                </div>
              )}
              
              {/* File tree */}
              <div className="space-y-1">
                {renderFileTree(fileStructure?.files || [])}
              </div>
            </>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setIsCreatingFile(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            <Button size="sm" variant="outline">
              <Upload className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Terminal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab bar */}
        {openTabs.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700 flex">
            {openTabs.map(tab => (
              <div
                key={tab.path}
                className={`flex items-center gap-2 px-4 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer ${
                  activeTab === tab.path ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                }`}
                onClick={() => setActiveTab(tab.path)}
              >
                <FileIcon file={tab} />
                <span className="text-sm">{tab.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-4 h-4 p-0 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.path);
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Editor content */}
        <div className="flex-1 overflow-auto">
          {activeTab && selectedFile ? (
            <div className="h-full">
              <Tabs value="editor" className="h-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="terminal">Terminal</TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="h-full mt-0">
                  <div className="h-full p-4">
                    <textarea
                      className="w-full h-full p-4 font-mono text-sm border border-gray-200 dark:border-gray-700 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedFile.content || ''}
                      onChange={(e) => {
                        if (selectedFile) {
                          setSelectedFile({ ...selectedFile, content: e.target.value });
                        }
                      }}
                      placeholder="Start coding..."
                      style={{ fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="h-full mt-0">
                  <div className="h-full p-4">
                    {selectedFile.language === 'markdown' ? (
                      <div className="prose dark:prose-invert max-w-none">
                        <pre>{selectedFile.content}</pre>
                      </div>
                    ) : (
                      <div className="text-gray-500">Preview not available for this file type</div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="terminal" className="h-full mt-0">
                  <div className="h-full bg-black text-green-400 p-4 font-mono text-sm">
                    <div>$ Ready to execute commands</div>
                    <div className="mt-2">Type 'help' for available commands</div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No file selected
                </h3>
                <p className="text-gray-500">
                  Select a file from the explorer to start editing
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="h-6 bg-blue-600 text-white text-xs flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span>VM Online</span>
            <span>main</span>
            <span>files: 42</span>
          </div>
          <div className="flex items-center gap-4">
            {selectedFile && (
              <>
                <span>{getFileLanguage(selectedFile.name)}</span>
                <span>UTF-8</span>
                <span>LF</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}