import { RequestHandler } from "express";
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

export const handleDatabaseReset: RequestHandler = async (req, res) => {
  try {
    const dbPath = join(process.cwd(), 'healthcare.db');
    
    if (existsSync(dbPath)) {
      unlinkSync(dbPath);
      console.log('✅ Database file deleted');
    }
    
    // Also delete JSON backup if exists
    const jsonPath = join(process.cwd(), 'local-database.json');
    if (existsSync(jsonPath)) {
      unlinkSync(jsonPath);
      console.log('✅ JSON backup deleted');
    }
    
    res.json({ 
      message: "Database reset successful! Restart server to create fresh database." 
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Error resetting database' });
  }
};
