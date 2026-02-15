const db = require('../backend/config/db');

const fixSchema = async () => {
    try {
        console.log("Checking repairs_data table...");

        // 1. Create Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS repairs_data (
                id SERIAL PRIMARY KEY,
                pcb_name VARCHAR(100),
                dc_no VARCHAR(100),
                repair_date DATE,
                status VARCHAR(50),
                defect VARCHAR(255),
                analysis TEXT,
                technician VARCHAR(100),
                component_consumption JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table repairs_data ensured.");

        // 2. Add Columns if not exist
        await db.query(`ALTER TABLE repairs_data ADD COLUMN IF NOT EXISTS part_number VARCHAR(100);`);
        await db.query(`ALTER TABLE repairs_data ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;`);

        console.log("Columns part_number and quantity ensured.");

        process.exit(0);
    } catch (err) {
        console.error("Schema Fix Failed:", err);
        process.exit(1);
    }
};

fixSchema();
