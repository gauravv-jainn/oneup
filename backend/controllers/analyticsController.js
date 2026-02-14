const db = require('../config/db');

// Dashboard Stats (KPIs)
exports.getDashboardStats = async (req, res) => {
    try {
        const [components, pcbs, production, lowStock, triggers] = await Promise.all([
            db.query('SELECT COUNT(*) FROM components'),
            db.query('SELECT COUNT(*) FROM pcb_types'),
            db.query('SELECT SUM(quantity_produced) FROM production_entries WHERE produced_at >= CURRENT_DATE'),
            db.query('SELECT COUNT(*) FROM components WHERE current_stock < (monthly_required_quantity * 0.2)'),
            db.query("SELECT COUNT(*) FROM procurement_triggers WHERE status = 'pending'")
        ]);

        res.json({
            totalComponents: parseInt(components.rows[0].count),
            activePCBs: parseInt(pcbs.rows[0].count),
            dailyProduction: parseInt(production.rows[0].sum) || 0,
            lowStock: parseInt(lowStock.rows[0].count),
            pendingOrders: parseInt(triggers.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Production Trend (Last 7 Days)
exports.getProductionTrend = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT TO_CHAR(produced_at, 'Dy') as day, SUM(quantity_produced) as count
            FROM production_entries
            WHERE produced_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY TO_CHAR(produced_at, 'Dy'), DATE(produced_at)
            ORDER BY DATE(produced_at) ASC
        `);

        // Ensure all days are represented or just send available data
        // For simplicity, sending available data which frontend will map

        const labels = result.rows.map(r => r.day);
        const values = result.rows.map(r => parseInt(r.count));

        res.json({ labels, values });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};


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
