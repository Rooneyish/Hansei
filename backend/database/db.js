const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool using environment variables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Event listener for successful connection
pool.on('connect', () => {
    console.log('Hansei Database: Connected to PostgreSQL successfully.');
});

// Event listener for connection errors
pool.on('error', (err) => {
    console.error('Hansei Database: Unexpected error on idle client', err);
    process.exit(-1);
});

// Export a helper function to run queries
module.exports = {
    /**
     * Executes a query against the database
     * @param {string} text - SQL Query
     * @param {Array} params - Values to replace $1, $2, etc.
     */
    query: (text, params) => pool.query(text, params),
};