const axios = require('axios');

// Using axios-cookie-jar-support if needed, but bearer token is enough
const API_URL = 'http://localhost:5000/api';

async function testApi() {
    try {
        console.log('--- API TEST START ---');

        // 0. Login
        console.log('Logging in...');
        let token = '';
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                username: 'admin',
                password: 'password123'
            });
            token = loginRes.data.token;
            console.log('Login Successful (password123). Token acquired.');
        } catch (e) {
            console.log('First login failed, trying admin123...');
            try {
                const loginRes = await axios.post(`${API_URL}/auth/login`, {
                    username: 'admin',
                    password: 'admin123'
                });
                token = loginRes.data.token;
                console.log('Login Successful (admin123). Token acquired.');
            } catch (e2) {
                console.error('Login Failed:', e2.response?.data || e2.message);
                return;
            }
        }

        // Set Auth Header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // 1. Get PCBs to find a valid ID
        console.log('Fetching PCBs...');
        const pcbs = await axios.get(`${API_URL}/pcbs`);
        console.log(`Found ${pcbs.data.length} PCBs.`);
        const validPcb = pcbs.data[0];
        if (!validPcb) {
            console.error('No PCBs found. Cannot test.');
            return;
        }
        console.log(`Using PCB: ${validPcb.name} (ID: ${validPcb.id})`);

        // 2. Test Estimate Date
        console.log('Testing Estimate Date...');
        try {
            // Note: Estimate Date might expect array of items
            const estPayload = {
                items: [{ pcb_type_id: validPcb.id, quantity_required: 10 }]
            };
            const estRes = await axios.post(`${API_URL}/future-orders/estimate-date`, estPayload);
            console.log('Estimate Success:', estRes.data);
        } catch (e) {
            console.error('Estimate Failed:', e.response?.data || e.message);
        }

        // 3. Test Create Order
        console.log('Testing Create Order...');
        const orderName = `Test Order ${Date.now()}`;
        const createPayload = {
            order_name: orderName,
            delivery_date: '2026-12-31',
            status: 'pending',
            items: [{ pcb_type_id: validPcb.id, quantity_required: 10 }]
        };

        try {
            const createRes = await axios.post(`${API_URL}/future-orders`, createPayload);
            console.log('Create Order Success:', createRes.data);
            const newOrderId = createRes.data.id;

            // 4. Verify Order Items
            console.log('Verifying Order via getOrders...');
            const ordersRes = await axios.get(`${API_URL}/future-orders`);
            const createdOrder = ordersRes.data.find(o => o.id === newOrderId);

            if (createdOrder) {
                console.log('Order Found in List.');
                console.log('Order Items:', createdOrder.items);
                if (createdOrder.items && createdOrder.items.length > 0) {
                    console.log('SUCCESS: Order Items present.');
                } else {
                    console.log('FAILURE: Order Items MISSING.');
                }
            } else {
                console.log('FAILURE: Order NOT found in list.');
            }

        } catch (e) {
            console.error('Create Order Failed:', e.response?.data || e.message);
            console.error('Status:', e.response?.status);
            console.error('Headers:', e.response?.headers);
        }

        console.log('--- API TEST END ---');
    } catch (err) {
        console.error('Test Script Error:', err.message);
    }
}

testApi();
