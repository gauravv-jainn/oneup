require('dotenv').config();
const db = require('./config/db');

async function migrate() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES future_orders(id) ON DELETE CASCADE,
                pcb_type_id INTEGER REFERENCES pcb_types(id) ON DELETE CASCADE,
                quantity_required INTEGER NOT NULL CHECK (quantity_required > 0)
            );
        `);
        await db.query(`ALTER TABLE components ADD COLUMN IF NOT EXISTS estimated_arrival_days INTEGER DEFAULT NULL`);
        console.log('Migration done');
    } catch (e) {
        console.error('Migration error:', e.message);
    }
    process.exit(0);
}
migrate();
