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

// Update Trigger Status
exports.updateTriggerStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'ordered', 'received'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await db.query(
            'UPDATE procurement_triggers SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Trigger not found' });
        }

        // Optional: If status is 'received', we could prompt (or auto) update stock?
        // For this MVP, we just mark it. The user manually updates stock or we add a feature later.
        // User logic: "Update procurement status to 'ordered' then 'received'".

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
