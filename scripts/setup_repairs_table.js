const db = require('../backend/config/db');

const createTable = async () => {
    try {
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
                component_consumption JSONB, -- Stores array of parts consumed
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table 'repairs_data' created successfully.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createTable();
