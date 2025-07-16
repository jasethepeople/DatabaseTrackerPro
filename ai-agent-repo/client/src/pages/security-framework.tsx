import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  Database, 
  Eye, 
  Zap,
  FileText,
  Activity,
  Target,
  Lock,
  Bug,
  Scan,
  Users,
  Globe,
  Terminal,
  Download,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface VulnerabilityData {
  id: string;
  cve: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  description: string;
  published: string;
  lastModified: string;
  references: string[];
  cwe: string;
  vectorString: string;
  exploitAvailable: boolean;
}

interface OSINTResult {
  id: string;
  source: string;
  type: 'domain' | 'ip' | 'email' | 'social' | 'dns' | 'whois';
  data: any;
  timestamp: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ExploitPayload {
  id: string;
  name: string;
  platform: string;
  type: string;
  rank: string;
  description: string;
  targets: string[];
  options: Record<string, any>;
  references: string[];
}

interface ForensicsResult {
  id: string;
  type: 'file' | 'network' | 'memory' | 'disk';
  artifacts: any[];
  timeline: any[];
  metadata: Record<string, any>;
  confidence: number;
}

export default function SecurityFramework() {
  const [activeTab, setActiveTab] = useState('reconnaissance');
  const [target, setTarget] = useState('');
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityData[]>([]);
  const [osintResults, setOSINTResults] = useState<OSINTResult[]>([]);
  const [exploits, setExploits] = useState<ExploitPayload[]>([]);
  const [forensicsData, setForensicsData] = useState<ForensicsResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState('all');
  const { toast } = useToast();

  const securityFrameworks = [
    { id: 'metasploit', name: 'Metasploit Framework', icon: <Zap className="w-4 h-4" /> },
    { id: 'osint', name: 'OSINT Toolkit', icon: <Search className="w-4 h-4" /> },
    { id: 'social-eng', name: 'Social Engineering', icon: <Users className="w-4 h-4" /> },
    { id: 'forensics', name: 'Digital Forensics', icon: <FileText className="w-4 h-4" /> },
    { id: 'vulnerability', name: 'Vulnerability Database', icon: <Bug className="w-4 h-4" /> }
  ];

  const performReconnaissance = async () => {
    if (!target.trim()) {
      toast({
        title: "Target Required",
        description: "Please specify a target for reconnaissance",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    try {
      const response = await fetch('/api/security/reconnaissance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target, 
          framework: selectedFramework,
          modules: ['osint', 'vulnerability_scan', 'port_scan', 'dns_enum']
        })
      });

      if (!response.ok) throw new Error('Reconnaissance failed');
      
      const data = await response.json();
      setOSINTResults(data.osint || []);
      setVulnerabilities(data.vulnerabilities || []);
      
      toast({
        title: "Reconnaissance Complete",
        description: `Found ${data.osint?.length || 0} OSINT results and ${data.vulnerabilities?.length || 0} vulnerabilities`,
      });
    } catch (error) {
      toast({
        title: "Reconnaissance Failed",
        description: "Unable to complete reconnaissance scan",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const searchExploits = async () => {
    if (!target.trim()) {
      toast({
        title: "Target Required",
        description: "Please specify a target for exploit search",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/security/exploits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, platform: 'all' })
      });

      if (!response.ok) throw new Error('Exploit search failed');
      
      const data = await response.json();
      setExploits(data.exploits || []);
      
      toast({
        title: "Exploit Search Complete",
        description: `Found ${data.exploits?.length || 0} potential exploits`,
      });
    } catch (error) {
      toast({
        title: "Exploit Search Failed",
        description: "Unable to search for exploits",
        variant: "destructive"
      });
    }
  };

  const performForensics = async () => {
    try {
      const response = await fetch('/api/security/forensics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target, 
          analysisType: 'comprehensive',
          modules: ['file_analysis', 'network_analysis', 'memory_dump', 'timeline']
        })
      });

      if (!response.ok) throw new Error('Forensics analysis failed');
      
      const data = await response.json();
      setForensicsData(data.results || []);
      
      toast({
        title: "Forensics Analysis Complete",
        description: `Generated ${data.results?.length || 0} forensics reports`,
      });
    } catch (error) {
      toast({
        title: "Forensics Analysis Failed",
        description: "Unable to complete forensics analysis",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Integrated Security Framework
        </h1>
        <p className="text-gray-400">
          Comprehensive cybersecurity toolkit combining reconnaissance, vulnerability assessment, and forensics
        </p>
      </div>

      {/* Framework Selection */}
      <Card className="mb-6 bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Frameworks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {securityFrameworks.map((framework) => (
              <Button
                key={framework.id}
                variant={selectedFramework === framework.id ? "default" : "outline"}
                onClick={() => setSelectedFramework(framework.id)}
                className="flex items-center gap-2 h-12"
              >
                {framework.icon}
                <span className="text-xs">{framework.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Target Configuration */}
      <Card className="mb-6 bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Target Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target domain, IP address, or identifier..."
              className="flex-1 bg-gray-800 border-gray-600"
            />
            <Button
              onClick={performReconnaissance}
              disabled={isScanning || !target.trim()}
              className="gap-2"
            >
              {isScanning ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Scan className="w-4 h-4" />
              )}
              Start Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reconnaissance">Reconnaissance</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="exploits">Exploits</TabsTrigger>
          <TabsTrigger value="forensics">Forensics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reconnaissance" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                OSINT Results ({osintResults.length})
              </CardTitle>
              <CardDescription>
                Open Source Intelligence gathering results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {osintResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No reconnaissance data available</p>
                  <p className="text-sm">Run a scan to gather OSINT information</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {osintResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{result.type}</Badge>
                          <span className="text-sm text-gray-400">{result.source}</span>
                        </div>
                        <span className={`text-sm font-medium ${getRiskColor(result.riskLevel)}`}>
                          {result.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <pre className="text-sm text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                      <div className="mt-2 text-xs text-gray-500">
                        Confidence: {result.confidence}% • {result.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Vulnerability Database ({vulnerabilities.length})
              </CardTitle>
              <CardDescription>
                Live vulnerability feeds and CVE database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vulnerabilities.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No vulnerabilities found</p>
                  <p className="text-sm">Target appears secure or scan incomplete</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vulnerabilities.map((vuln) => (
                    <div
                      key={vuln.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(vuln.severity)}>
                            {vuln.severity.toUpperCase()}
                          </Badge>
                          <code className="text-sm">{vuln.cve}</code>
                          <span className="text-sm font-medium">Score: {vuln.score}</span>
                        </div>
                        {vuln.exploitAvailable && (
                          <Badge variant="destructive">
                            <Zap className="w-3 h-3 mr-1" />
                            Exploit Available
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{vuln.description}</p>
                      <div className="text-xs text-gray-500">
                        Published: {vuln.published} • CWE: {vuln.cwe}
                      </div>
                      {vuln.references.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-400">References:</span>
                          {vuln.references.slice(0, 3).map((ref, idx) => (
                            <a
                              key={idx}
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-blue-400 hover:text-blue-300"
                            >
                              {ref}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exploits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Exploit Database</h3>
            <Button onClick={searchExploits} className="gap-2">
              <Search className="w-4 h-4" />
              Search Exploits
            </Button>
          </div>
          
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Metasploit Framework ({exploits.length})
              </CardTitle>
              <CardDescription>
                Available exploits and payloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exploits.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No exploits found</p>
                  <p className="text-sm">Search for exploits targeting your specified system</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exploits.map((exploit) => (
                    <div
                      key={exploit.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{exploit.platform}</Badge>
                          <Badge className="bg-purple-500">{exploit.rank}</Badge>
                          <span className="font-mono text-sm">{exploit.name}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Load
                        </Button>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{exploit.description}</p>
                      <div className="text-xs text-gray-500">
                        Type: {exploit.type} • Targets: {exploit.targets.slice(0, 3).join(', ')}
                        {exploit.targets.length > 3 && ` (+${exploit.targets.length - 3} more)`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forensics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Digital Forensics</h3>
            <Button onClick={performForensics} className="gap-2">
              <FileText className="w-4 h-4" />
              Run Analysis
            </Button>
          </div>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Forensics Results ({forensicsData.length})
              </CardTitle>
              <CardDescription>
                Digital evidence analysis and data recovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forensicsData.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No forensics data available</p>
                  <p className="text-sm">Run analysis to examine digital evidence</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {forensicsData.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{result.type}</Badge>
                        <span className="text-sm text-gray-400">
                          Confidence: {result.confidence}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <div>Artifacts: {result.artifacts.length}</div>
                        <div>Timeline entries: {result.timeline.length}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Security Assessment Report
              </CardTitle>
              <CardDescription>
                Comprehensive security analysis summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-red-400">
                    {vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length}
                  </div>
                  <div className="text-sm text-gray-400">High Risk Issues</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-yellow-400">
                    {osintResults.length}
                  </div>
                  <div className="text-sm text-gray-400">OSINT Findings</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-blue-400">
                    {exploits.length}
                  </div>
                  <div className="text-sm text-gray-400">Available Exploits</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Executive Summary</h4>
                <p className="text-sm text-gray-300">
                  Security assessment completed for target: {target || 'Not specified'}
                </p>
                <p className="text-sm text-gray-300">
                  {vulnerabilities.length > 0 
                    ? `Identified ${vulnerabilities.length} vulnerabilities requiring attention.`
                    : 'No significant vulnerabilities detected.'
                  }
                </p>
                <p className="text-sm text-gray-300">
                  {osintResults.length > 0 
                    ? `Gathered ${osintResults.length} intelligence data points from public sources.`
                    : 'Limited public information available.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}