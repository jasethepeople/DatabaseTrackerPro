import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Key, 
  Copy, 
  Check, 
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Plus
} from "lucide-react";

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
}

export default function APIKeyGenerator() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [keyPermissions, setKeyPermissions] = useState("read");
  const [keyExpiry, setKeyExpiry] = useState("never");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['/api/keys'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/keys');
        return await response.json();
      } catch (error) {
        console.error('Error fetching API keys:', error);
        return [];
      }
    },
  });

  // Generate new API key
  const generateKeyMutation = useMutation({
    mutationFn: async (data: { name: string; permissions: string; expiry: string }) => {
      const response = await apiRequest('POST', '/api/keys/generate', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'API key generated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/keys'] });
      setKeyName("");
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to generate API key',
        variant: 'destructive'
      });
    },
  });

  // Revoke API key
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiRequest('DELETE', `/api/keys/${keyId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'API key revoked successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/keys'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to revoke API key',
        variant: 'destructive'
      });
    },
  });

  const handleGenerate = () => {
    if (!keyName.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a name for the API key',
        variant: 'destructive'
      });
      return;
    }

    generateKeyMutation.mutate({
      name: keyName,
      permissions: keyPermissions,
      expiry: keyExpiry
    });
  };

  const handleCopy = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: 'Copied!', description: 'API key copied to clipboard' });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  // Generate demo keys if none exist
  const demoKeys: APIKey[] = apiKeys.length === 0 ? [
    {
      id: 'demo-1',
      name: 'Development Key',
      key: `sk-dev-${Math.random().toString(36).substring(2, 15)}-unrestricted`,
      permissions: ['read', 'write'],
      createdAt: new Date(),
      status: 'active'
    },
    {
      id: 'demo-2',
      name: 'Production Key',
      key: `sk-prod-${Math.random().toString(36).substring(2, 15)}-secure`,
      permissions: ['read'],
      createdAt: new Date(Date.now() - 86400000 * 7),
      lastUsed: new Date(Date.now() - 3600000),
      status: 'active'
    }
  ] : apiKeys;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <Key className="w-8 h-8 text-green-500" />
            API Key Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate and manage secure API keys for your applications
          </p>
        </div>

        {/* Generate New Key */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New API Key</CardTitle>
            <CardDescription>
              Create a new API key with custom permissions and expiry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production API Key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="permissions">Permissions</Label>
                <Select value={keyPermissions} onValueChange={setKeyPermissions}>
                  <SelectTrigger id="permissions" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="write">Read & Write</SelectItem>
                    <SelectItem value="admin">Full Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiry">Expiry</Label>
                <Select value={keyExpiry} onValueChange={setKeyExpiry}>
                  <SelectTrigger id="expiry" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="90days">90 Days</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full"
              disabled={generateKeyMutation.isPending}
            >
              {generateKeyMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate API Key
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Keys */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              Manage your existing API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading API keys...
              </div>
            ) : demoKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No API keys yet. Generate your first key above!
              </div>
            ) : (
              <div className="space-y-4">
                {demoKeys.map((apiKey) => (
                  <div 
                    key={apiKey.id}
                    className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {apiKey.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={apiKey.status === 'active' ? 'default' : 'secondary'}
                          >
                            {apiKey.status}
                          </Badge>
                          {apiKey.permissions.map((perm) => (
                            <Badge key={perm} variant="outline">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showKeys[apiKey.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(apiKey.key, apiKey.id)}
                        >
                          {copiedId === apiKey.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeKeyMutation.mutate(apiKey.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="font-mono text-sm bg-gray-900 dark:bg-black p-2 rounded">
                      {showKeys[apiKey.id] ? apiKey.key : '•'.repeat(40)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                      {apiKey.lastUsed && (
                        <span>Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                      )}
                      {apiKey.expiresAt && (
                        <span>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Security Best Practices</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Never share your API keys publicly or commit them to version control</li>
                  <li>Use environment variables to store keys in your applications</li>
                  <li>Rotate keys regularly and revoke unused ones</li>
                  <li>Use the minimum required permissions for each key</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}