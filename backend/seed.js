/**
 * Database Seed Script
 * Populates the database with realistic test data for all features.
 * Run: node seed.js
 */
require('dotenv').config();
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');
        console.log('🌱 Starting database seed...\n');

        // ─── 1. USERS ──────────────────────────────────────────
        console.log('👤 Seeding users...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const users = [
            ['admin', hashedPassword, 'admin'],
            ['operator1', await bcrypt.hash('operator123', 10), 'operator'],
            ['viewer1', await bcrypt.hash('viewer123', 10), 'viewer'],
        ];
        for (const [username, password, role] of users) {
            const exists = await client.query('SELECT id FROM users WHERE username = $1', [username]);
            if (exists.rows.length === 0) {
                await client.query(
                    `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)`,
                    [username, password, role]
                );
            }
        }
        console.log(`   ✅ ${users.length} users seeded`);

        // ─── 2. COMPONENTS (25 realistic electronic components) ───
        console.log('📦 Seeding components...');
        const components = [
            ['ATmega328P Microcontroller', 'ATMEGA328P-AU', 850, 200],
            ['ESP32-WROOM-32 Module', 'ESP32-WROOM-32', 420, 150],
            ['STM32F103C8T6 MCU', 'STM32F103C8T6', 300, 100],
            ['LM7805 Voltage Regulator', 'LM7805CT', 1200, 500],
            ['AMS1117-3.3V Regulator', 'AMS1117-3.3', 950, 400],
            ['10uF Electrolytic Capacitor', 'CAP-10UF-25V', 5000, 2000],
            ['100nF Ceramic Capacitor', 'CAP-100NF-50V', 8000, 3000],
            ['10K Ohm Resistor', 'RES-10K-0805', 12000, 5000],
            ['330 Ohm Resistor', 'RES-330R-0805', 9000, 3000],
            ['LED Red 5mm', 'LED-RED-5MM', 3000, 1000],
            ['LED Green 5mm', 'LED-GRN-5MM', 2800, 1000],
            ['LED Blue SMD 0805', 'LED-BLU-0805', 1500, 600],
            ['16MHz Crystal Oscillator', 'XTAL-16MHZ', 600, 200],
            ['USB Type-C Connector', 'USB-C-16PIN', 400, 150],
            ['Micro USB Connector', 'USB-MICRO-B', 700, 300],
            ['Push Button 6x6mm', 'BTN-6X6-SMD', 4000, 1500],
            ['MOSFET IRF540N', 'IRF540N', 350, 100],
            ['NPN Transistor 2N2222', '2N2222A', 2000, 800],
            ['LDR Photoresistor', 'LDR-5516', 500, 150],
            ['DHT22 Temp Sensor', 'DHT22-AM2302', 180, 80],
            ['HC-SR04 Ultrasonic', 'HC-SR04', 120, 50],
            ['OLED 0.96" I2C Display', 'SSD1306-OLED', 90, 40],
            ['MicroSD Card Slot', 'SD-SLOT-PUSH', 250, 100],
            ['PCB Screw Terminal 2P', 'TERM-2P-5MM', 1800, 700],
            ['40-pin Male Header', 'HDR-40P-MALE', 3500, 1200],
        ];

        const componentIds = [];
        for (const [name, part_number, stock, monthly] of components) {
            // Check if component exists, update if so
            const existing = await client.query('SELECT id FROM components WHERE part_number = $1', [part_number]);
            let res;
            if (existing.rows.length > 0) {
                res = await client.query(
                    `UPDATE components SET name = $1, current_stock = $3, monthly_required_quantity = $4 WHERE part_number = $2 RETURNING id`,
                    [name, part_number, stock, monthly]
                );
            } else {
                res = await client.query(
                    `INSERT INTO components (name, part_number, current_stock, monthly_required_quantity) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    [name, part_number, stock, monthly]
                );
            }
            componentIds.push(res.rows[0].id);
        }
        console.log(`   ✅ ${components.length} components seeded`);

        // ─── 3. PCB TYPES (6 realistic PCBs) ───────────────────
        console.log('🔧 Seeding PCB types...');
        const pcbTypes = [
            ['Arduino Nano Clone', 'Budget-friendly ATmega328P development board'],
            ['ESP32 Dev Board', 'WiFi + Bluetooth IoT development board'],
            ['STM32 Blue Pill', 'ARM Cortex-M3 based development board'],
            ['Sensor Shield v2', 'Multi-sensor interface board with analog/digital inputs'],
            ['Motor Driver Board', 'Dual H-Bridge motor controller board'],
            ['Power Supply Unit', '5V/3.3V regulated power supply module'],
        ];

        const pcbIds = [];
        for (const [name, description] of pcbTypes) {
            const existing = await client.query('SELECT id FROM pcb_types WHERE name = $1', [name]);
            let res;
            if (existing.rows.length > 0) {
                res = await client.query(
                    `UPDATE pcb_types SET description = $2 WHERE name = $1 RETURNING id`,
                    [name, description]
                );
            } else {
                res = await client.query(
                    `INSERT INTO pcb_types (name, description) VALUES ($1, $2) RETURNING id`,
                    [name, description]
                );
            }
            pcbIds.push(res.rows[0].id);
        }
        console.log(`   ✅ ${pcbTypes.length} PCB types seeded`);

        // ─── 4. PCB ↔ COMPONENT MAPPING (BOM) ──────────────────
        console.log('🔗 Seeding BOM mappings...');
        // Arduino Nano Clone: ATmega328P, LM7805, 100nF cap, 10K resistor, LED Red, 16MHz Crystal, USB Micro, Button, 40-pin header
        const bomMappings = [
            [pcbIds[0], componentIds[0], 1],   // ATmega328P
            [pcbIds[0], componentIds[3], 1],   // LM7805
            [pcbIds[0], componentIds[6], 4],   // 100nF cap x4
            [pcbIds[0], componentIds[7], 3],   // 10K resistor x3
            [pcbIds[0], componentIds[9], 2],   // LED Red x2
            [pcbIds[0], componentIds[12], 1],  // 16MHz Crystal
            [pcbIds[0], componentIds[14], 1],  // Micro USB
            [pcbIds[0], componentIds[15], 1],  // Button
            [pcbIds[0], componentIds[24], 2],  // 40-pin header x2

            // ESP32 Dev Board: ESP32, AMS1117, 10uF cap, 100nF cap, LED Blue, USB-C, Button
            [pcbIds[1], componentIds[1], 1],   // ESP32
            [pcbIds[1], componentIds[4], 1],   // AMS1117-3.3V
            [pcbIds[1], componentIds[5], 2],   // 10uF cap x2
            [pcbIds[1], componentIds[6], 6],   // 100nF cap x6
            [pcbIds[1], componentIds[11], 1],  // LED Blue
            [pcbIds[1], componentIds[13], 1],  // USB-C
            [pcbIds[1], componentIds[15], 2],  // Button x2

            // STM32 Blue Pill: STM32, AMS1117, 100nF cap, 10K resistor, LED Green, 16MHz Crystal, Micro USB
            [pcbIds[2], componentIds[2], 1],   // STM32
            [pcbIds[2], componentIds[4], 1],   // AMS1117-3.3V
            [pcbIds[2], componentIds[6], 5],   // 100nF cap x5
            [pcbIds[2], componentIds[7], 2],   // 10K resistor x2
            [pcbIds[2], componentIds[10], 1],  // LED Green
            [pcbIds[2], componentIds[12], 1],  // 16MHz Crystal
            [pcbIds[2], componentIds[14], 1],  // Micro USB

            // Sensor Shield: 10uF cap, 100nF cap, 10K resistor, 330R resistor, LDR, DHT22, HC-SR04, Screw Terminal, 40-pin header
            [pcbIds[3], componentIds[5], 3],   // 10uF cap x3
            [pcbIds[3], componentIds[6], 8],   // 100nF cap x8
            [pcbIds[3], componentIds[7], 6],   // 10K resistor x6
            [pcbIds[3], componentIds[8], 4],   // 330R resistor x4
            [pcbIds[3], componentIds[18], 1],  // LDR
            [pcbIds[3], componentIds[19], 1],  // DHT22
            [pcbIds[3], componentIds[20], 1],  // HC-SR04
            [pcbIds[3], componentIds[23], 4],  // Screw Terminal x4
            [pcbIds[3], componentIds[24], 1],  // 40-pin header

            // Motor Driver: MOSFET, 2N2222, 10uF cap, 100nF cap, 330R resistor, Screw Terminal
            [pcbIds[4], componentIds[16], 4],  // MOSFET x4
            [pcbIds[4], componentIds[17], 2],  // 2N2222 x2
            [pcbIds[4], componentIds[5], 4],   // 10uF cap x4
            [pcbIds[4], componentIds[6], 6],   // 100nF cap x6
            [pcbIds[4], componentIds[8], 8],   // 330R resistor x8
            [pcbIds[4], componentIds[23], 6],  // Screw Terminal x6

            // Power Supply Unit: LM7805, AMS1117, 10uF cap, 100nF cap, LED Green, LED Red, Screw Terminal
            [pcbIds[5], componentIds[3], 1],   // LM7805
            [pcbIds[5], componentIds[4], 1],   // AMS1117-3.3V
            [pcbIds[5], componentIds[5], 4],   // 10uF cap x4
            [pcbIds[5], componentIds[6], 4],   // 100nF cap x4
            [pcbIds[5], componentIds[9], 1],   // LED Red
            [pcbIds[5], componentIds[10], 1],  // LED Green
            [pcbIds[5], componentIds[23], 4],  // Screw Terminal x4
        ];

        // Clear existing BOM to avoid duplicates
        await client.query('DELETE FROM pcb_components');
        for (const [pcb_id, comp_id, qty] of bomMappings) {
            await client.query(
                `INSERT INTO pcb_components (pcb_type_id, component_id, quantity_per_pcb) VALUES ($1, $2, $3)`,
                [pcb_id, comp_id, qty]
            );
        }
        console.log(`   ✅ ${bomMappings.length} BOM mappings seeded`);

        // ─── 5. PRODUCTION ENTRIES (20 runs over last 14 days) ──
        console.log('🏭 Seeding production entries...');
        const productionRuns = [
            [pcbIds[0], 50, 13], [pcbIds[1], 30, 12], [pcbIds[0], 25, 11],
            [pcbIds[2], 40, 10], [pcbIds[3], 20, 9], [pcbIds[4], 15, 8],
            [pcbIds[5], 35, 7], [pcbIds[0], 45, 6], [pcbIds[1], 25, 5],
            [pcbIds[2], 30, 5], [pcbIds[3], 18, 4], [pcbIds[4], 22, 3],
            [pcbIds[5], 40, 3], [pcbIds[0], 60, 2], [pcbIds[1], 35, 2],
            [pcbIds[2], 20, 1], [pcbIds[3], 15, 1], [pcbIds[4], 10, 0],
            [pcbIds[5], 25, 0], [pcbIds[0], 30, 0],
        ];

        const prodEntryIds = [];
        for (const [pcb_id, qty, daysAgo] of productionRuns) {
            const res = await client.query(
                `INSERT INTO production_entries (pcb_type_id, quantity_produced, produced_at) 
                 VALUES ($1, $2, CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days') RETURNING id`,
                [pcb_id, qty]
            );
            prodEntryIds.push({ id: res.rows[0].id, pcb_id, qty });
        }
        console.log(`   ✅ ${productionRuns.length} production entries seeded`);

        // ─── 6. CONSUMPTION HISTORY (linked to production) ──────
        console.log('📊 Seeding consumption history...');
        let consumptionCount = 0;
        for (const entry of prodEntryIds) {
            // Get BOM for this PCB
            const bomRes = await client.query(
                'SELECT component_id, quantity_per_pcb FROM pcb_components WHERE pcb_type_id = $1',
                [entry.pcb_id]
            );
            for (const bom of bomRes.rows) {
                const consumed = bom.quantity_per_pcb * entry.qty;
                await client.query(
                    `INSERT INTO consumption_history (production_entry_id, component_id, quantity_consumed, consumed_at)
                     VALUES ($1, $2, $3, (SELECT produced_at FROM production_entries WHERE id = $1))`,
                    [entry.id, bom.component_id, consumed]
                );
                consumptionCount++;
            }
        }
        console.log(`   ✅ ${consumptionCount} consumption records seeded`);

        // ─── 7. PROCUREMENT TRIGGERS ────────────────────────────
        console.log('🔔 Seeding procurement triggers...');
        const triggers = [
            [componentIds[2], 30, 20, 'pending'],    // STM32 - low
            [componentIds[20], 12, 10, 'pending'],   // HC-SR04 - low  
            [componentIds[21], 9, 8, 'ordered'],     // OLED Display
            [componentIds[19], 18, 16, 'ordered'],   // DHT22
            [componentIds[16], 35, 20, 'received'],  // MOSFET
        ];
        for (const [comp_id, stock, threshold, status] of triggers) {
            await client.query(
                `INSERT INTO procurement_triggers (component_id, current_stock, required_threshold, status) 
                 VALUES ($1, $2, $3, $4)`,
                [comp_id, stock, threshold, status]
            );
        }
        console.log(`   ✅ ${triggers.length} procurement triggers seeded`);

        // ─── 8. FUTURE ORDERS ───────────────────────────────────
        console.log('📋 Seeding future orders...');
        const futureOrders = [
            ['Batch Alpha - Q1 Run', pcbIds[0], 100, '2026-03-10', '2026-03-15', 'pending'],
            ['Urgent Sensor Kits', pcbIds[3], 75, '2026-02-25', '2026-02-28', 'pending'],
            ['Motor Controllers Batch', pcbIds[4], 60, '2026-03-28', '2026-04-01', 'pending'],
            ['ESP32 IoT Batch', pcbIds[1], 80, '2026-02-26', '2026-03-01', 'confirmed'],
            ['Old Test Batch', pcbIds[0], 20, '2026-01-12', '2026-01-15', 'completed'],
        ];
        const orderIds = [];
        for (const [name, pcbId, qty, schedDate, delivDate, status] of futureOrders) {
            const res = await client.query(
                `INSERT INTO future_orders (order_name, pcb_type_id, quantity_required, scheduled_production_date, delivery_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [name, pcbId, qty, schedDate, delivDate, status]
            );
            orderIds.push(res.rows[0].id);
        }

        // Order items
        const orderItems = [
            [orderIds[0], pcbIds[0], 100],  // Arduino x100
            [orderIds[0], pcbIds[5], 50],   // PSU x50
            [orderIds[1], pcbIds[3], 75],   // Sensor Shield x75
            [orderIds[1], pcbIds[2], 30],   // STM32 x30
            [orderIds[2], pcbIds[4], 60],   // Motor Driver x60
            [orderIds[3], pcbIds[1], 80],   // ESP32 x80
            [orderIds[4], pcbIds[0], 20],   // Arduino x20 (completed)
        ];
        for (const [order_id, pcb_id, qty] of orderItems) {
            await client.query(
                `INSERT INTO order_items (order_id, pcb_type_id, quantity_required) VALUES ($1, $2, $3)`,
                [order_id, pcb_id, qty]
            );
        }
        console.log(`   ✅ ${futureOrders.length} future orders with ${orderItems.length} items seeded`);

        // ─── 9. AUDIT LOGS ──────────────────────────────────────
        console.log('📝 Seeding audit logs...');
        const adminUser = await client.query("SELECT id FROM users WHERE username = 'admin'");
        const adminId = adminUser.rows[0]?.id;
        const auditActions = [
            ['LOGIN', 'User admin logged in successfully', '192.168.1.1'],
            ['COMPONENT_CREATE', 'Created component ATmega328P Microcontroller', '192.168.1.1'],
            ['COMPONENT_CREATE', 'Created component ESP32-WROOM-32 Module', '192.168.1.1'],
            ['PCB_CREATE', 'Created PCB type Arduino Nano Clone', '192.168.1.1'],
            ['PCB_CREATE', 'Created PCB type ESP32 Dev Board', '192.168.1.1'],
            ['BOM_UPDATE', 'Added 9 components to Arduino Nano Clone BOM', '192.168.1.1'],
            ['PRODUCTION_RUN', 'Produced 50 units of Arduino Nano Clone. Entry ID: 1', '192.168.1.2'],
            ['PRODUCTION_RUN', 'Produced 30 units of ESP32 Dev Board. Entry ID: 2', '192.168.1.2'],
            ['PROCUREMENT_UPDATE', 'Marked OLED Display trigger as ordered', '192.168.1.1'],
            ['EXCEL_IMPORT', 'Imported 25 components via Excel upload', '192.168.1.3'],
            ['USER_CREATE', 'Created user operator1 with role operator', '192.168.1.1'],
            ['LOGIN', 'User operator1 logged in successfully', '192.168.1.4'],
            ['PRODUCTION_RUN', 'Produced 45 units of Arduino Nano Clone. Entry ID: 8', '192.168.1.4'],
            ['COMPONENT_UPDATE', 'Updated stock for LM7805 Voltage Regulator', '192.168.1.1'],
            ['PROCUREMENT_UPDATE', 'Marked MOSFET IRF540N trigger as received', '192.168.1.1'],
        ];
        for (const [action, details, ip] of auditActions) {
            await client.query(
                `INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
                [adminId, action, details, ip]
            );
        }
        console.log(`   ✅ ${auditActions.length} audit log entries seeded`);

        // ─── COMMIT ─────────────────────────────────────────────
        await client.query('COMMIT');
        console.log('\n🎉 Database seeding complete!\n');
        console.log('   Login credentials:');
        console.log('   ├─ admin / admin123 (admin role)');
        console.log('   ├─ operator1 / operator123 (operator role)');
        console.log('   └─ viewer1 / viewer123 (viewer role)\n');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        await db.pool.end();
    }
}

seed();
