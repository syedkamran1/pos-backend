const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
    user: process.env.DB_USER,       // Replace with your DB username
    host: process.env.DB_HOST,          // Your DB host
    database: process.env.DB_NAME,  // Your database name
    password: process.env.DB_PASSWORD, // Replace with your DB password
    port: process.env.DB_PORT,                 // Default PostgreSQL port
});

module.exports = pool;

