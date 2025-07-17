import React, { useState } from 'react';
import { 
  Play, 
  Bug, 
  Package, 
  GitBranch, 
  Terminal as TerminalIcon,
  Plus,
  Share2,
  Settings,
  ChevronRight,
  ChevronDown,
  Rocket,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DevelopmentToolsPanelProps {
  className?: string;
}

export function DevelopmentToolsPanel({ className }: DevelopmentToolsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('run');
  const { toast } = useToast();
  
  // Get current project (for now using project ID 1)
  const projectId = 1;
  
  // Query for project info
  const { data: project } = useQuery({
    queryKey: ['/api/projects', projectId]
  });
  
  // Query for packages
  const { data: packages = [] } = useQuery({
    queryKey: ['/api/tools/installed']
  });
  
  // Run application mutation
  const runAppMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/projects/${projectId}/run`);
    },
    onSuccess: () => {
      toast({
        title: "Application Started",
        description: "Your application is now running"
      });
    },
    onError: (error) => {
      toast({
        title: "Run Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async (platform: string) => {
      return await apiRequest('POST', '/api/deployment/deploy', {
        projectId,
        platform,
        config: {
          appName: project?.name || 'my-app',
          region: 'us-east-1'
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Deployment Started",
        description: `Deploying to ${data.platform}...`
      });
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const sections = [
    {
      id: 'run',
      label: 'Run',
      icon: Play,
      action: () => setActiveSection('run')
    },
    {
      id: 'debug',
      label: 'Debug',
      icon: Bug,
      action: () => setActiveSection('debug')
    },
    {
      id: 'packages',
      label: 'Packages',
      icon: Package,
      action: () => setActiveSection('packages')
    },
    {
      id: 'git',
      label: 'Git',
      icon: GitBranch,
      action: () => setActiveSection('git')
    },
    {
      id: 'shell',
      label: 'Shell',
      icon: TerminalIcon,
      action: () => setActiveSection('shell')
    },
    {
      id: 'deploy',
      label: 'Deploy',
      icon: Rocket,
      action: () => setActiveSection('deploy')
    }
  ];

  return (
    <div className={cn("bg-[#1c1c1c] border-l border-[#2d2d2d] flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm font-medium">Tools</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tools Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <div
              key={section.id}
              className={cn(
                "group cursor-pointer",
                activeSection === section.id && "bg-[#2d2d2d]"
              )}
              onClick={() => {
                setActiveSection(section.id);
                section.action();
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#2d2d2d] transition-colors">
                <section.icon className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{section.label}</span>
              </div>
              
              {/* Section specific content */}
              {activeSection === section.id && (
                <div className="px-4 pb-3 border-b border-[#2d2d2d]">
                  {section.id === 'run' && (
                    <div className="space-y-2">
                      <Button 
                        className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700"
                        size="sm"
                        onClick={() => runAppMutation.mutate()}
                        disabled={runAppMutation.isPending}
                      >
                        <Play className="h-3 w-3" />
                        {runAppMutation.isPending ? 'Starting...' : 'Run Application'}
                      </Button>
                      <div className="text-xs text-gray-400">
                        Press Ctrl+Enter to run
                      </div>
                    </div>
                  )}
                  
                  {section.id === 'debug' && (
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2"
                        size="sm"
                      >
                        <Bug className="h-3 w-3" />
                        Start debugging
                      </Button>
                      <div className="text-xs text-gray-400">
                        Set breakpoints in your code
                      </div>
                    </div>
                  )}
                  
                  {section.id === 'packages' && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 mb-2">
                        Installed packages: {packages.length}
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2"
                        size="sm"
                        onClick={() => window.location.href = '/tools'}
                      >
                        <Plus className="h-3 w-3" />
                        Add package
                      </Button>
                    </div>
                  )}
                  
                  {section.id === 'git' && (
                    <div className="space-y-2">
                      <div className="text-xs space-y-1">
                        <div className="text-gray-400">Branch: main</div>
                        <div className="text-gray-400">Changes: 3 files</div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2"
                        size="sm"
                      >
                        <GitBranch className="h-3 w-3" />
                        Commit changes
                      </Button>
                    </div>
                  )}
                  
                  {section.id === 'shell' && (
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2"
                        size="sm"
                        onClick={() => {
                          const event = new CustomEvent('toggle-terminal', { detail: { show: true } });
                          window.dispatchEvent(event);
                        }}
                      >
                        <TerminalIcon className="h-3 w-3" />
                        Open new shell
                      </Button>
                      <div className="text-xs text-gray-400">
                        Shell sessions: 1 active
                      </div>
                    </div>
                  )}
                  
                  {section.id === 'deploy' && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 mb-2">
                        Deploy your application
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2 mb-1"
                        size="sm"
                        onClick={() => deployMutation.mutate('heroku')}
                        disabled={deployMutation.isPending}
                      >
                        <Rocket className="h-3 w-3" />
                        Deploy to Heroku
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2 mb-1"
                        size="sm"
                        onClick={() => deployMutation.mutate('vercel')}
                        disabled={deployMutation.isPending}
                      >
                        <Upload className="h-3 w-3" />
                        Deploy to Vercel
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2"
                        size="sm"
                        onClick={() => window.location.href = '/deployment'}
                      >
                        <Settings className="h-3 w-3" />
                        Deployment Settings
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="border-t border-[#2d2d2d] p-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Share2 className="h-3 w-3" />
          Invite to Repl
        </Button>
      </div>
    </div>
  );
}