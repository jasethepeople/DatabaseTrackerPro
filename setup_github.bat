@echo off
title GitHub Repository Setup - Local Development Environment
echo.
echo ================================================================
echo   GitHub Repository Setup for Local Development Environment
echo   Target: https://github.com/jasonclarkagain/local-dev-environment
echo ================================================================
echo.

echo STEP 1: Create repository on GitHub.com
echo 1. Go to: https://github.com/new
echo 2. Repository name: local-dev-environment
echo 3. Description: Standalone local development environment with AI-powered features for Windows 11
echo 4. Set to Public
echo 5. DO NOT initialize with README
echo 6. Click "Create repository"
echo.
pause

echo STEP 2: Configure Git and push code
echo Configuring Git for jasonclarkagain@gmail.com...
git config --global user.email "jasonclarkagain@gmail.com"
git config --global user.name "Jason Clark"

echo Adding remote repository...
git remote add origin https://github.com/jasonclarkagain/local-dev-environment.git

echo.
echo STEP 3: Push to GitHub
echo You will be prompted for GitHub credentials:
echo Username: jasonclarkagain
echo Password: Use Personal Access Token (recommended) or account password
echo.
echo Creating Personal Access Token:
echo 1. Go to: https://github.com/settings/tokens
echo 2. Click "Generate new token (classic)"
echo 3. Select scopes: repo, user
echo 4. Copy the token and use as password
echo.
pause

echo Pushing code to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ Push failed. Please check:
    echo    - Repository was created on GitHub
    echo    - Credentials are correct
    echo    - Internet connection is working
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Repository uploaded to GitHub
echo.
echo 🔗 Repository URL: https://github.com/jasonclarkagain/local-dev-environment
echo 📁 Local folder: %CD%
echo.
echo Next steps:
echo 1. Visit your repository on GitHub
echo 2. Add topics: local-development, ai-powered, windows-11, standalone
echo 3. Create a release with the deployment package
echo.
pause
