import { useState } from "react";
import { Lightbulb, X, Check, Code, FileText, Zap, Settings, Search, GitBranch, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AISuggestionsProps {
  currentFile?: any;
  onApplySuggestion?: (suggestion: string) => void;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  code?: string;
  type: "performance" | "structure" | "best-practice" | "security" | "optimization" | "refactor" | "feature";
  priority: "high" | "medium" | "low";
  icon: React.ReactNode;
}

export default function AISuggestions({ currentFile, onApplySuggestion }: AISuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  // Generate smart suggestions based on current file
  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [
      {
        id: "optimize-imports",
        title: "Optimize Import Statements",
        description: "Remove unused imports and organize them alphabetically for better code maintainability.",
        code: `// Before: import { useState, useEffect, useMemo } from 'react';
// After: import { useState, useEffect } from 'react'; // removed unused useMemo`,
        type: "optimization",
        priority: "medium",
        icon: <Zap className="text-yellow-500" size={16} />
      },
      {
        id: "add-error-handling",
        title: "Add Error Handling",
        description: "Wrap API calls in try-catch blocks to handle potential errors gracefully.",
        code: `try {
  const response = await apiRequest("GET", "/api/files");
  return response.json();
} catch (error) {
  console.error("Failed to fetch files:", error);
  throw new Error("Unable to load files");
}`,
        type: "best-practice",
        priority: "high",
        icon: <Bug className="text-red-500" size={16} />
      },
      {
        id: "add-typescript-types",
        title: "Improve TypeScript Types",
        description: "Add proper type definitions for better type safety and IDE support.",
        code: `interface FileData {
  id: number;
  path: string;
  content: string;
  isDirectory: boolean;
}`,
        type: "structure",
        priority: "medium",
        icon: <Code className="text-blue-500" size={16} />
      },
      {
        id: "performance-memo",
        title: "Memoize Expensive Calculations",
        description: "Use useMemo for expensive operations to prevent unnecessary re-computations.",
        code: `const filteredFiles = useMemo(() => 
  files.filter(file => 
    searchTerm === "" || 
    file.path.toLowerCase().includes(searchTerm.toLowerCase())
  ), [files, searchTerm]);`,
        type: "performance",
        priority: "medium",
        icon: <Zap className="text-green-500" size={16} />
      },
      {
        id: "add-loading-states",
        title: "Enhanced Loading States",
        description: "Add skeleton loaders and better loading indicators for improved user experience.",
        code: `{isLoading ? (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-600 rounded mb-2"></div>
    <div className="h-4 bg-gray-600 rounded mb-2 w-3/4"></div>
  </div>
) : (
  <FileContent />
)}`,
        type: "feature",
        priority: "low",
        icon: <Settings className="text-purple-500" size={16} />
      },
      {
        id: "keyboard-shortcuts",
        title: "Add Keyboard Shortcuts",
        description: "Implement keyboard shortcuts for common actions (Ctrl+N for new file, Ctrl+O for open).",
        code: `useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey)) {
      if (e.key === 'n') {
        e.preventDefault();
        setIsCreatingFile(true);
      }
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);`,
        type: "feature",
        priority: "low",
        icon: <Search className="text-indigo-500" size={16} />
      },
      {
        id: "git-integration",
        title: "Git Status Integration",
        description: "Show git status indicators next to files (modified, added, deleted).",
        code: `const getGitStatus = (file: FileData) => {
  // This would integrate with git API
  return file.isModified ? "M" : file.isNew ? "A" : "";
};`,
        type: "feature",
        priority: "low",
        icon: <GitBranch className="text-orange-500" size={16} />
      }
    ];

    return suggestions;
  };

  const suggestions = generateSuggestions();

  const applySuggestion = (suggestion: Suggestion) => {
    setAppliedSuggestions(prev => new Set(prev).add(suggestion.id));
    if (onApplySuggestion && suggestion.code) {
      onApplySuggestion(suggestion.code);
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setAppliedSuggestions(prev => new Set(prev).add(suggestionId));
  };

  const activeSuggestions = suggestions.filter(s => !appliedSuggestions.has(s.id));

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        >
          <Lightbulb size={20} />
          {activeSuggestions.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeSuggestions.length}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <Lightbulb className="text-yellow-500" size={18} />
          <span className="text-white font-medium">AI Suggestions</span>
          {activeSuggestions.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {activeSuggestions.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white p-1"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Suggestions List */}
      <div className="max-h-80 overflow-y-auto">
        {activeSuggestions.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Lightbulb className="mx-auto mb-2 text-gray-500" size={24} />
            <p className="text-sm">All suggestions applied!</p>
            <p className="text-xs mt-1">Keep coding for more AI insights.</p>
          </div>
        ) : (
          activeSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-3 border-b border-gray-700 last:border-b-0">
              <div className="flex items-start space-x-2">
                {suggestion.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-white truncate">
                      {suggestion.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      suggestion.priority === "high" 
                        ? "bg-red-900 text-red-300" 
                        : suggestion.priority === "medium"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-gray-700 text-gray-300"
                    }`}>
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">{suggestion.description}</p>
                  
                  {suggestion.code && (
                    <div className="bg-gray-900 rounded p-2 mb-2">
                      <pre className="text-xs text-green-300 overflow-x-auto">
                        <code>{suggestion.code}</code>
                      </pre>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => applySuggestion(suggestion)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                    >
                      <Check size={12} className="mr-1" />
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="text-gray-400 hover:text-white text-xs px-3 py-1"
                    >
                      <X size={12} className="mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="p-2 border-t border-gray-600 bg-gray-750">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Powered by AI</span>
          <span>{activeSuggestions.length} of {suggestions.length} remaining</span>
        </div>
      </div>
    </div>
  );
}