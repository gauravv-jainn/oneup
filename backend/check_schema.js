const db = require('./config/db');

async function checkSchema() {
    try {
        console.log("Checking procurement_triggers columns:");
        const trig = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'procurement_triggers';
        `);
        console.table(trig.rows);

        console.log("Checking production_entries columns:");
        const prod = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'production_entries';
        `);
        console.table(prod.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
