import { useState, useRef, useEffect } from "react";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeEditorProps {
  file: any;
}

export default function CodeEditor({ file }: CodeEditorProps) {
  const [openTabs, setOpenTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (file && !file.isDirectory) {
      // Check if tab is already open
      const existingTab = openTabs.find(tab => tab.id === file.id);
      if (!existingTab) {
        setOpenTabs(prev => [...prev, file]);
      }
      setActiveTabId(file.id);
      setCode(file.content || "");
    }
  }, [file]);

  const closeTab = (tabId: number) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      const remaining = openTabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remaining.length > 0 ? remaining[0].id : null);
      setCode(remaining.length > 0 ? remaining[0].content || "" : "");
    }
  };

  const switchTab = (tab: any) => {
    setActiveTabId(tab.id);
    setCode(tab.content || "");
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.js')) {
      return <div className="w-4 h-4 bg-yellow-400 rounded text-black text-xs flex items-center justify-center font-bold">JS</div>;
    } else if (filename.endsWith('.css')) {
      return <div className="w-4 h-4 bg-blue-400 rounded text-white text-xs flex items-center justify-center font-bold">CSS</div>;
    }
    return <div className="w-4 h-4 bg-gray-400 rounded text-white text-xs flex items-center justify-center">•</div>;
  };

  const runCode = () => {
    // In real app, send to terminal/VM
    console.log("Running code:", code);
  };

  if (openTabs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center github-dark">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-white mb-2">No file selected</h3>
          <p className="github-gray">Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col github-dark">
      {/* Editor Tabs */}
      <div className="github-surface border-b border-opacity-20 border-white">
        <div className="flex overflow-x-auto">
          {openTabs.map(tab => {
            const filename = tab.path.split('/').pop();
            const isActive = activeTabId === tab.id;
            
            return (
              <div
                key={tab.id}
                className={`flex items-center space-x-2 px-4 py-2 border-r border-opacity-20 border-white cursor-pointer min-w-0 ${
                  isActive ? "github-dark border-b-2 border-blue-500" : "github-gray"
                }`}
                onClick={() => switchTab(tab)}
              >
                {getFileIcon(filename)}
                <span className="text-sm truncate text-white">{filename}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="github-gray hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Header */}
      <div className="github-surface border-b border-opacity-20 border-white px-4 py-2 flex justify-between items-center">
        <h3 className="font-bold text-white">Code Editor</h3>
        <Button
          onClick={runCode}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Play size={14} className="mr-1" />
          Run
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-4 bg-transparent text-white font-mono text-sm leading-6 resize-none outline-none"
          style={{
            fontFamily: "'SF Mono', 'Monaco', 'Cascadia Code', monospace",
            lineHeight: 1.5,
            tabSize: 2
          }}
          placeholder="Start coding..."
          spellCheck={false}
        />
        
        {/* Line numbers overlay */}
        <div className="absolute left-0 top-0 p-4 pointer-events-none github-gray font-mono text-sm leading-6">
          {code.split('\n').map((_, index) => (
            <div key={index} className="text-right w-8 pr-2">
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
