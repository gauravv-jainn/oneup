const db = require('../config/db');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Import Components
exports.importComponents = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let successCount = 0;
        let errors = [];

        for (const [index, row] of data.entries()) {
            // Expected columns: Name, Part Number, Current Stock, Monthly Required
            const name = row['Component Name'] || row['name'];
            const partNumber = row['Part Number'] || row['part_number'];
            const stock = row['Current Stock'] || row['current_stock'];
            const monthlyReq = row['Monthly Required Quantity'] || row['monthly_required_quantity'];

            if (!name || !partNumber || stock === undefined || monthlyReq === undefined) {
                errors.push(`Row ${index + 2}: Missing required fields`);
                continue;
            }

            try {
                // Upsert or Insert (For now, valid insert only)
                await db.query(
                    'INSERT INTO components (name, part_number, current_stock, monthly_required_quantity) VALUES ($1, $2, $3, $4) ON CONFLICT (part_number) DO UPDATE SET current_stock = $3, monthly_required_quantity = $4, updated_at = CURRENT_TIMESTAMP',
                    [name, partNumber, stock, monthlyReq]
                );
                successCount++;
            } catch (err) {
                errors.push(`Row ${index + 2} (${partNumber}): ${err.message}`);
            }
        }

        // Cleanup uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Import processing complete',
            totalProcessed: data.length,
            successCount,
            errors
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during import' });
    }
};

// Export Components
exports.exportComponents = async (req, res) => {
    try {
        const result = await db.query('SELECT name, part_number, current_stock, monthly_required_quantity FROM components ORDER BY name ASC');

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(result.rows);
        xlsx.utils.book_append_sheet(wb, ws, 'Components');

        const fileName = `inventory_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../uploads', fileName);

        xlsx.writeFile(wb, filePath);

        res.download(filePath, fileName, (err) => {
            if (err) console.error(err);
            fs.unlinkSync(filePath); // Delete after download
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Export Consumption Report
exports.exportConsumption = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.name, c.part_number, SUM(ch.quantity_consumed) as total_consumed, MAX(ch.consumed_at) as last_used
             FROM consumption_history ch
             JOIN components c ON ch.component_id = c.id
             GROUP BY c.id, c.name, c.part_number`
        );

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(result.rows);
        xlsx.utils.book_append_sheet(wb, ws, 'Consumption');

        const fileName = `consumption_report_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, '../uploads', fileName);

        xlsx.writeFile(wb, filePath);

        res.download(filePath, fileName, (err) => {
            if (err) console.error(err);
            fs.unlinkSync(filePath);
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
