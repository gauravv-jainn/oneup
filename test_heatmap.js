const axios = require('axios');

async function checkHeatmap() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Fetch Heatmap Data
        const heatmapRes = await axios.get('http://localhost:5000/api/analytics/heatmap-data', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Heatmap Data:', JSON.stringify(heatmapRes.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

checkHeatmap();
