const db = require('./config/db');
require('dotenv').config();

const checkOrders = async () => {
    try {
        console.log("--- CHECKING ORDERS ---");

        const orders = await db.query('SELECT * FROM future_orders ORDER BY created_at DESC');
        console.log(`Found ${orders.rows.length} orders.`);
        orders.rows.forEach(o => {
            console.log(`Order: ID=${o.id}, Name=${o.order_name}, PCB=${o.pcb_type_id}, Items=${o.items ? 'YES' : 'NO'}`);
        });

        const items = await db.query('SELECT * FROM order_items');
        console.log(`Found ${items.rows.length} items.`);
        items.rows.forEach(i => {
            console.log(`Item: OrderID=${i.order_id}, PCB=${i.pcb_type_id}, Qty=${i.quantity_required}`);
        });

        // Also check if estimate-date query works manually
        console.log("--- TEST query ---");
        const pcb = await db.query('SELECT * FROM pcb_types LIMIT 1');
        if (pcb.rows.length > 0) {
            const pid = pcb.rows[0].id;
            console.log(`Testing estimate for PCB ${pid}`);
            // Logic similar to estimateDate
            const date = new Date().toISOString().split('T')[0];
            console.log(`Today: ${date}`);
        }

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
};

checkOrders();
