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

// Heatmap Data
exports.getHeatmapData = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.id, c.name, c.part_number, c.current_stock, c.monthly_required_quantity,
                    COALESCE(SUM(ch.quantity_consumed), 0) as total_consumed
             FROM components c
             LEFT JOIN consumption_history ch ON c.id = ch.component_id
             GROUP BY c.id, c.name, c.part_number, c.current_stock, c.monthly_required_quantity`
        );

        const data = result.rows.map(row => {
            const stock = parseInt(row.current_stock);
            const monthly = parseInt(row.monthly_required_quantity);
            const percentage = monthly > 0 ? (stock / monthly) * 100 : 0;

            let status = 'critical';
            if (percentage >= 50) status = 'safe';
            else if (percentage >= 20) status = 'warning';

            return {
                ...row,
                total_consumed: parseInt(row.total_consumed),
                stock_percentage: parseFloat(percentage.toFixed(1)),
                status
            };
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
