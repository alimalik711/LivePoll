const fs = require('fs');
const path = require('path');
const pool = require('./db');

const runMigration = async () => {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();
    
    // Execute the query
    await pool.query(sql);
    
    console.log("✅ Database tables initialized successfully!");
    process.exit(0); // Exit the script
  } catch (err) {
    console.error("❌ Error running migration:", err);
    process.exit(1);
  }
};

runMigration();