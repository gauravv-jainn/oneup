const db = require('../config/db');

// Consumption Summary
exports.getConsumptionSummary = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.name, c.part_number, SUM(ch.quantity_consumed) as total_consumed 
             FROM consumption_history ch
             JOIN components c ON ch.component_id = c.id
             GROUP BY c.id, c.name, c.part_number
             ORDER BY total_consumed DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Top 10 Consumed Components
exports.getTopConsumed = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.name, SUM(ch.quantity_consumed) as total_consumed
             FROM consumption_history ch
             JOIN components c ON ch.component_id = c.id
             GROUP BY c.id, c.name
             ORDER BY total_consumed DESC
             LIMIT 10`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Low Stock Components
exports.getLowStock = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT name, part_number, current_stock, monthly_required_quantity 
             FROM components 
             WHERE current_stock < (monthly_required_quantity * 0.2)`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Consumption Trend (Last 30 days) - simplified
exports.getConsumptionTrend = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT DATE(consumed_at) as date, SUM(quantity_consumed) as total_consumed
             FROM consumption_history
             WHERE consumed_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY DATE(consumed_at)
             ORDER BY date ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
