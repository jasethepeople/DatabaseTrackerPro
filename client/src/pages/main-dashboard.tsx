import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Database, 
  Search, 
  Brain, 
  TestTube,
  Camera,
  ArrowRight,
  Code,
  Terminal,
  Server,
  Settings,
  Activity
} from "lucide-react";

export default function MainDashboard() {
  const features = [
    {
      title: "AI Chat Assistant",
      description: "Intelligent coding assistance with context-aware responses",
      icon: Bot,
      path: "/chat",
      color: "bg-blue-500",
      status: "Active"
    },
    {
      title: "Code Snippet Generator",
      description: "AI-powered code generation with one-click copy functionality",
      icon: Code,
      path: "/demo-snippets",
      color: "bg-cyan-500",
      status: "Demo Available"
    },
    {
      title: "Data Dashboard", 
      description: "Comprehensive analytics and system monitoring",
      icon: Database,
      path: "/data",
      color: "bg-green-500", 
      status: "Active"
    },
    {
      title: "AI Discovery",
      description: "Automatic API key generation and external API integration",
      icon: Search,
      path: "/ai-discovery",
      color: "bg-purple-500",
      status: "Auto Key Gen Ready"
    },
    {
      title: "Autonomous Learning",
      description: "Self-improving AI system with adaptive capabilities",
      icon: Brain,
      path: "/autonomous-learning", 
      color: "bg-orange-500",
      status: "Active"
    },
    {
      title: "Testing Suite",
      description: "Comprehensive testing and validation framework",
      icon: TestTube,
      path: "/testing",
      color: "bg-red-500",
      status: "Active"
    },
    {
      title: "Environment Snapshots",
      description: "One-click environment backup and restore with AI suggestions",
      icon: Camera,
      path: "/snapshots",
      color: "bg-indigo-500",
      status: "Active"
    }
  ];

  const quickActions = [
    {
      title: "Development IDE",
      description: "Code editor with file management and terminal",
      icon: Code,
      path: "/ide",
      color: "bg-gray-700"
    },
    {
      title: "Terminal Access", 
      description: "Direct terminal access to your development environment",
      icon: Terminal,
      path: "/terminal",
      color: "bg-gray-600"
    },
    {
      title: "VM Management",
      description: "Create and manage virtual machines",
      icon: Server, 
      path: "/vms",
      color: "bg-gray-800"
    },
    {
      title: "System Settings",
      description: "Configure system preferences and integrations",
      icon: Settings,
      path: "/settings",
      color: "bg-gray-500"
    }
  ];

  const stats = [
    { label: "Active Features", value: "7", icon: Activity },
    { label: "API Integrations", value: "50+", icon: Search },
    { label: "Test Success Rate", value: "92%", icon: TestTube },
    { label: "System Uptime", value: "99.9%", icon: Server }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Local Development Environment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced AI-powered development platform with comprehensive tooling and automation
          </p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <Icon className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Core Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {feature.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href={feature.path}>
                      <Button className="w-full gap-2">
                        Open Feature
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {action.description}
                    </p>
                    <Link href={action.path}>
                      <Button variant="outline" size="sm" className="w-full">
                        Access
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="font-medium">AI Services</span>
                  <Badge className="bg-green-500">Online</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="font-medium">Database</span>
                  <Badge className="bg-blue-500">Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="font-medium">Learning Engine</span>
                  <Badge className="bg-purple-500">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}