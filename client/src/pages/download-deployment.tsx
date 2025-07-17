import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Package, Github, CheckCircle2, FileText, Shield } from "lucide-react";

export default function DownloadDeployment() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Download AI Agent Development Environment</h1>
        <p className="text-lg text-muted-foreground">
          Complete package ready for Windows 11 deployment
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Deployment Package
          </CardTitle>
          <CardDescription>
            ai-agent-deployment.tar.gz (380 KB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                What's Included
              </h3>
              <ul className="text-sm space-y-1 ml-6">
                <li>• Complete source code</li>
                <li>• Venice AI integration</li>
                <li>• Security tools (Metasploit, OSINT)</li>
                <li>• Windows deployment scripts</li>
                <li>• Documentation & guides</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Features Ready
              </h3>
              <ul className="text-sm space-y-1 ml-6">
                <li>• 100% unrestricted operation</li>
                <li>• Local dev environments</li>
                <li>• FBI forensics tools</li>
                <li>• Live vulnerability DB</li>
                <li>• Self-repair system</li>
              </ul>
            </div>
          </div>

          <div className="pt-4">
            <a 
              href="/api/download/deployment-package" 
              download
              className="inline-block"
            >
              <Button size="lg" className="w-full md:w-auto">
                <Download className="mr-2 h-5 w-5" />
                Download Package (380 KB)
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. Extract to <code className="bg-muted px-1">C:\AIAgent\</code></li>
              <li>2. Run <code className="bg-muted px-1">START_WINDOWS.bat</code></li>
              <li>3. Access at <code className="bg-muted px-1">http://localhost:5000</code></li>
              <li>4. Login: admin / password</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">Your credentials:</p>
            <div className="space-y-1 text-sm">
              <p><strong>Email:</strong> jasonclarkagain@gmail.com</p>
              <p><strong>Password:</strong> Tyczki69!Tyczki69!</p>
            </div>
            <p className="text-sm mt-3 text-muted-foreground">
              Run UPLOAD_TO_GITHUB.bat after setup
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-2">Minimum:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Windows 11 (64-bit)</li>
                <li>• 8GB RAM</li>
                <li>• Node.js 18.x</li>
                <li>• PostgreSQL 14+</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Recommended:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Windows 11 Pro</li>
                <li>• 16GB RAM</li>
                <li>• Intel i7-13700H</li>
                <li>• SSD storage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}