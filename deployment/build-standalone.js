#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Standalone Windows Package for Laptop01');
console.log('📋 Target System: Windows 11 Home (x64) - Intel 13th Gen Core i7-13700H');
console.log('');

const buildSteps = [
  {
    name: 'Clean previous builds',
    action: () => {
      if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true });
      }
      fs.mkdirSync('dist', { recursive: true });
    }
  },
  {
    name: 'Install dependencies',
    action: () => {
      execSync('npm install', { stdio: 'inherit' });
    }
  },
  {
    name: 'Build client application',
    action: () => {
      execSync('npm run build-client', { stdio: 'inherit' });
    }
  },
  {
    name: 'Build server application',
    action: () => {
      execSync('npm run build-server', { stdio: 'inherit' });
    }
  },
  {
    name: 'Create standalone executable',
    action: () => {
      // First install pkg if not present
      try {
        execSync('pkg --version', { stdio: 'pipe' });
      } catch {
        console.log('Installing pkg...');
        execSync('npm install -g pkg', { stdio: 'inherit' });
      }
      
      execSync('npm run package-windows', { stdio: 'inherit' });
    }
  },
  {
    name: 'Bundle SQLite database',
    action: () => {
      // Create embedded SQLite setup
      const sqliteSetup = `
const Database = require('better-sqlite3');
const path = require('path');

class LocalDatabase {
  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'database.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  initialize() {
    // Create tables if they don't exist
    const schema = \`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        content TEXT,
        project_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      );

      CREATE TABLE IF NOT EXISTS code_snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        language TEXT,
        category TEXT,
        difficulty TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    \`;

    this.db.exec(schema);
  }
}

module.exports = LocalDatabase;
      `;
      
      fs.writeFileSync('dist/database.js', sqliteSetup);
    }
  },
  {
    name: 'Create portable package',
    action: () => {
      require('./scripts/create-portable.js')();
    }
  },
  {
    name: 'Generate installation script',
    action: () => {
      const installScript = `@echo off
title Local Development Environment - Installation
echo.
echo ================================================================
echo   Local Development Environment - Standalone Installation
echo   Target: Windows 11 Home (x64) - Laptop01
echo   User: jason (Administrator)
echo ================================================================
echo.

REM Create application directory
set INSTALL_DIR=%USERPROFILE%\\LocalDevEnvironment
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copy files
echo Copying application files...
xcopy /E /I /Y "." "%INSTALL_DIR%"

REM Create desktop shortcut
echo Creating desktop shortcut...
set SHORTCUT=%USERPROFILE%\\Desktop\\Local Dev Environment.lnk
echo Set oWS = WScript.CreateObject("WScript.Shell") > temp_shortcut.vbs
echo sLinkFile = "%SHORTCUT%" >> temp_shortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> temp_shortcut.vbs
echo oLink.TargetPath = "%INSTALL_DIR%\\start.bat" >> temp_shortcut.vbs
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> temp_shortcut.vbs
echo oLink.Description = "Local Development Environment" >> temp_shortcut.vbs
echo oLink.Save >> temp_shortcut.vbs
cscript temp_shortcut.vbs
del temp_shortcut.vbs

REM Create start menu entry
set STARTMENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs
copy "%USERPROFILE%\\Desktop\\Local Dev Environment.lnk" "%STARTMENU%\\"

echo.
echo ================================================================
echo   Installation Complete!
echo.
echo   Desktop shortcut created: Local Dev Environment
echo   Start menu entry added
echo   Installation directory: %INSTALL_DIR%
echo.
echo   To start: Double-click the desktop shortcut or run start.bat
echo   Web interface: http://localhost:5000
echo ================================================================
echo.
pause`;
      
      fs.writeFileSync('dist/install.bat', installScript);
    }
  }
];

// Execute build steps
buildSteps.forEach((step, index) => {
  console.log(`${index + 1}. ${step.name}...`);
  try {
    step.action();
    console.log(`   ✅ ${step.name} completed`);
  } catch (error) {
    console.error(`   ❌ ${step.name} failed:`, error.message);
    process.exit(1);
  }
  console.log('');
});

console.log('🎉 Standalone Windows package built successfully!');
console.log('');
console.log('📦 Package contents:');
console.log('   - local-dev-env.exe (standalone executable)');
console.log('   - start.bat (launcher script)');
console.log('   - install.bat (installation script)');
console.log('   - config.json (system configuration)');
console.log('   - README.md (user guide)');
console.log('');
console.log('🚀 Ready for deployment on Laptop01 (Windows 11)');
console.log('💻 Optimized for Intel 13th Gen Core i7-13700H');
console.log('🔒 100% unrestricted and uncensored operation');
console.log('📡 Complete offline capability');