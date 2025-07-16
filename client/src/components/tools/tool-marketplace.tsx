import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Star, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ToolMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["/api/tools"],
  });

  const { data: userTools = [] } = useQuery({
    queryKey: ["/api/user/tools"],
  });

  const installToolMutation = useMutation({
    mutationFn: async (toolId: number) => {
      const response = await apiRequest("POST", `/api/tools/${toolId}/install`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tool installation started",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/tools"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to install tool",
        variant: "destructive",
      });
    },
  });

  const filteredTools = tools.filter((tool: any) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isToolInstalled = (toolId: number) => {
    return userTools.some((userTool: any) => userTool.toolId === toolId);
  };

  const getToolIcon = (toolName: string) => {
    const iconMap: { [key: string]: string } = {
      'nodejs': '📦',
      'python': '🐍',
      'docker': '🐳',
      'git': '📁',
      'nginx': '⚡',
      'mysql': '🗄️',
      'redis': '🔴',
      'mongodb': '🍃',
    };
    return iconMap[toolName.toLowerCase()] || '🔧';
  };

  const featuredTools = [
    {
      id: 1,
      name: "nodejs",
      displayName: "Node.js",
      description: "JavaScript runtime built on Chrome's V8 engine",
      category: "runtime",
      version: "v18.17.0",
      rating: 49,
      downloads: 125000,
      isOfficial: true
    },
    {
      id: 2,
      name: "python",
      displayName: "Python",
      description: "Programming language that lets you work quickly",
      category: "language",
      version: "v3.11.4",
      rating: 48,
      downloads: 98000,
      isOfficial: true
    },
    {
      id: 3,
      name: "docker",
      displayName: "Docker",
      description: "Platform for developing and shipping applications",
      category: "containerization",
      version: "v24.0.5",
      rating: 47,
      downloads: 87000,
      isOfficial: true
    }
  ];

  const categories = [
    { name: "Languages", icon: "💻", count: 12 },
    { name: "Databases", icon: "🗄️", count: 8 },
    { name: "Servers", icon: "🖥️", count: 6 },
    { name: "Dev Tools", icon: "🔧", count: 15 },
  ];

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-white">Loading tools...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="github-elevated border-0 text-white pl-10"
          />
          <Search className="absolute left-3 top-2.5 github-gray" size={16} />
        </div>
        
        {/* Featured Tools */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-white">Featured Tools</h3>
          <div className="space-y-3">
            {featuredTools.map(tool => {
              const isInstalled = isToolInstalled(tool.id);
              
              return (
                <div
                  key={tool.id}
                  className="github-elevated rounded-lg p-3 border border-opacity-20 border-white hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getToolIcon(tool.name)}</span>
                      <span className="font-medium text-white">{tool.displayName}</span>
                    </div>
                    <Button
                      onClick={() => !isInstalled && installToolMutation.mutate(tool.id)}
                      disabled={isInstalled || installToolMutation.isPending}
                      size="sm"
                      className={`text-xs ${
                        isInstalled
                          ? "bg-green-600 hover:bg-green-600"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isInstalled ? (
                        <>
                          <Check size={12} className="mr-1" />
                          Installed
                        </>
                      ) : installToolMutation.isPending ? (
                        "Installing..."
                      ) : (
                        "Install"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs github-gray mb-2">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs github-gray">{tool.version}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-400" size={12} />
                      <span className="text-xs text-white">{(tool.rating / 10).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Categories */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-white">Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(category => (
              <button
                key={category.name}
                className="github-elevated hover:bg-opacity-80 border border-opacity-20 border-white rounded p-2 text-xs text-center text-white hover:border-blue-500 transition-colors"
              >
                <div className="text-lg mb-1">{category.icon}</div>
                <div>{category.name}</div>
                <div className="github-gray">({category.count})</div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div>
            <h3 className="text-sm font-medium mb-3 text-white">
              Search Results ({filteredTools.length})
            </h3>
            <div className="space-y-3">
              {filteredTools.map((tool: any) => {
                const isInstalled = isToolInstalled(tool.id);
                
                return (
                  <div
                    key={tool.id}
                    className="github-elevated rounded-lg p-3 border border-opacity-20 border-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getToolIcon(tool.name)}</span>
                        <span className="font-medium text-white">{tool.displayName}</span>
                      </div>
                      <Button
                        onClick={() => !isInstalled && installToolMutation.mutate(tool.id)}
                        disabled={isInstalled || installToolMutation.isPending}
                        size="sm"
                        className={`text-xs ${
                          isInstalled
                            ? "bg-green-600 hover:bg-green-600"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {isInstalled ? "Installed" : "Install"}
                      </Button>
                    </div>
                    <p className="text-xs github-gray">{tool.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
