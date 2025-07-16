import { useState, useEffect } from "react";
import { ChevronDown, Code, Folder, Database } from "lucide-react";
import { auth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  
  const { data: hardware } = useQuery({
    queryKey: ["/api/hardware"],
    refetchInterval: 3000,
  });

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await auth.getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    auth.logout();
  };

  const [location] = useLocation();

  return (
    <nav className="h-12 github-surface border-b border-opacity-20 border-white flex items-center px-4 z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Code className="github-blue" size={20} />
          <span className="text-lg font-bold text-white">LocalReplit</span>
        </div>
        
        {/* Navigation Links */}
        <div className="flex items-center space-x-2">
          <Link href="/">
            <span className={`px-3 py-1 rounded text-sm cursor-pointer transition-colors ${
              location === '/' ? 'bg-white bg-opacity-10 text-white' : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-5'
            }`}>
              IDE
            </span>
          </Link>
          <Link href="/data">
            <span className={`px-3 py-1 rounded text-sm cursor-pointer transition-colors flex items-center gap-1 ${
              location === '/data' ? 'bg-white bg-opacity-10 text-white' : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-5'
            }`}>
              <Database size={14} />
              Data Dashboard
            </span>
          </Link>
        </div>
        
        {/* Project Selector */}
        <div className="flex items-center space-x-2 github-elevated rounded px-3 py-1">
          <Folder className="github-gray" size={16} />
          <span className="text-white text-sm">my-awesome-app</span>
          <ChevronDown className="github-gray" size={12} />
        </div>
      </div>
      
      <div className="flex-1"></div>
      
      {/* Status & User Menu */}
      <div className="flex items-center space-x-4">
        {/* VM Status */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm github-gray">VM Online</span>
        </div>
        
        {/* Hardware Status */}
        {hardware && (
          <div className="text-sm github-gray">
            <span>CPU: {hardware.cpu}%</span>
            <span className="mx-1">|</span>
            <span>RAM: {(hardware.memory.used / 1024).toFixed(1)}GB</span>
          </div>
        )}
        
        {/* User Profile */}
        <div className="flex items-center space-x-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "var(--github-blue)" }}>
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="text-sm text-white">{user?.username || "User"}</span>
          <ChevronDown className="github-gray group-hover:text-white" size={12} />
          
          {/* Dropdown Menu */}
          <div className="absolute top-12 right-0 mt-2 w-48 github-elevated rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10 rounded"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
