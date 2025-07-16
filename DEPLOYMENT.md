# Deployment Guide - Windows 11 Standalone

## Target System Specifications
- **Computer:** Laptop01 
- **Operating System:** Windows 11 Home (x64) Version 24H2 (build 26100.4652)
- **Processor:** Intel 13th Gen Core i7-13700H (14 cores, 20 threads, 2.93 GHz)
- **Memory:** 15.72 GB RAM (8GB + 8GB DDR4)
- **Storage:** 1.13 TB Samsung NVMe SSD (315.67 GB free)
- **User Account:** jason (Administrator privileges)

## Pre-Installation Requirements

### System Prerequisites
- Windows 11 Home (x64) - ✅ Confirmed
- Administrator access - ✅ Available
- 2GB+ free disk space - ✅ Available (315.67 GB free)
- Network connectivity (for initial setup only) - ✅ Available

### Software Dependencies
1. **Node.js 20.x LTS** 
   - Download from: https://nodejs.org/en/download/
   - Recommended: Windows x64 Installer (.msi)
   - Verify: `node --version` should show v20.x.x

2. **Git for Windows** (Optional, for development)
   - Download from: https://git-scm.com/download/win
   - Choose default settings during installation

## Installation Methods

### Method 1: Standalone Package (Recommended)
```batch
REM 1. Download LocalDevEnvironment-Windows11-Laptop01.zip
REM 2. Extract to C:\LocalDevEnvironment
cd C:\LocalDevEnvironment

REM 3. Install dependencies
npm install

REM 4. Start the application
start.bat
```

### Method 2: Git Clone (Development)
```batch
REM 1. Clone repository
git clone https://github.com/jasonclarkagain/local-dev-environment.git
cd local-dev-environment

REM 2. Install dependencies
npm install

REM 3. Start development server
npm run dev
```

### Method 3: Direct Download
1. Download ZIP from GitHub releases
2. Extract to desired folder
3. Follow standalone package instructions

## Configuration

### Environment Setup
Create `.env` file in root directory:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=sqlite:./data/database.db
UNRESTRICTED_MODE=true
OFFLINE_MODE=true
NO_TELEMETRY=true
WINDOWS_OPTIMIZATION=intel-13th-gen
MAX_MEMORY_USAGE=4096
WORKER_THREADS=20
```

### Windows Firewall Configuration
```powershell
# Allow Node.js through Windows Firewall (Run as Administrator)
netsh advfirewall firewall add rule name="Local Dev Environment" dir=in action=allow protocol=TCP localport=5000
```

### Performance Optimization for Intel 13th Gen
The application automatically detects and optimizes for:
- **Performance Cores:** 6 cores (P-cores)
- **Efficiency Cores:** 8 cores (E-cores)  
- **Total Threads:** 20 (with Hyper-Threading)
- **Memory Management:** Optimized for 16GB DDR4
- **Storage:** NVMe SSD optimizations enabled

## Security Configuration

### Local-Only Operation
- **Bind Address:** 127.0.0.1 (localhost only)
- **External Access:** Disabled by default
- **HTTPS:** Self-signed certificate available
- **CORS:** Restricted to localhost

### Data Encryption
- **Algorithm:** AES-256-GCM
- **Key Storage:** Windows Credential Store
- **Database:** SQLite with encryption at rest
- **Sessions:** Secure HTTP-only cookies

### Privacy Settings
- **Telemetry:** Completely disabled
- **External Connections:** Blocked (except for initial setup)
- **Data Collection:** None
- **Analytics:** Disabled

## Verification Steps

### 1. System Health Check
```batch
REM Access health endpoint
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "mode": "standalone-unrestricted",
  "system": "Windows 11 - Intel 13th Gen Core i7-13700H",
  "features": {
    "unrestricted": true,
    "offline": true,
    "telemetry": false
  }
}
```

### 2. Performance Verification
- **Startup Time:** < 10 seconds
- **Memory Usage:** < 1GB initial
- **CPU Usage:** < 5% idle
- **Disk I/O:** Optimized for SSD

### 3. Feature Testing
- ✅ AI Chat Assistant responding
- ✅ Code snippet generation working
- ✅ API key generation functional
- ✅ File management operational
- ✅ Project creation successful

## Troubleshooting

### Common Issues

#### Port 5000 Already in Use
```batch
REM Find process using port 5000
netstat -ano | findstr :5000

REM Kill process (replace PID with actual process ID)
taskkill /PID 1234 /F

REM Or change port in .env file
set PORT=5001
```

#### Node.js Not Found
```batch
REM Verify Node.js installation
where node
node --version

REM If not found, download and install from nodejs.org
```

#### Permission Denied Errors
```batch
REM Run Command Prompt as Administrator
REM Right-click Command Prompt -> "Run as administrator"
```

#### Antivirus Interference
- Add application folder to Windows Defender exclusions
- Whitelist Node.js executable in antivirus software

### Performance Issues

#### High Memory Usage
```env
# Reduce memory limit in .env
MAX_MEMORY_USAGE=2048
WORKER_THREADS=10
```

#### Slow Startup
```env
# Enable fast boot mode
FAST_BOOT=true
PRELOAD_MODULES=false
```

## Uninstallation

### Complete Removal
```batch
REM 1. Stop the application
taskkill /F /IM node.exe

REM 2. Remove application folder
rmdir /S /Q "C:\LocalDevEnvironment"

REM 3. Remove Windows Firewall rule
netsh advfirewall firewall delete rule name="Local Dev Environment"

REM 4. Clear Windows Credential Store (optional)
cmdkey /list | findstr "LocalDevEnvironment"
cmdkey /delete:LocalDevEnvironment
```

### Preserve Data
```batch
REM Backup data before uninstall
xcopy /E /I "C:\LocalDevEnvironment\data" "C:\Backup\LocalDevEnvironment"
```

## Support

### Log Files
- **Application Logs:** `./logs/application.log`
- **Error Logs:** `./logs/error.log`
- **Performance Logs:** `./logs/performance.log`

### System Information
```batch
REM Collect system information for support
systeminfo > system_info.txt
wmic cpu get name > cpu_info.txt
wmic memorychip get capacity > memory_info.txt
```

### Contact Information
- **Repository:** https://github.com/jasonclarkagain/local-dev-environment
- **Issues:** https://github.com/jasonclarkagain/local-dev-environment/issues
- **Documentation:** See README.md

---

**Deployment tested on:**
- Computer: Laptop01
- OS: Windows 11 Home (x64) Build 26100.4652  
- Processor: Intel 13th Gen Core i7-13700H
- Date: July 16, 2025