const axios = require('axios');

// ANSI Color Codes
const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m';
const GREEN_BG = '\x1b[42m';
const YELLOW_BG = '\x1b[43m';
const RED_BG = '\x1b[41m';
const BLACK_FG = '\x1b[30m';

async function showTerminalHeatmap() {
    console.log('\nFetching Heatmap Data...\n');

    try {
        // 1. Auth
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        const token = login.data.token;

        // 2. Fetch Data
        const res = await axios.get('http://localhost:5000/api/analytics/heatmap-data', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data;
        const totalVolume = data.reduce((acc, item) => acc + item.total_consumed, 0);

        console.log(`\n${BRIGHT}INVENTORY HEATMAP (CLI VERSION)${RESET}`);
        console.log(`Total Consumption Volume: ${totalVolume}\n`);

        // 3. Render
        data.sort((a, b) => b.total_consumed - a.total_consumed).forEach(item => {
            // Determine Color
            let color = RED_BG; // Critical
            if (item.status === 'safe') color = GREEN_BG;
            else if (item.status === 'warning') color = YELLOW_BG;

            // Determine Size (Bar length)
            // Scale: Max 50 chars for the largest item
            const maxVal = data[0].total_consumed || 1;
            const length = Math.max(1, Math.round((item.total_consumed / maxVal) * 50));
            const bar = ' '.repeat(length);

            console.log(`${color}${BLACK_FG} ${item.name.padEnd(20)} ${RESET}  ${'█'.repeat(length)} (${item.total_consumed})`);
            console.log(`   Status: ${item.status.toUpperCase()} | Stock: ${item.stock_percentage}%`);
            console.log('');
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
}

showTerminalHeatmap();
