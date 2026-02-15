const db = require('../config/db');
console.log("--- futureOrderController LOADED V3 ---");

// Helper to get stock projection for a specific component and date
const getStockProjection = async (componentId, targetDate) => {
    const currentStockRes = await db.query('SELECT current_stock FROM components WHERE id = $1', [componentId]);
    const currentStock = currentStockRes.rows[0]?.current_stock || 0;

    const incomingRes = await db.query(
        `SELECT COALESCE(SUM(quantity_ordered), 0) as total_incoming 
         FROM procurement_triggers 
         WHERE component_id = $1 AND status = 'ordered' AND expected_delivery_date <= $2`,
        [componentId, targetDate]
    );
    const incomingStock = parseInt(incomingRes.rows[0]?.total_incoming || 0);

    const reservedRes = await db.query(
        `SELECT COALESCE(SUM(pc.quantity_per_pcb * oi.quantity_required), 0) as total_reserved
         FROM future_orders fo
         JOIN order_items oi ON fo.id = oi.order_id
         JOIN pcb_components pc ON oi.pcb_type_id = pc.pcb_type_id
         WHERE pc.component_id = $1 
         AND fo.status IN ('confirmed', 'at_risk')
         AND fo.scheduled_production_date <= $2`,
        [componentId, targetDate]
    );
    // Also check legacy single-PCB orders
    const reservedLegacy = await db.query(
        `SELECT COALESCE(SUM(pc.quantity_per_pcb * fo.quantity_required), 0) as total_reserved
         FROM future_orders fo
         JOIN pcb_components pc ON fo.pcb_type_id = pc.pcb_type_id
         WHERE pc.component_id = $1 
         AND fo.pcb_type_id IS NOT NULL
         AND fo.status IN ('confirmed', 'at_risk')
         AND fo.scheduled_production_date <= $2`,
        [componentId, targetDate]
    );
    const reservedStock = parseInt(reservedRes.rows[0]?.total_reserved || 0) + parseInt(reservedLegacy.rows[0]?.total_reserved || 0);

    return {
        current: currentStock,
        incoming: incomingStock,
        reserved: reservedStock,
        projected: currentStock + incomingStock - reservedStock
    };
};

