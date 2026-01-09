const db = require('./database/db');

async function testConnection() {
    try {
        const res = await db.query('SELECT NOW()');
        console.log('🚀 Connection Test Success! Server Time:', res.rows[0].now);
        
        const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('📂 Tables found in DB:', tables.rows.map(t => t.table_name));
        
        process.exit(0);
    } catch (err) {
        console.error('💥 Connection Test Failed:', err.message);
        process.exit(1);
    }
}

testConnection();