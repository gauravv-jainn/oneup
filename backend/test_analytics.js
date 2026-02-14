const db = require('./config/db');

async function testQueries() {
    try {
        console.log("Testing Connection...");
        await db.query('SELECT NOW()');
        console.log("Connection OK");

        console.log("Testing: production_entries SUM");
        const prod = await db.query('SELECT SUM(quantity_produced) FROM production_entries WHERE produced_at >= CURRENT_DATE');
        console.log("Prod Result:", prod.rows);

        console.log("Testing: procurement_triggers count");
        const triggers = await db.query("SELECT COUNT(*) FROM procurement_triggers WHERE status = 'pending'");
        console.log("Triggers Result:", triggers.rows);

        console.log("Testing: low stock count");
        const lowStock = await db.query('SELECT COUNT(*) FROM components WHERE current_stock < (monthly_required_quantity * 0.2)');
        console.log("Low Stock Result:", triggers.rows);

        console.log("Testing: Production Trend");
        const trend = await db.query(`
            SELECT TO_CHAR(produced_at, 'Dy') as day, SUM(quantity_produced) as count
            FROM production_entries
            WHERE produced_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY TO_CHAR(produced_at, 'Dy'), DATE(produced_at)
            ORDER BY DATE(produced_at) ASC
        `);
        console.log("Trend Result:", trend.rows);

        console.log("Testing: Heatmap Data");
        const heatmap = await db.query(`
            SELECT c.id, c.name, c.part_number, c.current_stock, c.monthly_required_quantity,
                    COALESCE(SUM(ch.quantity_consumed), 0) as total_consumed
             FROM components c
             LEFT JOIN consumption_history ch ON c.id = ch.component_id
             GROUP BY c.id, c.name, c.part_number, c.current_stock, c.monthly_required_quantity
        `);
        console.log("Heatmap Result:", heatmap.rows);

    } catch (err) {
        console.error("❌ SQL ERROR:", err.message);
        console.error("Full Error:", err);
    } finally {
        process.exit();
    }
}

testQueries();
