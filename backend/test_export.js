const api = require('axios');
require('dotenv').config();

const testExport = async () => {
    try {
        console.log("--- TESTING EXPORT ---");
        // Login first
        const loginRes = await api.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log("Token obtained.");

        // Hit export endpoint
        const exportRes = await api.get('http://localhost:5000/api/excel/export/inventory?format=xlsx', {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer' // expecting binary
        });

        console.log("Export Status:", exportRes.status);
        console.log("Content-Type:", exportRes.headers['content-type']);
        console.log("Length:", exportRes.data.length);

        if (exportRes.status === 200 && exportRes.data.length > 0) {
            console.log("SUCCESS: Export returned data.");
        } else {
            console.log("FAILURE: Export failed or empty.");
        }

    } catch (e) {
        console.error("Export Failed:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", e.response.data.toString());
        }
    }
};

testExport();
