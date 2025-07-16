import { useQuery } from "@tanstack/react-query";
import { Cpu, HardDrive, MemoryStick, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HardwareMonitor() {
  const { data: hardware, isLoading } = useQuery({
    queryKey: ["/api/hardware"],
    refetchInterval: 2000, // Update every 2 seconds
  });

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-white">Loading hardware status...</div>
      </div>
    );
  }

  const cpuUsage = hardware?.cpu || 0;
  const memoryUsage = hardware?.memory ? (hardware.memory.used / hardware.memory.total) * 100 : 0;
  const diskUsage = hardware?.disk ? (hardware.disk.used / hardware.disk.total) * 100 : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-3">
          {/* CPU Usage */}
          <Card className="github-elevated border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center space-x-2">
                <Cpu className="github-blue" size={16} />
                <span>CPU Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="github-gray">Usage</span>
                  <span className="text-white">{cpuUsage}%</span>
                </div>
                <Progress 
                  value={cpuUsage} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card className="github-elevated border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center space-x-2">
                <MemoryStick className="github-blue" size={16} />
                <span>Memory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="github-gray">Used</span>
                  <span className="text-white">
                    {hardware?.memory ? formatBytes(hardware.memory.used * 1024 * 1024) : "0 MB"} / 
                    {hardware?.memory ? formatBytes(hardware.memory.total * 1024 * 1024) : "0 MB"}
                  </span>
                </div>
                <Progress 
                  value={memoryUsage} 
                  className="h-2"
                />
                <div className="text-xs text-right github-gray">
                  {memoryUsage.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disk Usage */}
          <Card className="github-elevated border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center space-x-2">
                <HardDrive className="github-blue" size={16} />
                <span>Disk Space</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="github-gray">Used</span>
                  <span className="text-white">
                    {hardware?.disk ? formatBytes(hardware.disk.used * 1024 * 1024) : "0 MB"} / 
                    {hardware?.disk ? formatBytes(hardware.disk.total * 1024 * 1024) : "0 MB"}
                  </span>
                </div>
                <Progress 
                  value={diskUsage} 
                  className="h-2"
                />
                <div className="text-xs text-right github-gray">
                  {diskUsage.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* VM Status */}
        <Card className="github-elevated border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center space-x-2">
              <Activity className="github-blue" size={16} />
              <span>VM Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs github-gray">Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-white">Running</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs github-gray">Uptime</span>
                <span className="text-xs text-white">2h 34m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs github-gray">VM ID</span>
                <span className="text-xs text-white font-mono">vm-12345</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="github-elevated border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="github-gray">Load Average</span>
                <span className="text-white">0.52, 0.48, 0.51</span>
              </div>
              <div className="flex justify-between">
                <span className="github-gray">Processes</span>
                <span className="text-white">127 running</span>
              </div>
              <div className="flex justify-between">
                <span className="github-gray">Network I/O</span>
                <span className="text-white">↑ 1.2KB/s ↓ 4.5KB/s</span>
              </div>
              <div className="flex justify-between">
                <span className="github-gray">Disk I/O</span>
                <span className="text-white">R: 2.1MB/s W: 0.8MB/s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="github-elevated border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <button className="github-elevated hover:bg-opacity-80 border border-opacity-20 border-white rounded p-2 text-xs text-white hover:border-blue-500 transition-colors">
                Restart VM
              </button>
              <button className="github-elevated hover:bg-opacity-80 border border-opacity-20 border-white rounded p-2 text-xs text-white hover:border-blue-500 transition-colors">
                Clear Cache
              </button>
              <button className="github-elevated hover:bg-opacity-80 border border-opacity-20 border-white rounded p-2 text-xs text-white hover:border-blue-500 transition-colors">
                Update System
              </button>
              <button className="github-elevated hover:bg-opacity-80 border border-opacity-20 border-white rounded p-2 text-xs text-white hover:border-blue-500 transition-colors">
                View Logs
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
