require('dotenv').config();
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Seeding database with sample data...');

    try {
        // 1. Create admin user if not exists
        const existingUser = await db.query("SELECT id FROM users WHERE username = 'admin'");
        if (existingUser.rows.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await db.query("INSERT INTO users (username, password_hash, role) VALUES ('admin', $1, 'admin')", [hash]);
            console.log('  ✓ Admin user created (admin / admin123)');
        }

        // 2. Components (electronic parts)
        const components = [
            ['ATmega328P', 'IC-ATM328P', 500, 200, 5],
            ['ESP32-WROOM', 'IC-ESP32W', 300, 150, 7],
            ['STM32F103', 'IC-STM32F1', 100, 180, 10],
            ['10kΩ Resistor', 'R-10K-0805', 5000, 2000, 3],
            ['100nF Capacitor', 'C-100N-0805', 8000, 3000, 3],
            ['470µF Electrolytic', 'C-470U-16V', 1200, 500, 5],
            ['Red LED 0805', 'LED-RED-0805', 3000, 1000, 4],
            ['Green LED 0805', 'LED-GRN-0805', 2500, 800, 4],
            ['USB-C Connector', 'CONN-USBC', 400, 250, 8],
            ['Crystal 16MHz', 'XTAL-16M', 600, 300, 6],
            ['AMS1117-3.3V', 'REG-AMS3V3', 800, 400, 5],
            ['CH340G USB-UART', 'IC-CH340G', 250, 200, 7],
            ['Tactile Switch', 'SW-TACT-6MM', 2000, 600, 3],
            ['2.54mm Header 40P', 'HDR-40P-254', 150, 300, 4],
            ['BSS138 MOSFET', 'Q-BSS138', 1500, 500, 5],
            ['SSD1306 OLED', 'DISP-SSD1306', 30, 100, 14],
            ['MPU6050 IMU', 'IC-MPU6050', 40, 120, 12],
            ['NRF24L01+', 'IC-NRF24', 60, 80, 10],
            ['W25Q32 Flash', 'IC-W25Q32', 200, 150, 8],
            ['LM7805 Regulator', 'REG-LM7805', 900, 400, 4],
        ];

        for (const [name, part, stock, monthly, arrival] of components) {
            await db.query(
                `INSERT INTO components (name, part_number, current_stock, monthly_required_quantity, estimated_arrival_days) 
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (part_number) DO UPDATE SET current_stock = $3, monthly_required_quantity = $4, estimated_arrival_days = $5`,
                [name, part, stock, monthly, arrival]
            );
        }
        console.log(`  ✓ ${components.length} components seeded`);

        // 3. PCB Types
        const pcbTypes = [
            ['Arduino Nano Clone', 'Arduino Nano compatible board with ATmega328P'],
            ['ESP32 Dev Kit', 'WiFi/BLE development board with ESP32-WROOM'],
            ['STM32 BluePill', 'Low-cost ARM Cortex-M3 development board'],
            ['Sensor Hub Board', 'Multi-sensor breakout board with IMU and display'],
            ['Power Supply Module', '5V/3.3V dual output power supply board'],
        ];

        const pcbIds = [];
        for (const [name, desc] of pcbTypes) {
            const res = await db.query(
                `INSERT INTO pcb_types (name, description) VALUES ($1, $2)
                 ON CONFLICT DO NOTHING RETURNING id`,
                [name, desc]
            );
            if (res.rows.length > 0) pcbIds.push(res.rows[0].id);
        }
        // Get all PCB IDs
        const allPcbs = await db.query('SELECT id, name FROM pcb_types ORDER BY id');
        console.log(`  ✓ ${pcbTypes.length} PCB types seeded`);

        // 4. BOM Mapping (pcb_components)
        const allComps = await db.query('SELECT id, part_number FROM components');
        const compMap = {};
        allComps.rows.forEach(c => compMap[c.part_number] = c.id);

        const bomData = [
            // Arduino Nano Clone
            ['Arduino Nano Clone', 'IC-ATM328P', 1],
            ['Arduino Nano Clone', 'XTAL-16M', 1],
            ['Arduino Nano Clone', 'R-10K-0805', 4],
            ['Arduino Nano Clone', 'C-100N-0805', 8],
            ['Arduino Nano Clone', 'LED-RED-0805', 1],
            ['Arduino Nano Clone', 'LED-GRN-0805', 1],
            ['Arduino Nano Clone', 'REG-AMS3V3', 1],
            ['Arduino Nano Clone', 'IC-CH340G', 1],
            ['Arduino Nano Clone', 'CONN-USBC', 1],
            ['Arduino Nano Clone', 'HDR-40P-254', 2],
            ['Arduino Nano Clone', 'SW-TACT-6MM', 1],
            // ESP32 Dev Kit
            ['ESP32 Dev Kit', 'IC-ESP32W', 1],
            ['ESP32 Dev Kit', 'C-100N-0805', 10],
            ['ESP32 Dev Kit', 'R-10K-0805', 6],
            ['ESP32 Dev Kit', 'CONN-USBC', 1],
            ['ESP32 Dev Kit', 'LED-RED-0805', 1],
            ['ESP32 Dev Kit', 'REG-AMS3V3', 1],
            ['ESP32 Dev Kit', 'IC-CH340G', 1],
            ['ESP32 Dev Kit', 'SW-TACT-6MM', 2],
            ['ESP32 Dev Kit', 'HDR-40P-254', 2],
            // STM32 BluePill
            ['STM32 BluePill', 'IC-STM32F1', 1],
            ['STM32 BluePill', 'XTAL-16M', 1],
            ['STM32 BluePill', 'R-10K-0805', 3],
            ['STM32 BluePill', 'C-100N-0805', 6],
            ['STM32 BluePill', 'REG-AMS3V3', 1],
            ['STM32 BluePill', 'LED-GRN-0805', 1],
            ['STM32 BluePill', 'HDR-40P-254', 2],
            // Sensor Hub
            ['Sensor Hub Board', 'IC-ATM328P', 1],
            ['Sensor Hub Board', 'IC-MPU6050', 1],
            ['Sensor Hub Board', 'DISP-SSD1306', 1],
            ['Sensor Hub Board', 'R-10K-0805', 4],
            ['Sensor Hub Board', 'C-100N-0805', 6],
            ['Sensor Hub Board', 'IC-NRF24', 1],
            // Power Supply Module
            ['Power Supply Module', 'REG-LM7805', 1],
            ['Power Supply Module', 'REG-AMS3V3', 1],
            ['Power Supply Module', 'C-470U-16V', 2],
            ['Power Supply Module', 'C-100N-0805', 4],
            ['Power Supply Module', 'LED-GRN-0805', 2],
            ['Power Supply Module', 'R-10K-0805', 2],
        ];

        const pcbMap = {};
        allPcbs.rows.forEach(p => pcbMap[p.name] = p.id);

        for (const [pcbName, partNum, qty] of bomData) {
            const pcbId = pcbMap[pcbName];
            const compId = compMap[partNum];
            if (pcbId && compId) {
                await db.query(
                    `INSERT INTO pcb_components (pcb_type_id, component_id, quantity_per_pcb) VALUES ($1, $2, $3)
                     ON CONFLICT (pcb_type_id, component_id) DO UPDATE SET quantity_per_pcb = $3`,
                    [pcbId, compId, qty]
                );
            }
        }
        console.log(`  ✓ ${bomData.length} BOM mappings seeded`);

        // 5. Production entries (last 30 days)
        const pcbIdsArr = allPcbs.rows.map(p => p.id);
        for (let d = 29; d >= 0; d--) {
            const runsPerDay = Math.floor(Math.random() * 3) + 1;
            for (let r = 0; r < runsPerDay; r++) {
                const pcbId = pcbIdsArr[Math.floor(Math.random() * pcbIdsArr.length)];
                const qty = Math.floor(Math.random() * 20) + 5;
                const peRes = await db.query(
                    `INSERT INTO production_entries (pcb_type_id, quantity_produced, produced_at)
                     VALUES ($1, $2, CURRENT_DATE - INTERVAL '${d} days' + INTERVAL '${Math.floor(Math.random() * 8) + 8} hours')
                     RETURNING id`,
                    [pcbId, qty]
                );
                const peId = peRes.rows[0].id;

                // Get BOM for this PCB and create consumption history
                const bomRes = await db.query(
                    'SELECT component_id, quantity_per_pcb FROM pcb_components WHERE pcb_type_id = $1',
                    [pcbId]
                );
                for (const bom of bomRes.rows) {
                    await db.query(
                        `INSERT INTO consumption_history (production_entry_id, component_id, quantity_consumed, consumed_at)
                         VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '${d} days' + INTERVAL '${Math.floor(Math.random() * 8) + 8} hours')`,
                        [peId, bom.component_id, bom.quantity_per_pcb * qty]
                    );
                }
            }
        }
        console.log('  ✓ 30 days of production + consumption history seeded');

        // 6. Procurement triggers
        const lowStockComps = await db.query(
            `SELECT id, name, current_stock, monthly_required_quantity FROM components 
             WHERE current_stock < (monthly_required_quantity * 0.5) LIMIT 5`
        );
        for (const comp of lowStockComps.rows) {
            await db.query(
                `INSERT INTO procurement_triggers (component_id, current_stock, required_threshold, status, quantity_ordered, supplier_name, expected_delivery_date)
                 VALUES ($1, $2, $3, 'ordered', $4, $5, CURRENT_DATE + INTERVAL '5 days')`,
                [comp.id, comp.current_stock, Math.floor(comp.monthly_required_quantity * 0.2), comp.monthly_required_quantity - comp.current_stock, 'DigiKey Electronics']
            );
        }
        console.log('  ✓ Procurement triggers seeded');

        // 7. Future orders
        if (pcbIdsArr.length >= 2) {
            await db.query(
                `INSERT INTO future_orders (order_name, pcb_type_id, quantity_required, scheduled_production_date, delivery_date, status)
                 VALUES ('Client Alpha Batch', $1, 100, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'confirmed'),
                        ('Beta Test Units', $2, 50, CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '14 days', 'pending')`,
                [pcbIdsArr[0], pcbIdsArr[1]]
            );
        }
        console.log('  ✓ Future orders seeded');

        console.log('\n✅ Seed complete! All sample data has been loaded.');
    } catch (err) {
        console.error('❌ Seed error:', err);
    } finally {
        process.exit(0);
    }
}

seed();
