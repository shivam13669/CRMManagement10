const fs = require('fs');
const path = require('path');

// Delete the database file to start fresh
const dbPath = path.join(process.cwd(), 'healthcare.db');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Database file deleted - fresh start!');
} else {
  console.log('ℹ️ No database file found');
}

// Also delete JSON backup if exists
const jsonPath = path.join(process.cwd(), 'local-database.json');
if (fs.existsSync(jsonPath)) {
  fs.unlinkSync(jsonPath);
  console.log('✅ JSON database backup deleted');
}

console.log('🚀 Ready for fresh signup - restart the server now!');
