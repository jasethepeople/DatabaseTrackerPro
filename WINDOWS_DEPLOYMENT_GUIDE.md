# AI Agent Development Environment - Windows 11 Deployment Guide

## 📋 System Requirements

- **OS**: Windows 11 (64-bit)
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 10GB free space
- **CPU**: Intel Core i5 or better (i7-13700H recommended)
- **Software**: 
  - Node.js 18.x or higher
  - Git for Windows
  - PostgreSQL 14+ (or use cloud database)

## 🚀 Quick Start (5 Minutes)

### Step 1: Extract Files
1. Extract the `ai-agent-dev-environment.zip` to `C:\AIAgent\`
2. Ensure all files are extracted (should see `package.json` in the root)

### Step 2: Install Dependencies
1. Open Windows Terminal or Command Prompt as Administrator
2. Navigate to the project directory:
   ```cmd
   cd C:\AIAgent
   ```
3. Install Node.js dependencies:
   ```cmd
   npm install
   ```

### Step 3: Configure Environment
1. Copy `.env.example` to `.env`:
   ```cmd
   copy .env.example .env
   ```
2. Edit `.env` file and add:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_secure_random_string
   VENICE_AI_API_KEY=L3TqrWJtkL32QRfShRI9h8wgtdLRk6ODddDFKsqZ_a
   NODE_ENV=production
   ```

### Step 4: Initialize Database
```cmd
npm run db:push
```

### Step 5: Build Application
```cmd
npm run build
```

### Step 6: Start Application
```cmd
npm start
```

The application will be available at `http://localhost:5000`

## 🔐 Default Login Credentials
- **Username**: admin
- **Password**: password

⚠️ **IMPORTANT**: Change these credentials immediately after first login!

## 🛠️ GitHub Repository Setup

### Prerequisites
- GitHub account: jasonclarkagain@gmail.com
- Password: Tyczki69!Tyczki69!

### Step 1: Create Repository
1. Go to https://github.com/new
2. Repository name: `ai-agent-dev-environment`
3. Set to Private
4. Do NOT initialize with README

### Step 2: Push Code
```bash
cd C:\AIAgent
git init
git add .
git commit -m "Initial commit - AI Agent Development Environment"
git branch -M main
git remote add origin https://github.com/jasonclarkagain/ai-agent-dev-environment.git
git push -u origin main
```

### Step 3: Setup Secrets
Go to Settings → Secrets and add:
- `DATABASE_URL`
- `JWT_SECRET`
- `VENICE_AI_API_KEY`

## 🖥️ Windows 11 Specific Setup

### Enable Developer Mode
1. Settings → Privacy & Security → For developers
2. Turn on "Developer Mode"

### Windows Defender Exclusion
1. Windows Security → Virus & threat protection
2. Manage settings → Add exclusions
3. Add folder: `C:\AIAgent`

### Run as Windows Service (Optional)
1. Install PM2 globally:
   ```cmd
   npm install -g pm2
   npm install -g pm2-windows-startup
   ```
2. Start application:
   ```cmd
   pm2 start npm --name "ai-agent" -- start
   pm2 save
   pm2-startup install
   ```

## 🔧 Features Overview

### 1. Venice AI Integration
- Unrestricted AI code generation
- Privacy-focused, no censorship
- API Key: L3TqrWJtkL32QRfShRI9h8wgtdLRk6ODddDFKsqZ_a

### 2. Local Dev Environment
- VM management and orchestration
- Integrated terminal with full system access
- Multiple framework support (Next.js, Express, etc.)

### 3. Security Tools
- **Metasploit Framework**: Penetration testing
- **OSINT Framework**: Intelligence gathering
- **Social Engineering Toolkit**: Security assessment
- **FBI Data Recovery Suite**: Forensic analysis
- **Live Vulnerability Database**: Real-time security feeds

### 4. Additional Features
- Multiplayer collaboration
- Secrets management
- Database browser
- Version control integration
- Autonomous self-repair system
- AI-powered code suggestions

## 📁 Project Structure
```
C:\AIAgent\
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
├── dist/            # Built files (after npm run build)
├── node_modules/    # Dependencies
├── package.json     # Project configuration
├── .env            # Environment variables
└── README.md       # Documentation
```

## 🚨 Troubleshooting

### Port Already in Use
```cmd
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format: `postgresql://user:pass@localhost:5432/dbname`
- Use cloud database like Neon for easier setup

### Build Errors
```cmd
npm cache clean --force
rmdir /s /q node_modules
npm install
```

### Permission Issues
- Run Command Prompt as Administrator
- Ensure Windows Defender exclusion is set

## 🔄 Updates and Maintenance

### Update Dependencies
```cmd
npm update
npm audit fix
```

### Backup Database
```cmd
pg_dump -U postgres ai_agent > backup.sql
```

### Pull Latest from GitHub
```cmd
git pull origin main
npm install
npm run build
npm start
```

## 📞 Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Review error messages in browser console
3. Ensure all environment variables are set correctly
4. Verify Node.js and PostgreSQL versions

## ⚡ Performance Optimization

### For HP Envy Laptop 17-cw0xxx
1. Set Power Mode to "Best Performance"
2. Disable unnecessary startup programs
3. Use SSD for installation directory
4. Allocate at least 4GB RAM to Node.js:
   ```cmd
   set NODE_OPTIONS=--max-old-space-size=4096
   ```

## 🔒 Security Notes

1. **Change default credentials immediately**
2. **Keep Venice AI API key secure**
3. **Use HTTPS in production** (configure reverse proxy)
4. **Regular security updates**
5. **Monitor access logs**

## ✅ Final Checklist

- [ ] Extracted all files to C:\AIAgent
- [ ] Installed Node.js dependencies
- [ ] Configured .env file
- [ ] Database initialized
- [ ] Application built successfully
- [ ] Can access http://localhost:5000
- [ ] Changed default admin password
- [ ] Pushed to GitHub repository
- [ ] Windows Defender exclusion added
- [ ] PM2 service configured (optional)

---

**Congratulations!** Your AI Agent Development Environment is now ready for use on Windows 11.

Remember: This is a 100% unrestricted system. Use responsibly and ensure proper security measures are in place.