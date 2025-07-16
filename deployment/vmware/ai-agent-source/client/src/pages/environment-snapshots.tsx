import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  RotateCcw, 
  Trash2, 
  Calendar, 
  FileText, 
  Folder, 
  Server, 
  Settings,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Clock
} from "lucide-react";

interface EnvironmentSnapshot {
  id: number;
  name: string;
  description?: string;
  fileCount: number;
  projectCount: number;
  vmCount: number;
  serviceCount: number;
  size: number;
  createdAt: string;
  lastRestoredAt?: string;
}

interface ContextualSuggestion {
  id: string;
  type: 'optimization' | 'security' | 'feature' | 'cleanup' | 'migration';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  benefits: string[];
  actionItems: string[];
}

interface SnapshotAnalysis {
  trends: {
    projectGrowth: number;
    fileGrowth: number;
    complexityIncrease: number;
    toolAdoption: number;
  };
  suggestions: ContextualSuggestion[];
  riskFactors: string[];
  opportunities: string[];
}

export default function EnvironmentSnapshots() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [newSnapshotDescription, setNewSnapshotDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch snapshots
  const { data: snapshotsData, isLoading: snapshotsLoading } = useQuery({
    queryKey: ["/api/snapshots"],
  });

  // Fetch analysis
  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ["/api/snapshots/analyze"],
  });

  const snapshots: EnvironmentSnapshot[] = snapshotsData?.snapshots || [];
  const analysis: SnapshotAnalysis = analysisData?.analysis || {
    trends: { projectGrowth: 0, fileGrowth: 0, complexityIncrease: 0, toolAdoption: 0 },
    suggestions: [],
    riskFactors: [],
    opportunities: []
  };

  // Create snapshot mutation
  const createSnapshotMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("/api/snapshots", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/snapshots/analyze"] });
      setIsCreateDialogOpen(false);
      setNewSnapshotName("");
      setNewSnapshotDescription("");
      toast({
        title: "Snapshot Created",
        description: "Your environment has been captured successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Snapshot",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Restore snapshot mutation
  const restoreSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: number) => {
      return await apiRequest(`/api/snapshots/${snapshotId}/restore`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/snapshots"] });
      toast({
        title: "Environment Restored",
        description: "Your environment has been restored successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Restore Environment",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete snapshot mutation
  const deleteSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: number) => {
      return await apiRequest(`/api/snapshots/${snapshotId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/snapshots/analyze"] });
      toast({
        title: "Snapshot Deleted",
        description: "Snapshot has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Snapshot",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (snapshotsLoading || analysisLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Environment Snapshots</h1>
          <p className="text-muted-foreground mt-1">
            Capture and restore your development environment instantly
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Camera className="w-4 h-4" />
              Create Snapshot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Environment Snapshot</DialogTitle>
              <DialogDescription>
                Capture your current development environment including projects, files, VMs, and services.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Snapshot Name</Label>
                <Input
                  id="name"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  placeholder="e.g., Pre-deployment backup"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newSnapshotDescription}
                  onChange={(e) => setNewSnapshotDescription(e.target.value)}
                  placeholder="Describe what this snapshot contains..."
                />
              </div>
              <Button
                onClick={() => createSnapshotMutation.mutate({
                  name: newSnapshotName,
                  description: newSnapshotDescription || undefined
                })}
                disabled={!newSnapshotName || createSnapshotMutation.isPending}
                className="w-full"
              >
                {createSnapshotMutation.isPending ? "Creating..." : "Create Snapshot"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contextual Suggestions */}
      {analysis.suggestions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Smart Suggestions
            </CardTitle>
            <CardDescription>
              AI-powered recommendations based on your environment analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {analysis.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(suggestion.type)}
                      <h4 className="font-semibold">{suggestion.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {suggestion.estimatedTime}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {suggestion.description}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Benefits:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {suggestion.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Action Items:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {suggestion.actionItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Trends */}
      {snapshots.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Environment Trends</CardTitle>
            <CardDescription>
              Track how your development environment evolves over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.trends.projectGrowth > 0 ? '+' : ''}{analysis.trends.projectGrowth}%
                </div>
                <div className="text-sm text-muted-foreground">Project Growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.trends.fileGrowth > 0 ? '+' : ''}{analysis.trends.fileGrowth}%
                </div>
                <div className="text-sm text-muted-foreground">File Growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analysis.trends.complexityIncrease > 0 ? '+' : ''}{analysis.trends.complexityIncrease}%
                </div>
                <div className="text-sm text-muted-foreground">Complexity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.trends.toolAdoption > 0 ? '+' : ''}{analysis.trends.toolAdoption}%
                </div>
                <div className="text-sm text-muted-foreground">Tool Adoption</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snapshots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {snapshots.map((snapshot) => (
          <Card key={snapshot.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{snapshot.name}</CardTitle>
                  {snapshot.description && (
                    <CardDescription className="mt-1">
                      {snapshot.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreSnapshotMutation.mutate(snapshot.id)}
                    disabled={restoreSnapshotMutation.isPending}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSnapshotMutation.mutate(snapshot.id)}
                    disabled={deleteSnapshotMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Created {formatDate(snapshot.createdAt)}
                </div>
                
                {snapshot.lastRestoredAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RotateCcw className="w-4 h-4" />
                    Last restored {formatDate(snapshot.lastRestoredAt)}
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-500" />
                    <span>{snapshot.projectCount} projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span>{snapshot.fileCount} files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-500" />
                    <span>{snapshot.vmCount} VMs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-orange-500" />
                    <span>{snapshot.serviceCount} services</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{formatSize(snapshot.size)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {snapshots.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No snapshots yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first environment snapshot to enable quick backup and restore
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Snapshot
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}