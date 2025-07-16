import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, File, Folder, FilePlus, FolderPlus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileExplorerProps {
  onFileSelect: (file: any) => void;
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"]));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Mock data for now - in real app, fetch from API
  const mockFiles = [
    { id: 1, path: "src", isDirectory: true, content: "" },
    { id: 2, path: "src/index.js", isDirectory: false, content: "console.log('Hello World!');" },
    { id: 3, path: "src/app.js", isDirectory: false, content: "const express = require('express');\nconst app = express();" },
    { id: 4, path: "src/styles.css", isDirectory: false, content: "body { margin: 0; }" },
    { id: 5, path: "components", isDirectory: true, content: "" },
    { id: 6, path: "package.json", isDirectory: false, content: '{\n  "name": "my-app"\n}' },
    { id: 7, path: "README.md", isDirectory: false, content: "# My Awesome App" },
  ];

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileSelect = (file: any) => {
    if (!file.isDirectory) {
      setSelectedFile(file.path);
      onFileSelect(file);
    }
  };

  const getFileIcon = (filename: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="github-blue" size={16} />;
    }
    
    if (filename.endsWith('.js')) {
      return <div className="w-4 h-4 bg-yellow-400 rounded text-black text-xs flex items-center justify-center font-bold">JS</div>;
    } else if (filename.endsWith('.css')) {
      return <div className="w-4 h-4 bg-blue-400 rounded text-white text-xs flex items-center justify-center font-bold">CSS</div>;
    } else if (filename.endsWith('.md')) {
      return <File className="github-gray" size={16} />;
    }
    
    return <File className="github-gray" size={16} />;
  };

  const renderFileTree = (files: any[], parentPath: string = "", depth: number = 0) => {
    const currentLevelFiles = files.filter(file => {
      const pathParts = file.path.split('/');
      const expectedDepth = pathParts.length - 1;
      return expectedDepth === depth && file.path.startsWith(parentPath);
    });

    return currentLevelFiles.map(file => {
      const filename = file.path.split('/').pop();
      const isExpanded = expandedFolders.has(file.path);
      const isSelected = selectedFile === file.path;

      return (
        <div key={file.id}>
          <div
            className={`flex items-center space-x-1 py-1 px-2 rounded cursor-pointer hover:bg-white hover:bg-opacity-5 ${
              isSelected ? "github-elevated" : ""
            }`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => file.isDirectory ? toggleFolder(file.path) : handleFileSelect(file)}
          >
            {file.isDirectory && (
              isExpanded ? 
                <ChevronDown className="github-gray" size={12} /> : 
                <ChevronRight className="github-gray" size={12} />
            )}
            {!file.isDirectory && <div className="w-3" />}
            {getFileIcon(filename, file.isDirectory)}
            <span className="text-sm text-white">{filename}</span>
          </div>
          
          {file.isDirectory && isExpanded && (
            <div>
              {renderFileTree(
                files.filter(f => f.path.startsWith(file.path + '/') && f.path !== file.path),
                file.path + '/',
                depth + 1
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-opacity-20 border-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">EXPLORER</span>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6 text-github-gray hover:text-white">
              <FilePlus size={12} />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6 text-github-gray hover:text-white">
              <FolderPlus size={12} />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6 text-github-gray hover:text-white">
              <RotateCcw size={12} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {renderFileTree(mockFiles)}
      </div>
      
      {/* Sidebar Tabs */}
      <div className="border-t border-opacity-20 border-white">
        <div className="flex">
          <button className="flex-1 py-2 text-xs text-center border-r border-opacity-20 border-white github-elevated">
            <i className="fas fa-search"></i>
          </button>
          <button className="flex-1 py-2 text-xs text-center border-r border-opacity-20 border-white github-gray">
            <i className="fas fa-code-branch"></i>
          </button>
          <button className="flex-1 py-2 text-xs text-center github-gray">
            <i className="fas fa-bug"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
