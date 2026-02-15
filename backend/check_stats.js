const db = require('./config/db');
require('dotenv').config();

const run = async () => {
    try {
        console.log("--- CHECKING COMPONENT STATS ---");

        // 1. Check counts
        const criticalCount = await db.query('SELECT COUNT(*) FROM components WHERE current_stock < (monthly_required_quantity * 0.2)');
        console.log("Critical Count (Query):", criticalCount.rows[0].count);

        const lowCount = await db.query('SELECT COUNT(*) FROM components WHERE current_stock < (monthly_required_quantity * 0.5) AND current_stock >= (monthly_required_quantity * 0.2)');
        console.log("Low Stock Count (Query):", lowCount.rows[0].count);

        // 2. List Critical Items to see WHY
        const criticalItems = await db.query('SELECT id, name, current_stock, monthly_required_quantity FROM components WHERE current_stock < (monthly_required_quantity * 0.2)');
        console.log("Actual Critical Items:", criticalItems.rows.length);
        if (criticalItems.rows.length > 0) {
            console.table(criticalItems.rows);
        } else {
            console.log("No items match critical criteria.");
        }

        // 3. Check items that LOOK critical but might be missed (e.g. nulls)
        const weirdItems = await db.query('SELECT id, name, current_stock, monthly_required_quantity FROM components WHERE monthly_required_quantity > 0 AND (current_stock * 1.0 / monthly_required_quantity) < 0.2');
        console.log("Calculated Critical Items (Manual Division):", weirdItems.rows.length);
        if (weirdItems.rows.length > 0) {
            console.table(weirdItems.rows);
        }

        // 4. Check items causing confusion (e.g. stock 0, monthly 0)
        // If monthly is 0, they are rarely critical.

    } catch (err) {
        console.error(err);
    } finally {
        // Close pool if needed, but db module uses pool
        process.exit();
    }
};

run();
