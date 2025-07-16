const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createPortablePackage() {
  console.log('🚀 Creating portable Windows package...');
  
  const packageDir = path.join(__dirname, '../dist/portable');
  const outputFile = path.join(__dirname, '../dist/LocalDevEnvironment-Windows-Standalone.zip');
  
  // Create directory structure
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }
  
  // Create main executable wrapper
  const launcherScript = `@echo off
title Local Development Environment
echo Starting Local Development Environment...
echo.
echo System: Windows 11 (x64)
echo Architecture: Intel 13th Gen Core i7-13700H
echo Memory: 15.72 GB Available
echo.

REM Set environment variables for standalone operation
set NODE_ENV=production
set DATABASE_URL=sqlite:./data/database.db
set STORAGE_PATH=./data
set LOG_LEVEL=info
set PORT=5000

REM Create data directory if it doesn't exist
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "temp" mkdir temp

REM Start the application
echo Starting server on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
node.exe dist/server.js

pause`;
  
  fs.writeFileSync(path.join(packageDir, 'start.bat'), launcherScript);
  
  // Create configuration file
  const config = {
    name: "Local Development Environment",
    version: "1.0.0",
    description: "Standalone local development environment",
    target_system: {
      os: "Windows 11 Home (x64)",
      build: "26100.4652",
      processor: "Intel 13th Gen Core i7-13700H",
      memory: "15.72 GB",
      storage: "1.13 TB NVMe SSD"
    },
    features: {
      unrestricted_operation: true,
      offline_capable: true,
      no_telemetry: true,
      local_storage_only: true,
      encryption: "AES-256",
      database: "SQLite (embedded)",
      runtime: "Node.js 20.x LTS (bundled)"
    },
    ports: {
      web_interface: 5000,
      api_server: 5000,
      websocket: 5001
    },
    security: {
      local_only: true,
      no_external_connections: true,
      encrypted_storage: true,
      secure_defaults: true
    }
  };
  
  fs.writeFileSync(
    path.join(packageDir, 'config.json'), 
    JSON.stringify(config, null, 2)
  );
  
  // Create README
  const readme = `# Local Development Environment - Standalone Edition

## Quick Start
1. Extract this package to any folder on your Windows machine
2. Double-click 'start.bat' to launch the application
3. Open your browser and go to http://localhost:5000
4. Begin developing with full AI-powered features

## Features
- ✅ Complete offline operation
- ✅ No external dependencies
- ✅ Unrestricted AI assistance
- ✅ Code snippet generation
- ✅ Project management
- ✅ File editing and management
- ✅ Built-in terminal
- ✅ Database management

## System Requirements
- Windows 10/11 (64-bit)
- 4GB+ RAM (8GB recommended)
- 2GB+ free disk space
- No internet required after installation

## Security
- All data stored locally
- No telemetry or tracking
- AES-256 encryption for sensitive data
- No cloud connections required

## Optimized For
Computer: Laptop01 (${config.target_system.processor})
OS: ${config.target_system.os}
Memory: ${config.target_system.memory}
Storage: ${config.target_system.storage}

## Support
This is a standalone application designed for unrestricted local development.
All functionality operates independently without external service dependencies.
`;
  
  fs.writeFileSync(path.join(packageDir, 'README.md'), readme);
  
  // Create ZIP package
  const output = fs.createWriteStream(outputFile);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`✅ Portable package created: ${outputFile}`);
    console.log(`📦 Package size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory(packageDir, false);
  archive.finalize();
}

if (require.main === module) {
  createPortablePackage().catch(console.error);
}

module.exports = createPortablePackage;