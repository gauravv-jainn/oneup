const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
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

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Inventory Automation API' });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint Not Found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
