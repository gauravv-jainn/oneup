// Native fetch in Node 18+
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const BASE_URL = 'http://localhost:5000/api';

async function test() {
    console.log("--- TESTING ROUTES ---");

    // 1. Login
    console.log("Logging in...");
    // Attempting login with username instead of email, based on error "Username and password are required"
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        console.error("Login failed:", loginData);
        return;
    }
    const token = loginData.token;
    console.log("Login SUCCESS. Token received.");

    // 2. Test Estimate Date (Renamed)
    console.log("\nTesting POST /future-orders/estimate_date (With Token)...");
    const estRes = await fetch(`${BASE_URL}/future-orders/estimate_date`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            items: [{ pcb_type_id: 1, quantity_required: 10 }]
        })
    });
    console.log(`Status: ${estRes.status}`);
    const txt = await estRes.text();
    console.log("Response Body:", txt);
}

test();
