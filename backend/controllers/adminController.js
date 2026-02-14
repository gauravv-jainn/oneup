const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- User Management ---

exports.getUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createUser = async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Fields required' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, role || 'viewer']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Audit Logs ---

const auditService = require('../services/auditService');

// ... (User methods remain same)

// --- Audit Logs ---

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await auditService.getLogs();
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

