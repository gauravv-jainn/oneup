const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateSchema() {
    try {
        console.log('Starting Future Orders schema update...');

        // 1. Create future_orders table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS future_orders (
                id SERIAL PRIMARY KEY,
                order_name VARCHAR(255) NOT NULL,
                pcb_type_id INTEGER REFERENCES pcb_types(id) ON DELETE CASCADE,
                quantity_required INTEGER NOT NULL,
                scheduled_production_date DATE NOT NULL,
                delivery_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, at_risk, in_production, completed, cancelled
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Created future_orders table');

        // 2. Add columns to procurement_triggers
        // Check if columns exist first to avoid errors (or use catching)
        try {
            await pool.query(`
                ALTER TABLE procurement_triggers 
                ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
                ADD COLUMN IF NOT EXISTS quantity_ordered INTEGER,
                ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
            `);
            console.log('✓ Updated procurement_triggers table');
        } catch (err) {
            console.log('⚠ Columns might already exist in procurement_triggers:', err.message);
        }

        console.log('Schema update completed successfully!');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await pool.end();
    }
}

updateSchema();
