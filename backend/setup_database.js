const { Client } = require('pg');
require('dotenv').config();

const createDatabase = async () => {
    const client = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'postgres', // Connect to default database
    });

    try {
        await client.connect();
        
        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${process.env.DB_NAME}...`);
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log('Database created successfully.');
        } else {
            console.log('Database already exists.');
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
};

const createTables = async () => {
    const client = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
    });

    const schema = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS components (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        part_number VARCHAR(50) UNIQUE NOT NULL,
        current_stock INTEGER NOT NULL CHECK (current_stock >= 0),
        monthly_required_quantity INTEGER NOT NULL CHECK (monthly_required_quantity > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pcb_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pcb_components (
        id SERIAL PRIMARY KEY,
        pcb_type_id INTEGER REFERENCES pcb_types(id) ON DELETE CASCADE,
        component_id INTEGER REFERENCES components(id) ON DELETE CASCADE,
        quantity_per_pcb INTEGER NOT NULL CHECK (quantity_per_pcb > 0),
        UNIQUE(pcb_type_id, component_id)
    );

    CREATE TABLE IF NOT EXISTS production_entries (
        id SERIAL PRIMARY KEY,
        pcb_type_id INTEGER REFERENCES pcb_types(id),
        quantity_produced INTEGER NOT NULL CHECK (quantity_produced > 0),
        produced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consumption_history (
        id SERIAL PRIMARY KEY,
        production_entry_id INTEGER REFERENCES production_entries(id),
        component_id INTEGER REFERENCES components(id),
        quantity_consumed INTEGER NOT NULL,
        consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS procurement_triggers (
        id SERIAL PRIMARY KEY,
        component_id INTEGER REFERENCES components(id),
        trigger_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        current_stock INTEGER,
        required_threshold INTEGER,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received'))
    );
    `;

    try {
        await client.connect();
        console.log('Creating tables...');
        await client.query(schema);
        console.log('Tables created successfully.');
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        await client.end();
    }
};

const init = async () => {
    await createDatabase();
    await createTables();
};

init();
