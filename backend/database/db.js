const {Pool} = require('pg');

module.exports = new Pool({
    host : 'localhost',
    user : 'rooneyish',
    database  : 'users',
    password : '@m0r050<>',
    port : 5432
});

async function testConnection() {
    const pool = module.exports;
    try {
        const client = await pool.connect();
        console.log('Database connection successful');
        client.release();
    } catch (err) {
        console.error('Database connection error', err.stack);
    }
}

testConnection();