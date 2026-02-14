const db = require('../config/db');

// Helper to get stock projection for a specific component and date
const getStockProjection = async (componentId, targetDate) => {
    // 1. Current Stock
    const currentStockRes = await db.query('SELECT current_stock FROM components WHERE id = $1', [componentId]);
    const currentStock = currentStockRes.rows[0]?.current_stock || 0;

    // 2. Incoming Stock (Procurement Orders expected by targetDate)
    const incomingRes = await db.query(
        `SELECT SUM(quantity_ordered) as total_incoming 
         FROM procurement_triggers 
         WHERE component_id = $1 
         AND status = 'ordered' 
         AND expected_delivery_date <= $2`,
        [componentId, targetDate]
    );
    const incomingStock = parseInt(incomingRes.rows[0]?.total_incoming || 0);

    // 3. Reserved Stock (Future Orders scheduled by targetDate)
    const reservedRes = await db.query(
        `SELECT SUM(pc.quantity_per_pcb * fo.quantity_required) as total_reserved
         FROM future_orders fo
         JOIN pcb_components pc ON fo.pcb_type_id = pc.pcb_type_id
         WHERE pc.component_id = $1 
         AND fo.status IN ('confirmed', 'at_risk')
         AND fo.scheduled_production_date <= $2`,
        [componentId, targetDate]
    );
    const reservedStock = parseInt(reservedRes.rows[0]?.total_reserved || 0);

    return {
        current: currentStock,
        incoming: incomingStock,
        reserved: reservedStock,
        projected: currentStock + incomingStock - reservedStock
    };
};

// Check Availability
exports.checkAvailability = async (req, res) => {
    const { pcb_type_id, quantity, scheduled_production_date } = req.body;

    try {
        const bomRes = await db.query(
            `SELECT c.id, c.name, c.part_number, pc.quantity_per_pcb
             FROM pcb_components pc
             JOIN components c ON pc.component_id = c.id
             WHERE pc.pcb_type_id = $1`,
            [pcb_type_id]
        );

        const components = bomRes.rows;
        const analysis = [];
        let canFulfill = true;

        for (const comp of components) {
            const required = comp.quantity_per_pcb * quantity;
            const projection = await getStockProjection(comp.id, scheduled_production_date);

            const isShortage = projection.projected < required;
            if (isShortage) canFulfill = false;

            analysis.push({
                component_id: comp.id,
                name: comp.name,
                part_number: comp.part_number,
                required_quantity: required,
                current_stock: projection.current,
                incoming_stock: projection.incoming,
                reserved_stock: projection.reserved,
                projected_available: projection.projected,
                status: isShortage ? 'shortage' : 'sufficient',
                shortfall: isShortage ? required - projection.projected : 0
            });
        }

        res.json({ can_fulfill: canFulfill, components: analysis });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create Future Order
exports.createOrder = async (req, res) => {
    const { order_name, pcb_type_id, quantity_required, scheduled_production_date, delivery_date, status } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO future_orders 
             (order_name, pcb_type_id, quantity_required, scheduled_production_date, delivery_date, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [order_name, pcb_type_id, quantity_required, scheduled_production_date, delivery_date, status || 'pending']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// List Future Orders
exports.getOrders = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT fo.*, pt.name as pcb_name 
             FROM future_orders fo
             JOIN pcb_types pt ON fo.pcb_type_id = pt.id
             ORDER BY fo.scheduled_production_date ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Cancel Order
exports.cancelOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `UPDATE future_orders SET status = 'cancelled' WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Execute Order (Convert to Production Entry)
exports.executeOrder = async (req, res) => {
    const { id } = req.params;
    console.log(`[executeOrder] Starting execution for Order ID: ${id}`);
    let client;
    try {
        client = await db.pool.connect();
    } catch (connErr) {
        console.error("DB Connection Failed:", connErr);
        return res.status(503).json({ error: "Database connection failed", details: connErr.message });
    }

    try {
        await client.query('BEGIN');

        // 1. Get Order Details
        const orderRes = await client.query('SELECT * FROM future_orders WHERE id = $1', [id]);
        const order = orderRes.rows[0];

        if (!order) throw new Error('Order not found');
        if (order.status === 'completed') throw new Error('Order already completed');

        // 2. Perform Stock Check & Deduction
        const bomRes = await client.query(
            `SELECT component_id, quantity_per_pcb FROM pcb_components WHERE pcb_type_id = $1`,
            [order.pcb_type_id]
        );

        for (const item of bomRes.rows) {
            const totalRequired = item.quantity_per_pcb * order.quantity_required;

            // Check stock
            const compRes = await client.query('SELECT current_stock FROM components WHERE id = $1', [item.component_id]);
            const currentStock = compRes.rows[0].current_stock;

            if (currentStock < totalRequired) {
                console.warn(`[Order Execution] Stock shortage for component ${item.component_id}. Required: ${totalRequired}, Current: ${currentStock}. Proceeding with negative stock.`);
                // We allow negative stock now because constraint is dropped.
            }

            // Deduct
            await client.query(
                'UPDATE components SET current_stock = current_stock - $1 WHERE id = $2',
                [totalRequired, item.component_id]
            );
        }

        // 3. Create Production Entry
        const prodRes = await client.query(
            'INSERT INTO production_entries (pcb_type_id, quantity_produced) VALUES ($1, $2) RETURNING id',
            [order.pcb_type_id, order.quantity_required]
        );
        const entryId = prodRes.rows[0].id;

        // 4. Record Consumption History
        for (const item of bomRes.rows) {
            await client.query(
                `INSERT INTO consumption_history (production_entry_id, component_id, quantity_consumed)
                 VALUES ($1, $2, $3)`,
                [entryId, item.component_id, item.quantity_per_pcb * order.quantity_required]
            );
        }

        // 5. Update Future Order Status
        await client.query("UPDATE future_orders SET status = 'completed' WHERE id = $1", [id]);

        await client.query('COMMIT');
        res.json({ message: 'Order executed successfully', production_entry_id: entryId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("EXECUTION ERROR:", err);
        // Return full error details if needed, but for now standard error message
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};
