#!/bin/bash

echo "=== Creating AI Agent Deployment Package ==="

# Create deployment directory
DEPLOY_DIR="/tmp/ai-agent-deployment"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy all essential files
echo "1. Copying project files..."
cp -r client $DEPLOY_DIR/
cp -r server $DEPLOY_DIR/
cp -r shared $DEPLOY_DIR/
cp -r attached_assets $DEPLOY_DIR/ 2>/dev/null || true
cp package*.json $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp vite.config.ts $DEPLOY_DIR/
cp tailwind.config.ts $DEPLOY_DIR/
cp postcss.config.js $DEPLOY_DIR/
cp drizzle.config.ts $DEPLOY_DIR/
cp components.json $DEPLOY_DIR/
cp replit.md $DEPLOY_DIR/
cp WINDOWS_DEPLOYMENT_GUIDE.md $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/ORIGINAL_README.md 2>/dev/null || true

# Create deployment files
cd $DEPLOY_DIR

# Create .gitignore
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp
*.swo
GITIGNORE

echo "2. Package created at: /tmp/ai-agent-deployment"
echo "3. Creating ZIP file..."

cd /tmp
zip -r ai-agent-deployment.zip ai-agent-deployment/

# Get size
SIZE=$(du -h ai-agent-deployment.zip | cut -f1)

echo
echo "=== Package Created Successfully ==="
echo "Location: /tmp/ai-agent-deployment.zip"
echo "Size: $SIZE"
echo "==================================="

# Create a symlink in public directory for download
ln -sf /tmp/ai-agent-deployment.zip /home/runner/workspace/client/public/ai-agent-deployment.zip 2>/dev/null || true

echo
echo "Download link will be available at:"
echo "http://localhost:5000/ai-agent-deployment.zip"
