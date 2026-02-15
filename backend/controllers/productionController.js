const db = require('../config/db');
const auditService = require('../services/auditService');

exports.recordProduction = async (req, res) => {
    const { pcb_type_id, quantity_produced } = req.body;

    if (!pcb_type_id || !quantity_produced || quantity_produced <= 0) {
        return res.status(400).json({ error: 'Valid PCB Type and Quantity are required' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get BOM for the PCB
        const bomResult = await client.query(
            `SELECT c.id AS component_id, c.name, c.current_stock, c.monthly_required_quantity, pc.quantity_per_pcb
             FROM pcb_components pc
             JOIN components c ON pc.component_id = c.id
             WHERE pc.pcb_type_id = $1`,
            [pcb_type_id]
        );

        const components = bomResult.rows;

        if (components.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No components mapped to this PCB type' });
        }

        // 2. Check Stock Availability
        for (const comp of components) {
            const requiredQty = comp.quantity_per_pcb * quantity_produced;
            if (comp.current_stock < requiredQty) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Insufficient stock for ${comp.name}. Required: ${requiredQty}, Available: ${comp.current_stock}`
                });
            }
            comp.requiredQty = requiredQty; // Store for later use
        }

        // 3. Create Production Entry
        const prodEntryResult = await client.query(
            'INSERT INTO production_entries (pcb_type_id, quantity_produced) VALUES ($1, $2) RETURNING id',
            [pcb_type_id, quantity_produced]
        );
        const productionEntryId = prodEntryResult.rows[0].id;

        // 4. Deduct Stock & Record History & Check Triggers
        for (const comp of components) {
            // Deduct Stock
            const updateResult = await client.query(
                'UPDATE components SET current_stock = current_stock - $1 WHERE id = $2 RETURNING current_stock, monthly_required_quantity',
                [comp.requiredQty, comp.component_id]
            );

            const updatedStock = updateResult.rows[0].current_stock;
            const monthlyReq = updateResult.rows[0].monthly_required_quantity;

            // Record History
            await client.query(
                'INSERT INTO consumption_history (production_entry_id, component_id, quantity_consumed) VALUES ($1, $2, $3)',
                [productionEntryId, comp.component_id, comp.requiredQty]
            );

            // Check Procurement Trigger (Stock < 20% of monthly requirement)
            const threshold = Math.ceil(monthlyReq * 0.2);
            if (updatedStock < threshold) {
                // Check if active trigger exists
                const triggerCheck = await client.query(
                    "SELECT id FROM procurement_triggers WHERE component_id = $1 AND status IN ('pending', 'ordered')",
                    [comp.component_id]
                );

                if (triggerCheck.rows.length === 0) {
                    await client.query(
                        'INSERT INTO procurement_triggers (component_id, current_stock, required_threshold, status) VALUES ($1, $2, $3, $4)',
                        [comp.component_id, updatedStock, threshold, 'pending']
                    );
                }
            }
        }

        await client.query('COMMIT');

        // Audit Log
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        auditService.logAction(
            req.user ? req.user.id : null, // Assuming you have middleware that sets req.user
            'PRODUCTION_RUN',
            `Produced ${quantity_produced} units of PCB ID ${pcb_type_id}. Entry ID: ${productionEntryId}`,
            ip
        );

        res.status(201).json({ message: 'Production recorded successfully', productionId: productionEntryId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Transaction failed: ' + err.message });
    } finally {
        client.release();
    }
};

// Production History
exports.getHistory = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT pe.id, pe.quantity_produced, pe.produced_at, pt.name as pcb_name,
                    (SELECT COUNT(*) FROM consumption_history WHERE production_entry_id = pe.id) as components_consumed
             FROM production_entries pe
             JOIN pcb_types pt ON pe.pcb_type_id = pt.id
             ORDER BY pe.produced_at DESC
             LIMIT 100`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

