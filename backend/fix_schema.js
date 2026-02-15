require('dotenv').config();
const db = require('./config/db');

async function fixSchema() {
    try {
        console.log('Altering future_orders table...');

        await db.query('ALTER TABLE future_orders ALTER COLUMN pcb_type_id DROP NOT NULL');
        await db.query('ALTER TABLE future_orders ALTER COLUMN quantity_required DROP NOT NULL');

        console.log('Schema updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

fixSchema();
