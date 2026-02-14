const db = require('./config/db');

const createAuditLogsTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                details TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Audit Logs table created successfully.");
    } catch (err) {
        console.error("Error creating audit_logs table:", err);
    } finally {
        // We don't close the pool here because this might be part of a larger script, 
        // but for a standalone run, we should.
        // db.end(); 
        process.exit();
    }
};

createAuditLogsTable();
