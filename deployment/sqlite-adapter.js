/**
 * SQLite Database Adapter for Standalone Windows Deployment
 * Optimized for Windows 11 with Intel 13th Gen Core i7-13700H
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class SqliteAdapter {
  constructor(options = {}) {
    this.dbPath = options.dbPath || path.join(process.cwd(), 'data', 'database.db');
    this.options = {
      verbose: console.log,
      memory: false,
      readonly: false,
      fileMustExist: false,
      timeout: 5000,
      ...options
    };
    
    this.ensureDataDirectory();
    this.initializeDatabase();
  }

  ensureDataDirectory() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  initializeDatabase() {
    this.db = new Database(this.dbPath, this.options);
    
    // Enable WAL mode for better concurrent access
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 10000');
    this.db.pragma('temp_store = MEMORY');
    
    // Intel 13th Gen optimizations
    this.db.pragma('mmap_size = 268435456'); // 256MB
    this.db.pragma('threads = 8'); // Utilize available cores
    
    this.createTables();
  }

  createTables() {
    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER NOT NULL,
        settings TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Files table
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        content TEXT,
        size INTEGER DEFAULT 0,
        project_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      );

      -- Code snippets table
      CREATE TABLE IF NOT EXISTS code_snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        language TEXT,
        category TEXT,
        difficulty TEXT,
        tags TEXT, -- JSON array
        usage TEXT,
        rating REAL DEFAULT 0,
        views INTEGER DEFAULT 0,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- API credentials table
      CREATE TABLE IF NOT EXISTS api_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        api_key TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Environment snapshots table
      CREATE TABLE IF NOT EXISTS environment_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        snapshot_data TEXT NOT NULL, -- JSON
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Background jobs table
      CREATE TABLE IF NOT EXISTS background_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        job_data TEXT, -- JSON
        result TEXT, -- JSON
        error_message TEXT,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
      CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
      CREATE INDEX IF NOT EXISTS idx_code_snippets_user_id ON code_snippets(user_id);
      CREATE INDEX IF NOT EXISTS idx_code_snippets_language ON code_snippets(language);
      CREATE INDEX IF NOT EXISTS idx_code_snippets_category ON code_snippets(category);
      CREATE INDEX IF NOT EXISTS idx_api_credentials_user_id ON api_credentials(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_credentials_platform ON api_credentials(platform);
      CREATE INDEX IF NOT EXISTS idx_environment_snapshots_user_id ON environment_snapshots(user_id);
      CREATE INDEX IF NOT EXISTS idx_background_jobs_user_id ON background_jobs(user_id);
      CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
    `;

    this.db.exec(schema);
    
    // Create default admin user if none exists
    this.createDefaultUser();
  }

  createDefaultUser() {
    const existingUser = this.db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    
    if (!existingUser) {
      const bcrypt = require('bcrypt');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      this.db.prepare(`
        INSERT INTO users (username, email, password_hash, first_name, last_name)
        VALUES (?, ?, ?, ?, ?)
      `).run('admin', 'admin@localhost', hashedPassword, 'Admin', 'User');
      
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }
  }

  // Query methods
  prepare(sql) {
    return this.db.prepare(sql);
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  transaction(fn) {
    return this.db.transaction(fn);
  }

  // Backup and restore
  backup(backupPath) {
    const backup = this.db.backup(backupPath);
    return backup;
  }

  restore(backupPath) {
    this.db.close();
    fs.copyFileSync(backupPath, this.dbPath);
    this.initializeDatabase();
  }

  // Close database
  close() {
    if (this.db) {
      this.db.close();
    }
  }

  // Health check
  healthCheck() {
    try {
      const result = this.db.prepare('SELECT 1 as healthy').get();
      return result && result.healthy === 1;
    } catch (error) {
      return false;
    }
  }

  // Get database info
  getInfo() {
    const info = {
      path: this.dbPath,
      size: fs.statSync(this.dbPath).size,
      tables: [],
      userVersion: this.db.pragma('user_version', { simple: true }),
      journalMode: this.db.pragma('journal_mode', { simple: true }),
      cacheSize: this.db.pragma('cache_size', { simple: true })
    };

    const tables = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();

    info.tables = tables.map(t => t.name);
    
    return info;
  }
}

module.exports = SqliteAdapter;