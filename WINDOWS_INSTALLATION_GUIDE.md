# Windows 11 Installation Guide

## Prerequisites
- Windows 11 Home (x64) Build 26100.4652 or later
- Intel 13th Gen Core i7-13700H or equivalent
- 16GB RAM (15.72GB available)
- 10GB free disk space

## Step 1: Install Node.js
1. Download Node.js 20.x from https://nodejs.org/
2. Run the installer as Administrator
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

## Step 2: Install Git
1. Download Git from https://git-scm.com/download/win
2. Install with default settings
3. Verify installation:
   ```cmd
   git --version
   ```

## Step 3: Clone the Repository
1. Open Command Prompt as Administrator
2. Navigate to your desired directory:
   ```cmd
   cd C:\
   mkdir Projects
   cd Projects
   ```
3. Clone the repository:
   ```cmd
   git clone https://github.com/username/ai-agent-development-environment.git
   cd ai-agent-development-environment
   ```

## Step 4: Install Dependencies
```cmd
npm install
```

## Step 5: Set Up Database
1. The system uses PostgreSQL. You can either:
   - Use the provided Neon serverless database
   - Install PostgreSQL locally

### Option A: Use Neon Database (Recommended)
1. Create a `.env` file in the project root:
   ```env
   DATABASE_URL=your_neon_database_url
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret
   ```

### Option B: Local PostgreSQL
1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create a database named `ai_agent_db`
3. Update `.env` with your local database URL

## Step 6: Initialize Database
```cmd
npm run db:push
```

## Step 7: Start the Application
```cmd
npm run dev
```

## Step 8: Access the Application
1. Open your browser
2. Go to `http://localhost:5000`
3. Register a new account or use test credentials:
   - Username: testuser
   - Password: testpass123

## Features Available
- AI-powered code generation
- Multi-platform deployment (Heroku, Vercel, AWS, Docker)
- Real-time API discovery
- Secure credential management
- Self-learning capabilities
- Security auditing and compliance
- Advanced testing framework

## Troubleshooting

### Port Issues
If port 5000 is in use:
1. Kill existing processes:
   ```cmd
   netstat -ano | findstr :5000
   taskkill /PID <PID_NUMBER> /F
   ```

### Database Connection Issues
1. Verify your DATABASE_URL is correct
2. Check network connectivity
3. Ensure PostgreSQL service is running

### Permission Issues
1. Run Command Prompt as Administrator
2. Set execution policy:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## Advanced Configuration

### Environment Variables
Create a `.env` file with:
```env
NODE_ENV=production
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
OPENAI_API_KEY=your_openai_key (optional)
ANTHROPIC_API_KEY=your_anthropic_key (optional)
```

### Performance Optimization
For Intel 13th Gen Core i7-13700H:
1. The system automatically utilizes multi-core processing
2. Memory is optimized for 15.72GB RAM
3. Database connections are pooled for efficiency

## Security Notes
- All credentials are encrypted with AES-256
- JWT tokens are used for authentication
- OWASP compliance is built-in
- SQL injection protection is active

## Support
If you encounter issues:
1. Check the console logs for error messages
2. Verify all dependencies are installed
3. Ensure database connectivity
4. Run `npm run test` to verify system health

The system is designed for 100% unrestricted operation with no external dependencies once installed.