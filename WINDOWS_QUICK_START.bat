@echo off
echo ====================================
echo AI Agent Development Environment
echo Windows 11 Quick Start Installer
echo ====================================
echo.

echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Setting up environment...
if not exist .env (
    echo Creating .env file...
    echo NODE_ENV=development > .env
    echo DATABASE_URL=postgresql://username:password@localhost:5432/ai_agent_db >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random >> .env
    echo SESSION_SECRET=your-session-secret-here-also-make-it-long >> .env
    echo OPENAI_API_KEY=your-openai-api-key-optional >> .env
    echo ANTHROPIC_API_KEY=your-anthropic-api-key-optional >> .env
    echo.
    echo Please edit .env file with your actual database URL and secrets
    echo Press any key to continue after editing .env...
    pause > nul
)

echo.
echo Step 3: Initializing database...
call npm run db:push

echo.
echo Step 4: Starting application...
echo.
echo ====================================
echo Application will start at:
echo http://localhost:5000
echo.
echo Default credentials:
echo Username: admin
echo Password: password
echo.
echo Test account:
echo Username: testuser
echo Password: testpass123
echo ====================================
echo.

call npm run dev