import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  GitBranch, 
  GitCommit, 
  GitMerge,
  GitPullRequest,
  Plus,
  Check,
  X,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  untracked: string[];
  staged: string[];
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: number;
}

interface Branch {
  name: string;
  current: boolean;
  lastCommit: string;
  ahead: number;
  behind: number;
}

export default function VersionControl() {
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const { toast } = useToast();
  
  // Get git status
  const { data: gitStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/git/status'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  // Get commit history
  const { data: commits = [] } = useQuery({
    queryKey: ['/api/git/commits']
  });
  
  // Get branches
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/git/branches']
  });
  
  // Stage files mutation
  const stageFilesMutation = useMutation({
    mutationFn: async (files: string[]) => {
      return await apiRequest('POST', '/api/git/stage', { files });
    },
    onSuccess: () => {
      toast({
        title: "Files Staged",
        description: "Selected files have been staged for commit"
      });
      refetchStatus();
    }
  });
  
  // Commit mutation
  const commitMutation = useMutation({
    mutationFn: async (data: { message: string; files: string[] }) => {
      return await apiRequest('POST', '/api/git/commit', data);
    },
    onSuccess: () => {
      toast({
        title: "Changes Committed",
        description: "Your changes have been committed"
      });
      setCommitMessage('');
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/git'] });
    }
  });
  
  // Push mutation
  const pushMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/git/push');
    },
    onSuccess: () => {
      toast({
        title: "Pushed Successfully",
        description: "Your changes have been pushed to remote"
      });
      refetchStatus();
    }
  });
  
  // Pull mutation
  const pullMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/git/pull');
    },
    onSuccess: () => {
      toast({
        title: "Pulled Successfully",
        description: "Latest changes have been pulled from remote"
      });
      refetchStatus();
    }
  });
  
  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('POST', '/api/git/branch', { name });
    },
    onSuccess: () => {
      toast({
        title: "Branch Created",
        description: `New branch '${newBranchName}' created successfully`
      });
      setNewBranchName('');
      queryClient.invalidateQueries({ queryKey: ['/api/git/branches'] });
    }
  });
  
  // Switch branch mutation
  const switchBranchMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('POST', '/api/git/checkout', { branch: name });
    },
    onSuccess: (_, name) => {
      toast({
        title: "Branch Switched",
        description: `Switched to branch '${name}'`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/git'] });
    }
  });
  
  const handleFileSelect = (file: string) => {
    setSelectedFiles(prev => 
      prev.includes(file) 
        ? prev.filter(f => f !== file)
        : [...prev, file]
    );
  };
  
  const handleCommit = () => {
    if (commitMessage && selectedFiles.length > 0) {
      commitMutation.mutate({ message: commitMessage, files: selectedFiles });
    }
  };
  
  const allChangedFiles = [
    ...(gitStatus?.modified || []).map(f => ({ name: f, status: 'modified' })),
    ...(gitStatus?.untracked || []).map(f => ({ name: f, status: 'untracked' })),
    ...(gitStatus?.staged || []).map(f => ({ name: f, status: 'staged' }))
  ];
  
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--github-dark)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GitBranch className="h-8 w-8" />
              Version Control
            </h1>
            <p className="text-gray-400 mt-1">Manage your code with Git</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => pullMutation.mutate()}
              disabled={pullMutation.isPending}
            >
              <ArrowDownRight className="h-4 w-4 mr-2" />
              Pull
            </Button>
            <Button
              onClick={() => pushMutation.mutate()}
              disabled={pushMutation.isPending || (gitStatus?.ahead || 0) === 0}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Push {gitStatus?.ahead ? `(${gitStatus.ahead})` : ''}
            </Button>
          </div>
        </div>
        
        {/* Status Bar */}
        {gitStatus && (
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <span className="font-medium">{gitStatus.branch}</span>
                  </div>
                  {gitStatus.ahead > 0 && (
                    <Badge variant="outline" className="text-green-400">
                      {gitStatus.ahead} ahead
                    </Badge>
                  )}
                  {gitStatus.behind > 0 && (
                    <Badge variant="outline" className="text-yellow-400">
                      {gitStatus.behind} behind
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">
                    {gitStatus.modified.length} modified
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">
                    {gitStatus.untracked.length} untracked
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">
                    {gitStatus.staged.length} staged
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main Content */}
        <Tabs defaultValue="changes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="changes">Changes</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
          </TabsList>
          
          {/* Changes Tab */}
          <TabsContent value="changes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Uncommitted Changes</CardTitle>
                <CardDescription>
                  Select files to stage and commit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allChangedFiles.length === 0 ? (
                  <p className="text-center py-8 text-gray-400">
                    No changes detected. Your working directory is clean.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allChangedFiles.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleFileSelect(file.name)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.name)}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm">{file.name}</span>
                        </div>
                        <Badge
                          variant={file.status === 'staged' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {file.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedFiles.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Commit Message
                      </label>
                      <Textarea
                        placeholder="Describe your changes..."
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => stageFilesMutation.mutate(selectedFiles)}
                      >
                        Stage Files
                      </Button>
                      <Button
                        onClick={handleCommit}
                        disabled={!commitMessage || commitMutation.isPending}
                      >
                        <GitCommit className="h-4 w-4 mr-2" />
                        Commit Changes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Commit History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commits.map((commit) => (
                    <div key={commit.hash} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-800">
                      <GitCommit className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{commit.message}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{new Date(commit.date).toLocaleString()}</span>
                          <span>•</span>
                          <span>{commit.files} files</span>
                        </div>
                        <code className="text-xs text-gray-500 mt-1 block">
                          {commit.hash}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Branch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="feature/new-feature"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                  />
                  <Button
                    onClick={() => createBranchMutation.mutate(newBranchName)}
                    disabled={!newBranchName || createBranchMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Branch
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <div
                      key={branch.name}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        branch.current ? 'bg-gray-800' : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4 text-gray-400" />
                        <span className={`font-medium ${branch.current ? 'text-green-400' : ''}`}>
                          {branch.name}
                        </span>
                        {branch.current && (
                          <Badge className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {branch.ahead > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{branch.ahead}
                          </Badge>
                        )}
                        {branch.behind > 0 && (
                          <Badge variant="outline" className="text-xs">
                            -{branch.behind}
                          </Badge>
                        )}
                        {!branch.current && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => switchBranchMutation.mutate(branch.name)}
                          >
                            Switch
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}