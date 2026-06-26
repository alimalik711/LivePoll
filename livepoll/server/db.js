const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// We use this to verify the connection is alive
pool.on('connect', () => {
  console.log('Successfully connected to the database');
});

module.exports = pool;