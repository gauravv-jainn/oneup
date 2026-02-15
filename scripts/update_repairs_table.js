const db = require('../backend/config/db');

const updateTable = async () => {
    try {
        await db.query(`
            ALTER TABLE repairs_data 
            ADD COLUMN IF NOT EXISTS part_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
        `);
        console.log("Table 'repairs_data' updated successfully.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateTable();
