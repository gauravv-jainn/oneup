const db = require('../config/db');

exports.logAction = async (userId, action, details, ip) => {
    try {
        await db.query(
            'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
            [userId, action, details, ip]
        );
        console.log(`[AUDIT] User ${userId} performed ${action}`);
    } catch (err) {
        console.error("Audit Log Error:", err);
    }
};

exports.getLogs = async (limit = 100) => {
    const result = await db.query(`
        SELECT a.*, u.username 
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC 
        LIMIT $1
    `, [limit]);
    return result.rows;
};
