import { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import FileExplorer from "@/components/editor/file-explorer";
import CodeEditor from "@/components/editor/code-editor";
import Terminal from "@/components/editor/terminal";
import ToolMarketplace from "@/components/tools/tool-marketplace";
import ServiceDashboard from "@/components/services/service-dashboard";
import HardwareMonitor from "@/components/monitoring/hardware-monitor";

export default function Dashboard() {
  const [activeRightTab, setActiveRightTab] = useState<"tools" | "services" | "monitor">("tools");
  const [currentFile, setCurrentFile] = useState<any>(null);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--github-dark)" }}>
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        <div className="w-64 github-surface border-r border-opacity-20 border-white">
          <FileExplorer onFileSelect={setCurrentFile} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Code Editor */}
          <div className={`flex-1 ${isTerminalVisible ? 'h-3/5' : 'h-full'}`}>
            <CodeEditor file={currentFile} />
          </div>
          
          {/* Terminal */}
          {isTerminalVisible && (
            <div className="h-2/5 border-t border-opacity-20 border-white">
              <Terminal onToggle={() => setIsTerminalVisible(false)} />
            </div>
          )}
        </div>
        
        {/* Right Sidebar - Tools & Services */}
        <div className="w-80 github-surface border-l border-opacity-20 border-white">
          <Sidebar 
            activeTab={activeRightTab} 
            onTabChange={setActiveRightTab}
          />
          
          <div className="flex-1 overflow-y-auto">
            {activeRightTab === "tools" && <ToolMarketplace />}
            {activeRightTab === "services" && <ServiceDashboard />}
            {activeRightTab === "monitor" && <HardwareMonitor />}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-6 px-4 flex items-center justify-between text-xs text-white" style={{ backgroundColor: "var(--github-blue)" }}>
        <div className="flex items-center space-x-4">
          <span>VM: Running</span>
          <span>main</span>
          <span>12 files</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Ln 7, Col 42</span>
          <span>JavaScript</span>
          <span>UTF-8</span>
        </div>
      </div>
      
      {/* Floating VM Button */}
      {!isTerminalVisible && (
        <button
          onClick={() => setIsTerminalVisible(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white z-50"
          style={{ backgroundColor: "var(--github-blue)" }}
          title="Show Terminal"
        >
          <span className="text-lg">$</span>
        </button>
      )}
    </div>
  );
}
