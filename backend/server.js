const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');

const app = express();

// Auto-create required tables and schema migrations
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                details TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES future_orders(id) ON DELETE CASCADE,
                pcb_type_id INTEGER REFERENCES pcb_types(id) ON DELETE CASCADE,
                quantity_required INTEGER NOT NULL CHECK (quantity_required > 0)
            );
        `);
        // Add new columns if not exists
        await db.query(`
            ALTER TABLE components ADD COLUMN IF NOT EXISTS estimated_arrival_days INTEGER DEFAULT NULL;
            ALTER TABLE components ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;
            ALTER TABLE components ADD COLUMN IF NOT EXISTS spare_part_status VARCHAR(50) DEFAULT NULL;
            ALTER TABLE components ADD COLUMN IF NOT EXISTS status_description VARCHAR(255) DEFAULT NULL;
            ALTER TABLE components ADD COLUMN IF NOT EXISTS status_count INTEGER DEFAULT NULL;
            ALTER TABLE components ADD COLUMN IF NOT EXISTS total_entries INTEGER DEFAULT NULL;
            ALTER TABLE components ADD COLUMN IF NOT EXISTS dc_no VARCHAR(50) DEFAULT NULL;
        `);
        console.log('[INIT] Schema migrations complete');
    } catch (err) {
        console.error('[INIT] Schema migration error:', err.message);
    }
})();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Serve uploaded files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Placeholder
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/components', require('./routes/componentRoutes'));
app.use('/api/pcbs', require('./routes/pcbRoutes'));
app.use('/api/production', require('./routes/productionRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/procurement', require('./routes/procurementRoutes'));
app.use('/api/excel', require('./routes/excelRoutes'));
app.use('/api/future-orders', require('./routes/futureOrderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Inventory Automation API' });
});

// 404 Handler
app.use((req, res, next) => {
    console.log(`[404_HANDLER] URL: ${req.originalUrl}, Method: ${req.method}`);
    res.status(404).json({ error: 'Endpoint Not Found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'GLOBAL HANDLER: Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} --- V2 CHECK ---`);
});
