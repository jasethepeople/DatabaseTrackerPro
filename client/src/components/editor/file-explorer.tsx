import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, File, Folder, FilePlus, FolderPlus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FileExplorerProps {
  onFileSelect: (file: any) => void;
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"]));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);

  // Get the awesome-app project (project ID 1)
  const projectId = 1;

  // Fetch files from API
  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/projects", projectId, "files"],
    enabled: !!projectId,
  });

  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: async (newFile: { projectId: number; path: string; content: string; isDirectory: boolean }) => {
      const response = await apiRequest("POST", "/api/files", newFile);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      setIsCreatingFile(false);
      setNewFileName("");
    },
  });

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

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      createFileMutation.mutate({
        projectId,
        path: newFileName.trim(),
        content: "",
        isDirectory: false,
      });
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName?.trim()) {
      createFileMutation.mutate({
        projectId,
        path: folderName.trim(),
        content: "",
        isDirectory: true,
      });
    }
  };

  const renderFileTree = (files: any[], parentPath: string = "", depth: number = 0) => {
    const currentLevelFiles = files.filter(file => {
      if (parentPath === "") {
        // Root level - show files that don't contain '/' or are top-level folders
        return !file.path.includes('/') || (file.isDirectory && !file.path.includes('/'));
      }
      // For nested files, check if they are direct children of parentPath
      const relativePath = file.path.startsWith(parentPath) ? file.path.slice(parentPath.length) : "";
      return relativePath && !relativePath.includes('/') && file.path.startsWith(parentPath);
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-6 w-6 text-github-gray hover:text-white"
              onClick={() => setIsCreatingFile(true)}
              title="New File"
            >
              <FilePlus size={12} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-6 w-6 text-github-gray hover:text-white"
              onClick={handleCreateFolder}
              title="New Folder"
            >
              <FolderPlus size={12} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-6 w-6 text-github-gray hover:text-white"
              onClick={() => refetch()}
              title="Refresh"
            >
              <RotateCcw size={12} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-sm text-gray-400 p-2">Loading files...</div>
        ) : (
          <>
            {renderFileTree(files)}
            {isCreatingFile && (
              <div className="flex items-center space-x-1 py-1 px-2 mt-1">
                <File className="github-gray" size={16} />
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFile();
                    } else if (e.key === "Escape") {
                      setIsCreatingFile(false);
                      setNewFileName("");
                    }
                  }}
                  className="text-sm bg-transparent border-none outline-none text-white flex-1"
                  placeholder="Enter file name"
                  autoFocus
                />
              </div>
            )}
          </>
        )}
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