// Check Availability (supports items array for multi-PCB)
exports.checkAvailability = async (req, res) => {
    const { pcb_type_id, quantity, scheduled_production_date, items } = req.body;

    try {
        // Build list of PCB+qty combos
        let pcbItems = [];
        if (items && items.length > 0) {
            pcbItems = items;
        } else if (pcb_type_id && quantity) {
            pcbItems = [{ pcb_type_id, quantity_required: quantity }];
        }

        // Merge all required components across all PCB items
        const componentNeeds = {};
        for (const item of pcbItems) {
            const bomRes = await db.query(
                `SELECT c.id, c.name, c.part_number, pc.quantity_per_pcb
                 FROM pcb_components pc
                 JOIN components c ON pc.component_id = c.id
                 WHERE pc.pcb_type_id = $1`,
                [item.pcb_type_id]
            );
            for (const comp of bomRes.rows) {
                const qty = comp.quantity_per_pcb * (item.quantity_required || item.quantity);
                if (!componentNeeds[comp.id]) {
                    componentNeeds[comp.id] = { ...comp, required_quantity: 0 };
                }
                componentNeeds[comp.id].required_quantity += qty;
            }
        }

        const analysis = [];
        let canFulfill = true;

        for (const compId of Object.keys(componentNeeds)) {
            const comp = componentNeeds[compId];
            const projection = await getStockProjection(parseInt(compId), scheduled_production_date);
            const isShortage = projection.projected < comp.required_quantity;
            if (isShortage) canFulfill = false;

            analysis.push({
                component_id: parseInt(compId),
                name: comp.name,
                part_number: comp.part_number,
                required_quantity: comp.required_quantity,
                current_stock: projection.current,
                incoming_stock: projection.incoming,
                reserved_stock: projection.reserved,
                projected_available: projection.projected,
                status: isShortage ? 'shortage' : 'sufficient',
                shortfall: isShortage ? comp.required_quantity - projection.projected : 0
            });
        }

        res.json({ can_fulfill: canFulfill, components: analysis });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Estimate Delivery Date
exports.estimateDate = async (req, res) => {
    const { items } = req.body; // [{pcb_type_id, quantity_required}]
    console.log("[ESTIMATE_DATE] Items:", items);
    try {
        // Merge all component needs
        const componentNeeds = {};
        for (const item of (items || [])) {
            const bomRes = await db.query(
                `SELECT c.id, c.name, c.current_stock, c.estimated_arrival_days, pc.quantity_per_pcb
                 FROM pcb_components pc
                 JOIN components c ON pc.component_id = c.id
                 WHERE pc.pcb_type_id = $1`,
                [item.pcb_type_id]
            );
            for (const comp of bomRes.rows) {
                const qty = comp.quantity_per_pcb * item.quantity_required;
                if (!componentNeeds[comp.id]) {
                    componentNeeds[comp.id] = { ...comp, total_required: 0 };
                }
                componentNeeds[comp.id].total_required += qty;
            }
        }

        let maxWaitDays = 0;
        let feasible = true;
        const details = [];

        for (const compId of Object.keys(componentNeeds)) {
            const comp = componentNeeds[compId];
            const shortage = comp.total_required - comp.current_stock;

            if (shortage > 0) {
                // Use component's estimated_arrival_days if set
                let estimatedDays = comp.estimated_arrival_days;

                if (!estimatedDays) {
                    // Fall back to historical procurement data
                    const histRes = await db.query(
                        `SELECT AVG(EXTRACT(DAY FROM (expected_delivery_date::timestamp - trigger_date))) as avg_days
                         FROM procurement_triggers 
                         WHERE component_id = $1 AND status = 'received' AND expected_delivery_date IS NOT NULL`,
                        [compId]
                    );
                    estimatedDays = Math.ceil(parseFloat(histRes.rows[0]?.avg_days) || 7);
                }

                if (estimatedDays > maxWaitDays) maxWaitDays = estimatedDays;
                feasible = false;

                details.push({
                    name: comp.name,
                    shortage,
                    estimated_days: estimatedDays,
                    current_stock: comp.current_stock,
                    required: comp.total_required
                });
            } else {
                details.push({
                    name: comp.name,
                    shortage: 0,
                    estimated_days: 0,
                    current_stock: comp.current_stock,
                    required: comp.total_required
                });
            }
        }

        const today = new Date();
        const estimatedDate = new Date(today);
        estimatedDate.setDate(today.getDate() + maxWaitDays);

        res.json({
            feasible: maxWaitDays === 0,
            estimated_production_date: estimatedDate.toISOString().split('T')[0],
            max_wait_days: maxWaitDays,
            details
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create Future Order (supports multi-PCB via items array)
exports.createOrder = async (req, res) => {
    console.log("createOrder CALLED V3");
    const { order_name, pcb_type_id, quantity_required, scheduled_production_date, delivery_date, status, items } = req.body;

    console.log(`[CREATE_ORDER] Name: ${order_name}, Items:`, items);

    let client;
    try {
        client = await db.pool.connect();
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO future_orders 
             (order_name, pcb_type_id, quantity_required, scheduled_production_date, delivery_date, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [order_name, pcb_type_id || null, quantity_required || null, scheduled_production_date, delivery_date, status || 'pending']
        );
        const order = result.rows[0];
        console.log(`[CREATE_ORDER] Order Created ID: ${order.id}`);

        // Insert order items if provided
        if (items && items.length > 0) {
            for (const item of items) {
                console.log(`[CREATE_ORDER] Inserting Item: PCB=${item.pcb_type_id}, Qty=${item.quantity_required}`);
                await client.query(
                    'INSERT INTO order_items (order_id, pcb_type_id, quantity_required) VALUES ($1, $2, $3)',
                    [order.id, item.pcb_type_id, item.quantity_required]
                );
            }
        } else {
            console.log("[CREATE_ORDER] WARNING: No items provided in array");
        }

        await client.query('COMMIT');
        res.status(201).json(order);
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error("createOrder ERROR:", err);
        res.status(500).json({ error: 'CONTROLLER V3: ' + err.message });
    } finally {
        if (client) client.release();
    }
};

// List Future Orders (with items)
exports.getOrders = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT fo.*, pt.name as pcb_name 
             FROM future_orders fo
             LEFT JOIN pcb_types pt ON fo.pcb_type_id = pt.id
             ORDER BY fo.created_at DESC`
        );

        // Fetch items for each order
        const orders = [];
        for (const order of result.rows) {
            const itemsRes = await db.query(
                `SELECT oi.*, pt.name as pcb_name 
                 FROM order_items oi 
                 JOIN pcb_types pt ON oi.pcb_type_id = pt.id
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            orders.push({
                ...order,
                items: itemsRes.rows
            });
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update Future Order
exports.updateOrder = async (req, res) => {
    const { id } = req.params;
    const { order_name, pcb_type_id, quantity_required, scheduled_production_date, delivery_date, items } = req.body;

    try {
        const existing = await db.query('SELECT status FROM future_orders WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        if (['completed', 'cancelled'].includes(existing.rows[0].status)) {
            return res.status(400).json({ error: 'Cannot edit a completed or cancelled order' });
        }

        const result = await db.query(
            `UPDATE future_orders 
             SET order_name = $1, pcb_type_id = $2, quantity_required = $3, 
                 scheduled_production_date = $4, delivery_date = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [order_name, pcb_type_id || null, quantity_required || null, scheduled_production_date, delivery_date, id]
        );

        // Replace order items
        if (items) {
            await db.query('DELETE FROM order_items WHERE order_id = $1', [id]);
            for (const item of items) {
                await db.query(
                    'INSERT INTO order_items (order_id, pcb_type_id, quantity_required) VALUES ($1, $2, $3)',
                    [id, item.pcb_type_id, item.quantity_required]
                );
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete Order
exports.deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM future_orders WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order deleted', order: result.rows[0] });
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

// Execute Order (Convert to Production Entry) - supports multi-PCB
exports.executeOrder = async (req, res) => {
    const { id } = req.params;
    let client;
    try {
        client = await db.pool.connect();
    } catch (connErr) {
        return res.status(503).json({ error: "Database connection failed" });
    }

    try {
        await client.query('BEGIN');

        const orderRes = await client.query('SELECT * FROM future_orders WHERE id = $1', [id]);
        const order = orderRes.rows[0];
        if (!order) throw new Error('Order not found');
        if (order.status === 'completed') throw new Error('Order already completed');

        // Get order items (multi-PCB) or fall back to legacy single PCB
        const itemsRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        let pcbItems = itemsRes.rows;
        if (pcbItems.length === 0 && order.pcb_type_id && order.quantity_required) {
            pcbItems = [{ pcb_type_id: order.pcb_type_id, quantity_required: order.quantity_required }];
        }

        // Check stock for all items
        const shortages = [];
        const allBomItems = [];
        for (const item of pcbItems) {
            const bomRes = await client.query(
                'SELECT component_id, quantity_per_pcb FROM pcb_components WHERE pcb_type_id = $1',
                [item.pcb_type_id]
            );
            for (const bom of bomRes.rows) {
                const totalRequired = bom.quantity_per_pcb * item.quantity_required;
                const compRes = await client.query('SELECT current_stock, name FROM components WHERE id = $1', [bom.component_id]);
                const comp = compRes.rows[0];
                if (comp.current_stock < totalRequired) {
                    shortages.push(`${comp.name}: need ${totalRequired}, have ${comp.current_stock}`);
                }
                allBomItems.push({ ...bom, totalRequired, pcb_type_id: item.pcb_type_id, quantity_produced: item.quantity_required });
            }
        }

        if (shortages.length > 0) {
            throw new Error(`Insufficient stock for: ${shortages.join('; ')}`);
        }

        // Deduct stock and create entries per PCB item
        const entryIds = [];
        for (const item of pcbItems) {
            const prodRes = await client.query(
                'INSERT INTO production_entries (pcb_type_id, quantity_produced) VALUES ($1, $2) RETURNING id',
                [item.pcb_type_id, item.quantity_required]
            );
            const entryId = prodRes.rows[0].id;
            entryIds.push(entryId);

            const bomRes = await client.query(
                'SELECT component_id, quantity_per_pcb FROM pcb_components WHERE pcb_type_id = $1',
                [item.pcb_type_id]
            );
            for (const bom of bomRes.rows) {
                const totalRequired = bom.quantity_per_pcb * item.quantity_required;
                await client.query(
                    'UPDATE components SET current_stock = current_stock - $1 WHERE id = $2',
                    [totalRequired, bom.component_id]
                );
                await client.query(
                    'INSERT INTO consumption_history (production_entry_id, component_id, quantity_consumed) VALUES ($1, $2, $3)',
                    [entryId, bom.component_id, totalRequired]
                );
            }
        }

        await client.query("UPDATE future_orders SET status = 'completed' WHERE id = $1", [id]);
        await client.query('COMMIT');
        res.json({ message: 'Order executed successfully', production_entry_ids: entryIds });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("EXECUTION ERROR:", err);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};
