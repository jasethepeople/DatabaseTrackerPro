import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy,
  Shield,
  Lock,
  AlertTriangle,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Secret {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  isSystem: boolean;
}

export default function SecretsManager() {
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [newSecret, setNewSecret] = useState({ key: '', value: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Get secrets
  const { data: secrets = [], isLoading } = useQuery({
    queryKey: ['/api/secrets']
  });
  
  // Create secret mutation
  const createSecretMutation = useMutation({
    mutationFn: async (secret: { key: string; value: string; description?: string }) => {
      return await apiRequest('POST', '/api/secrets', secret);
    },
    onSuccess: () => {
      toast({
        title: "Secret Created",
        description: "Your secret has been securely stored"
      });
      setNewSecret({ key: '', value: '', description: '' });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/secrets'] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update secret mutation
  const updateSecretMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      return await apiRequest('PUT', `/api/secrets/${id}`, { value });
    },
    onSuccess: () => {
      toast({
        title: "Secret Updated",
        description: "Your secret has been updated"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/secrets'] });
    }
  });
  
  // Delete secret mutation
  const deleteSecretMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/secrets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Secret Deleted",
        description: "The secret has been removed"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/secrets'] });
    }
  });
  
  const toggleShowValue = (id: string) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const copyToClipboard = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: `${key} copied to clipboard`
    });
  };
  
  const validateSecret = () => {
    if (!newSecret.key.match(/^[A-Z][A-Z0-9_]*$/)) {
      toast({
        title: "Invalid Key Format",
        description: "Keys must be uppercase with underscores (e.g., API_KEY)",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  
  const handleCreateSecret = () => {
    if (validateSecret()) {
      createSecretMutation.mutate(newSecret);
    }
  };
  
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--github-dark)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Key className="h-8 w-8" />
              Secrets Manager
            </h1>
            <p className="text-gray-400 mt-1">Securely manage your environment variables</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Secret
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Secret</DialogTitle>
                <DialogDescription>
                  Create a new environment variable. It will be encrypted and stored securely.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input
                    id="key"
                    placeholder="OPENAI_API_KEY"
                    value={newSecret.key}
                    onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value.toUpperCase() })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use UPPER_SNAKE_CASE format
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="password"
                    placeholder="sk-..."
                    value={newSecret.value}
                    onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="API key for OpenAI services"
                    value={newSecret.description}
                    onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSecret}
                  disabled={!newSecret.key || !newSecret.value || createSecretMutation.isPending}
                >
                  Create Secret
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Security Notice */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">
              All secrets are encrypted using AES-256-GCM encryption before storage. 
              Never commit secrets to version control or share them publicly.
            </p>
          </CardContent>
        </Card>
        
        {/* Secrets List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">Loading secrets...</p>
              </CardContent>
            </Card>
          ) : secrets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Lock className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">No secrets yet</p>
                <p className="text-sm text-gray-500">
                  Add your first secret to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            secrets.map((secret) => (
              <Card key={secret.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono font-medium">{secret.key}</h3>
                        {secret.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                        {secret.lastUsed && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            In use
                          </Badge>
                        )}
                      </div>
                      {secret.description && (
                        <p className="text-sm text-gray-400 mb-2">{secret.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            type={showValues[secret.id] ? "text" : "password"}
                            value={secret.value}
                            readOnly
                            className="font-mono text-sm"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleShowValue(secret.id)}
                        >
                          {showValues[secret.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(secret.value, secret.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!secret.isSystem && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteSecretMutation.mutate(secret.id)}
                            disabled={deleteSecretMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {new Date(secret.createdAt).toLocaleDateString()}
                        {secret.updatedAt !== secret.createdAt && 
                          ` • Updated ${new Date(secret.updatedAt).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Using Secrets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-1">In your code:</p>
              <code className="block bg-gray-800 p-2 rounded text-sm">
                process.env.YOUR_SECRET_KEY
              </code>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">In terminal:</p>
              <code className="block bg-gray-800 p-2 rounded text-sm">
                echo $YOUR_SECRET_KEY
              </code>
            </div>
            <p className="text-sm text-gray-400">
              Secrets are automatically available in your development environment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}