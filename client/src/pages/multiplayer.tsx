import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Copy, 
  Link2, 
  MessageSquare,
  Video,
  Phone,
  MoreVertical,
  Circle
} from 'lucide-react';

interface Collaborator {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  cursor?: { line: number; column: number; file: string };
  color: string;
}

interface CollaborationSession {
  id: string;
  projectId: number;
  inviteCode: string;
  owner: string;
  collaborators: Collaborator[];
  createdAt: Date;
}

export default function Multiplayer() {
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const { toast } = useToast();
  
  // Get current project
  const projectId = 1;
  
  // Get active session
  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/collaboration/session', projectId]
  });
  
  // Get collaborators
  const { data: collaborators = [] } = useQuery({
    queryKey: ['/api/collaboration/collaborators', session?.id],
    enabled: !!session?.id,
    refetchInterval: 2000 // Update every 2 seconds
  });
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/collaboration/create', { projectId });
    },
    onSuccess: (data) => {
      setInviteCode(data.inviteCode);
      toast({
        title: "Collaboration Started",
        description: "Share the invite code with your team"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/session'] });
    }
  });
  
  // Join session mutation
  const joinSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('POST', '/api/collaboration/join', { inviteCode: code });
    },
    onSuccess: () => {
      toast({
        title: "Joined Session",
        description: "You're now collaborating!"
      });
      setJoinCode('');
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/session'] });
    },
    onError: (error) => {
      toast({
        title: "Join Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/collaboration/end', { sessionId: session?.id });
    },
    onSuccess: () => {
      toast({
        title: "Session Ended",
        description: "Collaboration session has ended"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration/session'] });
    }
  });
  
  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode || session?.inviteCode || '');
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard"
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };
  
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--github-dark)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8" />
              Multiplayer
            </h1>
            <p className="text-gray-400 mt-1">Collaborate with your team in real-time</p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Management */}
          <div className="lg:col-span-2 space-y-6">
            {!session ? (
              <Card>
                <CardHeader>
                  <CardTitle>Start Collaborating</CardTitle>
                  <CardDescription>
                    Create a new session or join an existing one
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Create Session */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Create New Session</h3>
                    <Button 
                      onClick={() => createSessionMutation.mutate()}
                      disabled={createSessionMutation.isPending}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Start Collaboration
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  
                  {/* Join Session */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Join Existing Session</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter invite code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                      />
                      <Button 
                        onClick={() => joinSessionMutation.mutate(joinCode)}
                        disabled={!joinCode || joinSessionMutation.isPending}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Active Session */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Active Session</CardTitle>
                        <CardDescription>
                          {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''} online
                        </CardDescription>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => endSessionMutation.mutate()}
                      >
                        End Session
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Invite Code */}
                      <div>
                        <label className="text-sm font-medium">Invite Code</label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            value={session.inviteCode} 
                            readOnly 
                            className="font-mono"
                          />
                          <Button size="icon" variant="outline" onClick={copyInviteCode}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Share Link */}
                      <Button variant="outline" className="w-full" onClick={copyInviteCode}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Copy Invite Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Collaborators List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Collaborators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={collaborator.avatar} />
                                <AvatarFallback style={{ backgroundColor: collaborator.color }}>
                                  {collaborator.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <Circle className={`h-3 w-3 absolute bottom-0 right-0 ${getStatusColor(collaborator.status)} rounded-full`} />
                            </div>
                            <div>
                              <p className="font-medium">{collaborator.username}</p>
                              {collaborator.cursor && (
                                <p className="text-xs text-gray-400">
                                  {collaborator.cursor.file} • Line {collaborator.cursor.line}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Video className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          
          {/* Activity Feed */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>Recent collaboration events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">John joined the session</p>
                    <p className="text-xs text-gray-400">2 minutes ago</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Sarah edited main.js</p>
                    <p className="text-xs text-gray-400">5 minutes ago</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Mike started debugging</p>
                    <p className="text-xs text-gray-400">10 minutes ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Voice/Video Controls */}
            {session && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Communication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Start Voice Call
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Video className="h-4 w-4 mr-2" />
                    Start Video Call
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}