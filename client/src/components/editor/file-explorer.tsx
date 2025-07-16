import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, File, Folder, FilePlus, FolderPlus, RotateCcw, Trash2, Edit, Copy, Download, Search, GitBranch, Bug } from "lucide-react";
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: any } | null>(null);
  const [isRenaming, setIsRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [draggedFile, setDraggedFile] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);

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

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      setContextMenu(null);
    },
  });

  // Rename file mutation
  const renameFileMutation = useMutation({
    mutationFn: async ({ fileId, newPath }: { fileId: number; newPath: string }) => {
      const response = await apiRequest("PATCH", `/api/files/${fileId}/rename`, { newPath });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      setIsRenaming(null);
      setRenameValue("");
    },
  });

  // Duplicate file mutation
  const duplicateFileMutation = useMutation({
    mutationFn: async (file: any) => {
      const newPath = file.isDirectory ? `${file.path}-copy` : `${file.path.replace(/(\.[^.]+)$/, '-copy$1')}`;
      const response = await apiRequest("POST", "/api/files", {
        projectId: file.projectId,
        path: newPath,
        content: file.content || "",
        isDirectory: file.isDirectory,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      setContextMenu(null);
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
    
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
      return <div className="w-4 h-4 bg-yellow-400 rounded text-black text-xs flex items-center justify-center font-bold">JS</div>;
    } else if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      return <div className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">TS</div>;
    } else if (filename.endsWith('.css')) {
      return <div className="w-4 h-4 bg-blue-400 rounded text-white text-xs flex items-center justify-center font-bold">CSS</div>;
    } else if (filename.endsWith('.html')) {
      return <div className="w-4 h-4 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">HTML</div>;
    } else if (filename.endsWith('.json')) {
      return <div className="w-4 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">JSON</div>;
    } else if (filename.endsWith('.md')) {
      return <div className="w-4 h-4 bg-gray-600 rounded text-white text-xs flex items-center justify-center font-bold">MD</div>;
    } else if (filename.endsWith('.py')) {
      return <div className="w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">PY</div>;
    } else if (filename.endsWith('.java')) {
      return <div className="w-4 h-4 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">JAVA</div>;
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

  const handleContextMenu = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleRename = (file: any) => {
    setIsRenaming(file.id);
    setRenameValue(file.path);
    setContextMenu(null);
  };

  const submitRename = () => {
    if (isRenaming && renameValue.trim()) {
      renameFileMutation.mutate({ fileId: isRenaming, newPath: renameValue.trim() });
    }
  };

  const handleDelete = (file: any) => {
    if (confirm(`Are you sure you want to delete "${file.path}"?`)) {
      deleteFileMutation.mutate(file.id);
    }
  };

  const handleDuplicate = (file: any) => {
    duplicateFileMutation.mutate(file);
  };

  const handleDownload = (file: any) => {
    if (!file.isDirectory) {
      const blob = new Blob([file.content || ""], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.path.split("/").pop() || "file";
      a.click();
      URL.revokeObjectURL(url);
    }
    setContextMenu(null);
  };

  const handleDragStart = (e: React.DragEvent, file: any) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetFolder: any) => {
    e.preventDefault();
    if (draggedFile && targetFolder.isDirectory && draggedFile.id !== targetFolder.id) {
      const newPath = `${targetFolder.path}/${draggedFile.path.split("/").pop()}`;
      renameFileMutation.mutate({ fileId: draggedFile.id, newPath });
    }
    setDraggedFile(null);
  };

  const filteredFiles = files.filter((file: any) => 
    searchTerm === "" || file.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            } ${draggedFile?.id === file.id ? "opacity-50" : ""}`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => file.isDirectory ? toggleFolder(file.path) : handleFileSelect(file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            draggable={!file.isDirectory}
            onDragStart={(e) => handleDragStart(e, file)}
            onDragOver={file.isDirectory ? handleDragOver : undefined}
            onDrop={file.isDirectory ? (e) => handleDrop(e, file) : undefined}
          >
            {file.isDirectory && (
              isExpanded ? 
                <ChevronDown className="github-gray" size={12} /> : 
                <ChevronRight className="github-gray" size={12} />
            )}
            {!file.isDirectory && <div className="w-3" />}
            {getFileIcon(filename, file.isDirectory)}
            
            {isRenaming === file.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitRename();
                  } else if (e.key === "Escape") {
                    setIsRenaming(null);
                    setRenameValue("");
                  }
                }}
                onBlur={submitRename}
                className="text-sm bg-transparent border border-blue-500 outline-none text-white flex-1 px-1"
                autoFocus
              />
            ) : (
              <span className="text-sm text-white">{filename}</span>
            )}
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
      
      {/* Search Bar */}
      {showSearch && (
        <div className="p-2 border-b border-opacity-20 border-white">
          <div className="flex items-center space-x-2">
            <Search className="github-gray" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm bg-transparent border border-gray-600 rounded px-2 py-1 outline-none text-white flex-1"
              placeholder="Search files..."
            />
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-sm text-gray-400 p-2">Loading files...</div>
        ) : (
          <>
            {renderFileTree(filteredFiles)}
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

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleRename(contextMenu.file)}
              className="w-full text-left px-3 py-1 hover:bg-gray-700 text-white text-sm flex items-center space-x-2"
            >
              <Edit size={14} />
              <span>Rename</span>
            </button>
            <button
              onClick={() => handleDuplicate(contextMenu.file)}
              className="w-full text-left px-3 py-1 hover:bg-gray-700 text-white text-sm flex items-center space-x-2"
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </button>
            {!contextMenu.file.isDirectory && (
              <button
                onClick={() => handleDownload(contextMenu.file)}
                className="w-full text-left px-3 py-1 hover:bg-gray-700 text-white text-sm flex items-center space-x-2"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            )}
            <div className="border-t border-gray-600 my-1" />
            <button
              onClick={() => handleDelete(contextMenu.file)}
              className="w-full text-left px-3 py-1 hover:bg-red-600 text-red-400 hover:text-white text-sm flex items-center space-x-2"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
      
      {/* Sidebar Tabs */}
      <div className="border-t border-opacity-20 border-white">
        <div className="flex">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`flex-1 py-2 text-xs text-center border-r border-opacity-20 border-white ${showSearch ? "github-elevated" : "github-gray"} hover:text-white`}
            title="Search Files"
          >
            <Search size={14} />
          </button>
          <button 
            className="flex-1 py-2 text-xs text-center border-r border-opacity-20 border-white github-gray hover:text-white"
            title="Source Control"
          >
            <GitBranch size={14} />
          </button>
          <button 
            className="flex-1 py-2 text-xs text-center github-gray hover:text-white"
            title="Debug"
          >
            <Bug size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
