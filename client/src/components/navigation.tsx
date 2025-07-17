import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Database, 
  Search, 
  Brain, 
  TestTube,
  Camera,
  LogOut,
  LayoutDashboard,
  Code,
  Key,
  Shield,
  Wrench,
  Lightbulb,
  Cloud
} from "lucide-react";
import { auth } from "@/lib/auth";

export function Navigation() {
  const [location] = useLocation();

  const handleLogout = async () => {
    await auth.logout();
    window.location.reload();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/chat", label: "AI Chat", icon: Bot },
    { path: "/venice-ai", label: "Venice AI", icon: Bot },
    { path: "/code-snippets", label: "Code Snippets", icon: Code },
    { path: "/anthropic-demo", label: "API Key Gen", icon: Key },
    { path: "/data", label: "Data Dashboard", icon: Database },
    { path: "/ai-discovery", label: "AI Discovery", icon: Search },
    { path: "/deployment", label: "Deploy", icon: Cloud },
    { path: "/autonomous-learning", label: "Learning", icon: Brain },
    { path: "/testing", label: "Testing", icon: TestTube },
    { path: "/snapshots", label: "Snapshots", icon: Camera },
    { path: "/intelligent-suggestions", label: "AI Suggestions", icon: Lightbulb },
    { path: "/ai-coding-assistant", label: "AI Assistant", icon: Bot },
    { path: "/security-framework", label: "Security", icon: Shield },
    { path: "/code-refactoring", label: "Refactor", icon: Wrench },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-700 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">Local Dev Environment</h1>
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2 text-white hover:text-white hover:bg-gray-700"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="gap-2 text-white hover:text-white hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}