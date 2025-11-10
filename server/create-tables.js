const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function createTables() {
  try {
    console.log('🔧 Manually creating database tables...');
    
    // Initialize sql.js
    const SQL = await initSqlJs();
    
    const dbPath = path.join(process.cwd(), 'healthcare.db');
    let db;
    
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath);
      db = new SQL.Database(data);
      console.log('✅ Existing database loaded');
    } else {
      db = new SQL.Database();
      console.log('✅ New database created');
    }
    
    // Create pending_registrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        approved_by INTEGER,
        specialization TEXT,
        license_number TEXT,
        experience_years INTEGER,
        consultation_fee REAL,
        available_days TEXT,
        available_time_start TEXT,
        available_time_end TEXT,
        department TEXT,
        employee_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ pending_registrations table created');
    
    // Check if table exists
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_registrations'");
    if (result.length > 0) {
      console.log('✅ Table verified: pending_registrations exists');
    } else {
      console.log('❌ Table verification failed');
    }
    
    // Save database
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    console.log('💾 Database saved with new table');
    
    // Show table structure
    const tableInfo = db.exec("PRAGMA table_info(pending_registrations)");
    if (tableInfo.length > 0) {
      console.log('📋 Table structure:', tableInfo[0].values);
    }
    
    db.close();
    console.log('🎉 Table creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

createTables();
