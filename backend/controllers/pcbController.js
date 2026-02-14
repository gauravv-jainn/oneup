const db = require('../config/db');

// Create PCB Type
exports.createPCB = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'PCB Name is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO pcb_types (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get All PCBs
exports.getAllPCBs = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM pcb_types ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get Single PCB with Components (BOM)
exports.getPCBById = async (req, res) => {
    const { id } = req.params;
    try {
        const pcbResult = await db.query('SELECT * FROM pcb_types WHERE id = $1', [id]);
        if (pcbResult.rows.length === 0) {
            return res.status(404).json({ error: 'PCB not found' });
        }

        const componentsResult = await db.query(
            `SELECT c.id, c.name, c.part_number, c.current_stock, pc.quantity_per_pcb 
             FROM pcb_components pc 
             JOIN components c ON pc.component_id = c.id 
             WHERE pc.pcb_type_id = $1`,
            [id]
        );

        const pcb = pcbResult.rows[0];
        pcb.components = componentsResult.rows;

        res.json(pcb);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Add Component to PCB (BOM)
exports.addComponentToPCB = async (req, res) => {
    const { id } = req.params; // pcb_type_id
    const { component_id, quantity_per_pcb } = req.body;

    if (!component_id || !quantity_per_pcb || quantity_per_pcb <= 0) {
        return res.status(400).json({ error: 'Invalid component or quantity' });
    }

    try {
        const result = await db.query(
            'INSERT INTO pcb_components (pcb_type_id, component_id, quantity_per_pcb) VALUES ($1, $2, $3) RETURNING *',
            [id, component_id, quantity_per_pcb]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Component already added to this PCB' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Remove Component from PCB
exports.removeComponentFromPCB = async (req, res) => {
    const { id, componentId } = req.params;

    try {
        const result = await db.query(
            'DELETE FROM pcb_components WHERE pcb_type_id = $1 AND component_id = $2 RETURNING *',
            [id, componentId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Component not found in this PCB' });
        }
        res.json({ message: 'Component removed from PCB' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
