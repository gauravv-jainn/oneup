require('dotenv').config();
const db = require('./config/db');

async function fixTables() {
    try {
        console.log('Fixing schema...');

        // 1. Create order_items table
        await db.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES future_orders(id) ON DELETE CASCADE,
                pcb_type_id INTEGER REFERENCES pcb_types(id),
                quantity_required INTEGER NOT NULL
            );
        `);
        console.log('Created order_items table.');

        // 2. Add estimated_arrival_days to components
        try {
            await db.query(`ALTER TABLE components ADD COLUMN estimated_arrival_days INTEGER DEFAULT NULL`);
            console.log('Added estimated_arrival_days column.');
        } catch (e) {
            // Postgres error code 42701 means column already exists
            if (e.code === '42701') {
                console.log('estimated_arrival_days column already exists.');
            } else {
                console.error('Error adding column:', e);
            }
        }

        console.log('Schema fixed.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing schema:', error);
        process.exit(1);
    }
}

fixTables();
