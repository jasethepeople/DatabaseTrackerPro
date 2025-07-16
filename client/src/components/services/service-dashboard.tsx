import { useQuery } from "@tanstack/react-query";
import { Play, Square, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ServiceDashboard() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  // Mock services for demo - in real implementation these would come from installed tools
  const mockServices = [
    {
      id: 1,
      name: "n8n",
      type: "docker",
      status: "running",
      port: 5678,
      config: { image: "n8nio/n8n:latest" },
      url: "http://localhost:5678"
    },
    {
      id: 2,
      name: "web-server",
      type: "docker",
      status: "running",
      port: 3000,
      config: { image: "nginx:alpine" }
    },
    {
      id: 3,
      name: "database",
      type: "docker",
      status: "stopped",
      port: 5432,
      config: { image: "postgres:15" }
    },
    {
      id: 4,
      name: "redis-cache",
      type: "docker",
      status: "running",
      port: 6379,
      config: { image: "redis:7" }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-600";
      case "stopped":
        return "bg-gray-600";
      case "starting":
        return "bg-yellow-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "docker":
        return "🐳";
      case "systemd":
        return "⚙️";
      default:
        return "🔧";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-white">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Running Services</h3>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
            Add Service
          </Button>
        </div>

        {/* Services List */}
        <div className="space-y-3">
          {mockServices.map(service => (
            <div
              key={service.id}
              className="github-elevated rounded-lg p-3 border border-opacity-20 border-white"
            >
              {/* Service Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getServiceIcon(service.type)}</span>
                  <span className="font-medium text-white">{service.name}</span>
                  <Badge
                    className={`text-xs ${getStatusColor(service.status)} text-white`}
                  >
                    {service.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1">
                  {service.status === "running" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 github-gray hover:text-red-400"
                    >
                      <Square size={14} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 github-gray hover:text-green-400"
                    >
                      <Play size={14} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 github-gray hover:text-blue-400"
                  >
                    <RotateCcw size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 github-gray hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Service Details */}
              <div className="text-xs github-gray space-y-1">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-white">{service.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="text-white">{service.port}</span>
                </div>
                {service.config.image && (
                  <div className="flex justify-between">
                    <span>Image:</span>
                    <span className="text-white">{service.config.image}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {service.status === "running" && service.port && (
                <div className="mt-2 pt-2 border-t border-opacity-20 border-white">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs github-blue hover:text-blue-400"
                    onClick={() => {
                      const url = service.url || `http://localhost:${service.port}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Open in Browser ↗
                  </Button>
                  {service.name === 'n8n' && (
                    <div className="mt-1 text-xs github-gray">
                      Login: admin / admin123
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Service */}
        <div className="github-elevated rounded-lg p-3 border border-dashed border-opacity-20 border-white">
          <div className="text-center">
            <div className="text-2xl mb-2">➕</div>
            <p className="text-sm github-gray mb-2">No custom services yet</p>
            <Button size="sm" variant="ghost" className="text-xs github-blue">
              Create Service
            </Button>
          </div>
        </div>

        {/* Service Templates */}
        <div>
          <h4 className="text-sm font-medium text-white mb-2">Quick Start Templates</h4>
          <div className="grid grid-cols-1 gap-2">
            {[
              { name: "n8n Workflow", icon: "🔄", description: "Automation platform" },
              { name: "Web Server", icon: "🌐", description: "Nginx/Apache" },
              { name: "Database", icon: "🗄️", description: "PostgreSQL/MySQL" },
              { name: "Cache", icon: "⚡", description: "Redis/Memcached" },
              { name: "Queue", icon: "📬", description: "RabbitMQ/SQS" },
            ].map(template => (
              <button
                key={template.name}
                className="github-elevated hover:bg-opacity-80 border border-opacity-20 border-white rounded p-2 text-left text-white hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>{template.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{template.name}</div>
                    <div className="text-xs github-gray">{template.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
