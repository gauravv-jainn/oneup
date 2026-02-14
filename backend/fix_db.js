const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixDatabase() {
    try {
        console.log('Starting Database Fixes...');

        // 1. Create audit_logs table
        console.log('1. Checking audit_logs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(50) NOT NULL,
                details TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ audit_logs table checked/created.');

        // 2. Add status column to procurement_triggers
        console.log('2. Checking procurement_triggers status column...');
        try {
            await pool.query(`
                ALTER TABLE procurement_triggers 
                ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
            `);
            // Add check constraint separately as IF NOT EXISTS doesn't apply to constraints easily in one go
            // We can ignore if it fails
            try {
                await pool.query(`
                    ALTER TABLE procurement_triggers 
                    ADD CONSTRAINT procurement_triggers_status_check 
                    CHECK (status IN ('pending', 'ordered', 'received'));
                `);
            } catch (e) {
                // Constraint might already exist
            }
            console.log('✓ procurement_triggers status column checked/added.');
        } catch (err) {
            console.error('Error adding status column:', err.message);
        }

        console.log('✓ Database Fixes Completed.');
    } catch (err) {
        console.error('❌ Error fixing database:', err);
    } finally {
        await pool.end();
    }
}

fixDatabase();
