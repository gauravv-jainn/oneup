const db = require('../config/db');
console.log("--- analyticsController LOADED V2 ---");

// Helper: parse date range from query params
function getDateRange(query) {
    const { range, start, end } = query;
    if (range === 'custom' && start && end) {
        return { startDate: start, endDate: end };
    }
    const days = { '7d': 7, '30d': 30, '90d': 90, '1w': 7, '1m': 30 }[range] || 30;
    return { interval: `${days} days` };
}

function buildDateClause(dateRange, column, paramIndex = 1) {
    if (dateRange.startDate && dateRange.endDate) {
        return { clause: `${column} >= $${paramIndex} AND ${column} <= $${paramIndex + 1}`, params: [dateRange.startDate, dateRange.endDate], nextParam: paramIndex + 2 };
    }
    return { clause: `${column} >= CURRENT_DATE - INTERVAL '${dateRange.interval}'`, params: [], nextParam: paramIndex };
}

// Dashboard Stats (KPIs)
exports.getDashboardStats = async (req, res) => {
    try {
        const [components, pcbs, production, lowStock, criticalStock, triggers] = await Promise.all([
            db.query('SELECT COUNT(*) FROM components'),
            db.query('SELECT COUNT(*) FROM pcb_types'),
            db.query('SELECT COALESCE(SUM(quantity_produced), 0) as sum FROM production_entries WHERE produced_at >= CURRENT_DATE'),
            db.query('SELECT COUNT(*) FROM components WHERE current_stock < (monthly_required_quantity * 0.5) AND current_stock >= (monthly_required_quantity * 0.2)'),
            db.query('SELECT COUNT(*) FROM components WHERE current_stock < (monthly_required_quantity * 0.2)'),
            db.query("SELECT COUNT(*) FROM procurement_triggers WHERE status = 'pending'")
        ]);

        const csCount = parseInt(criticalStock.rows[0].count);
        console.log("Stats Check - Critical:", csCount, "Low:", parseInt(lowStock.rows[0].count));

        res.json({
            totalComponents: parseInt(components.rows[0].count),
            activePCBs: parseInt(pcbs.rows[0].count),
            dailyProduction: parseInt(production.rows[0].sum) || 0,
            lowStock: parseInt(lowStock.rows[0].count),
            criticalStock: csCount,
            pendingOrders: parseInt(triggers.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Production Trend (supports ?range=7d|30d|90d|custom&start=&end=)
exports.getProductionTrend = async (req, res) => {
    try {
        const dateRange = getDateRange(req.query);
        const { clause, params } = buildDateClause(dateRange, 'produced_at');

        const result = await db.query(`
            SELECT DATE(produced_at) as date, SUM(quantity_produced) as count
            FROM production_entries
            WHERE ${clause}
            GROUP BY DATE(produced_at)
            ORDER BY DATE(produced_at) ASC
        `, params);

        const labels = result.rows.map(r => new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const values = result.rows.map(r => parseInt(r.count));

        res.json({ labels, values });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Consumption Summary (supports ?range=)
exports.getConsumptionSummary = async (req, res) => {
    try {
        const dateRange = getDateRange(req.query);
        const { clause, params } = buildDateClause(dateRange, 'ch.consumed_at');

        const result = await db.query(
            `SELECT c.name, c.part_number, SUM(ch.quantity_consumed) as total_consumed 
             FROM consumption_history ch
             JOIN components c ON ch.component_id = c.id
             WHERE ${clause}
             GROUP BY c.id, c.name, c.part_number
             ORDER BY total_consumed DESC`, params
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Top 10 Consumed Components (supports ?range=)
exports.getTopConsumed = async (req, res) => {
    try {
        const dateRange = getDateRange(req.query);
        const { clause, params } = buildDateClause(dateRange, 'ch.consumed_at');

        const result = await db.query(
            `SELECT c.name, SUM(ch.quantity_consumed) as total_consumed
             FROM consumption_history ch
             JOIN components c ON ch.component_id = c.id
             WHERE ${clause}
             GROUP BY c.id, c.name
             ORDER BY total_consumed DESC
             LIMIT 10`, params
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Low Stock + Critical Stock Components
exports.getLowStock = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT name, part_number, current_stock, monthly_required_quantity,
                    CASE 
                        WHEN current_stock < (monthly_required_quantity * 0.2) THEN 'critical'
                        WHEN current_stock < (monthly_required_quantity * 0.5) THEN 'low'
                        ELSE 'safe'
                    END as severity,
                    ROUND((current_stock::decimal / GREATEST(monthly_required_quantity, 1)) * 100, 1) as stock_percent
             FROM components 
             WHERE current_stock < (monthly_required_quantity * 0.5)
             ORDER BY (current_stock::decimal / GREATEST(monthly_required_quantity, 1)) ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Consumption Trend (supports ?range=)
exports.getConsumptionTrend = async (req, res) => {
    try {
        const dateRange = getDateRange(req.query);
        const { clause, params } = buildDateClause(dateRange, 'consumed_at');

        const result = await db.query(
            `SELECT DATE(consumed_at) as date, SUM(quantity_consumed) as total_consumed
             FROM consumption_history
             WHERE ${clause}
             GROUP BY DATE(consumed_at)
             ORDER BY date ASC`, params
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Heatmap Data (supports ?range= for consumption period)
exports.getHeatmapData = async (req, res) => {
    try {
        const dateRange = getDateRange(req.query);
        const { clause, params } = buildDateClause(dateRange, 'ch.consumed_at');

        const result = await db.query(
            `SELECT c.id, c.name, c.part_number, c.current_stock, c.monthly_required_quantity,
                    COALESCE(SUM(ch.quantity_consumed), 0) as total_consumed
             FROM components c
             LEFT JOIN consumption_history ch ON c.id = ch.component_id AND ${clause}
             GROUP BY c.id, c.name, c.part_number, c.current_stock, c.monthly_required_quantity`, params
        );

        const data = result.rows.map(row => {
            const stock = parseInt(row.current_stock);
            const monthly = parseInt(row.monthly_required_quantity);
            let percentage = monthly > 0 ? (stock / monthly) * 100 : 0;
            if (percentage > 100) percentage = 100;


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
