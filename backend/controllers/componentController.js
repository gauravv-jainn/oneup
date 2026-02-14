const db = require('../config/db');

// Create Component
exports.createComponent = async (req, res) => {
    const { name, part_number, current_stock, monthly_required_quantity } = req.body;

    if (!name || !part_number || current_stock === undefined || monthly_required_quantity === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (current_stock < 0) {
        return res.status(400).json({ error: 'Stock cannot be negative' });
    }

    try {
        const result = await db.query(
            'INSERT INTO components (name, part_number, current_stock, monthly_required_quantity) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, part_number, current_stock, monthly_required_quantity]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Part number must be unique' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get All Components
exports.getAllComponents = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM components ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get Single Component
exports.getComponentById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM components WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Component not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update Component
exports.updateComponent = async (req, res) => {
    const { id } = req.params;
    const { name, part_number, current_stock, monthly_required_quantity } = req.body;

    // Build update query dynamically
    // For simplicity in this hackathon, assume all fields sent or do full update
    // But let's verify inputs

    try {
        const result = await db.query(
            'UPDATE components SET name = $1, part_number = $2, current_stock = $3, monthly_required_quantity = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, part_number, current_stock, monthly_required_quantity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Component not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Part number must be unique' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete Component
exports.deleteComponent = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM components WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Component not found' });
        }
        res.json({ message: 'Component deleted successfully' });
    } catch (err) {
        console.error(err);
        // Check for foreign key constraint violation (e.g., used in PCB BOM)
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete component: It is used in one or more PCBs' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};
