require('dotenv').config();
const db = require('./config/db');

async function diagnose() {
    try {
        console.log('--- DIAGNOSIS START ---');

        // 1. Check Table Existence
        const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        const tableNames = tables.rows.map(r => r.table_name);
        console.log('Tables in DB:', tableNames);
        if (!tableNames.includes('order_items')) console.log('CRITICAL: order_items table MISSING!');
        if (!tableNames.includes('components')) console.log('CRITICAL: components table MISSING!');

        // 2. Check Columns in components
        const cols = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='components'");
        const colNames = cols.rows.map(r => r.column_name);
        console.log('Components Columns:', colNames);
        if (!colNames.includes('estimated_arrival_days')) console.log('CRITICAL: estimated_arrival_days column MISSING in components!');

        // 3. Check Future Orders Data
        const orders = await db.query('SELECT id, order_name, status, created_at FROM future_orders ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Orders:', orders.rows);

        // 4. Check Order Items
        const items = await db.query('SELECT * FROM order_items LIMIT 5');
        console.log('Sample Order Items:', items.rows);

        // 5. Test Estimate Query logic
        const pcb = await db.query('SELECT id FROM pcb_types LIMIT 1');
        if (pcb.rows.length > 0) {
            const pcbId = pcb.rows[0].id;
            console.log(`Testing BOM query for PCB ID ${pcbId}...`);
            try {
                const bomRes = await db.query(
                    `SELECT c.id, c.name, c.current_stock, c.estimated_arrival_days, pc.quantity_per_pcb
                     FROM pcb_components pc
                     JOIN components c ON pc.component_id = c.id
                     WHERE pc.pcb_type_id = $1`,
                    [pcbId]
                );
                console.log(`BOM query successful. Found ${bomRes.rowCount} components.`);
            } catch (queryErr) {
                console.error('BOM Query FAILED:', queryErr.message);
            }
        } else {
            console.log('No PCB types found to test query.');
        }

        // 6. Test Manual Insert
        console.log('Testing Manual DB Insert...');
        try {
            const pcb = await db.query('SELECT id FROM pcb_types LIMIT 1');
            if (pcb.rows.length > 0) {
                const pcbId = pcb.rows[0].id;
                const insRes = await db.query(
                    "INSERT INTO future_orders (order_name, scheduled_production_date, delivery_date, status) VALUES ($1, $2, $3, $4) RETURNING id",
                    ['Manual Test Order', '2026-01-01', '2026-01-01', 'pending']
                );
                const orderId = insRes.rows[0].id;
                console.log(`Created Manual Order ID: ${orderId}`);

                await db.query(
                    "INSERT INTO order_items (order_id, pcb_type_id, quantity_required) VALUES ($1, $2, $3)",
                    [orderId, pcbId, 999]
                );
                console.log('Manual Item Insert SUCCESS.');
            }
        } catch (dbErr) {
            console.error('Manual Insert FAILED:', dbErr);
        }

        console.log('--- DIAGNOSIS END ---');
        process.exit(0);
    } catch (err) {
        console.error('Diagnosis Script Error:', err);
        process.exit(1);
    }
}

diagnose();
