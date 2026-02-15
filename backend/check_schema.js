const db = require('./config/db');
require('dotenv').config();

const checkSchema = async () => {
    try {
        console.log("--- CHECKING DB SCHEMA ---");

        // 1. List all tables
        const tablesRes = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("TABLES:", tablesRes.rows.map(r => r.table_name).join(', '));

        // 2. Check consumption_history columns
        console.log(`\nTABLE: consumption_history`);
        const res = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'consumption_history'
        `);
        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
};

checkSchema();
