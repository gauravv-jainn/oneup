const db = require('../config/db');

// Get All Triggers
exports.getTriggers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT pt.*, c.name as component_name, c.part_number 
             FROM procurement_triggers pt
             JOIN components c ON pt.component_id = c.id
             ORDER BY pt.trigger_date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update Trigger Status & Delivery Details
exports.updateTriggerStatus = async (req, res) => {
    const { id } = req.params;
    const { status, expected_delivery_date, quantity_ordered, supplier_name } = req.body;

    if (!['pending', 'ordered', 'received'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await db.query(
            `UPDATE procurement_triggers 
             SET status = $1, 
                 expected_delivery_date = $2, 
                 quantity_ordered = $3, 
                 supplier_name = $4
             WHERE id = $5 RETURNING *`,
            [status, expected_delivery_date || null, quantity_ordered || null, supplier_name || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Trigger not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
