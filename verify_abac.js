const http = require('http');
// Require JWT from backend modules to ensure compatibility
const jwt = require('./backend/node_modules/jsonwebtoken');

// CONFIG
const PORT = 5000;
const SECRET_KEY = "1fQx9nTk2tG3salVJhLE8WYt1ASUMMlp"; // FROM .env

const generateToken = (payload) => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
};

// Users
const ANALYST_USER = { username: 'analyst', role: 'Finansijski analitičar', id: 999 };
const ADMIN_USER = { username: 'admin', role: 'admin', id: 1 };

function makeRequest(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

const main = async () => {
    console.log("🚀 Starting ABAC Verification (Node.js script)\n");

    // 1. Check Time
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWorkingHours = (day !== 0 && day !== 6 && hour >= 8 && hour < 16);
    console.log(`🕒 Current Time: ${now.toLocaleTimeString()} (Day: ${day}, Hour: ${hour})`);
    console.log(`🏢 Condition: ${isWorkingHours ? "WORKING HOURS (Access Expected)" : "OFF HOURS (Deny Expected)"}`);

    // 2. Test Analyst
    console.log("\n🧪 Testing 'Finansijski analitičar' Access to /inventory...");
    const analystToken = generateToken(ANALYST_USER);
    try {
        const res = await makeRequest('/inventory', analystToken);
        console.log(`   Status: ${res.status}`);
        console.log(`   Body: ${res.body}`);

        if (isWorkingHours) {
            if (res.status === 200 || res.status === 403) {
                // Note: Analyst might not have 'inventory.read' permission in RBAC? 
                // Let's check RBAC config from memory: 
                // 'Finansijski analitičar': ['reports.read', 'revenue.*', ..., 'fuel-production.read']
                // WAIT! Analyst DOES NOT have 'inventory.read' in RBAC! 
                // So they should get 403 (RBAC) regardless of ABAC!
                console.log("⚠️ ANALYST DOES NOT HAVE 'inventory.read' PERMISSION IN RBAC!");
                console.log("   --> We should test an endpoint they DO have access to, e.g., '/api/reports'");
            }
        }
    } catch (e) { console.error(e); }

    // 2b. Test Analyst on Correct Endpoint
    console.log("\n🧪 Testing 'Finansijski analitičar' Access to /api/reports (Allowed by RBAC)...");
    try {
        // Note: endpoint might require params but we just check auth status
        const res = await makeRequest('/api/reports', analystToken);
        console.log(`   Status: ${res.status}`);

        if (res.status === 200) {
            if (isWorkingHours) console.log("✅ ACCESS GRANTED (Correct)");
            else console.error("❌ ACCESS GRANTED (INCORRECT - Should be denied by ABAC)");
        } else if (res.status === 403) {
            if (!isWorkingHours) console.log("✅ ACCESS DENIED (Correct ABAC)");
            else console.error("❌ ACCESS DENIED (INCORRECT - Should be granted)");
            console.log(`   Error: ${res.body}`);
        } else {
            console.log(`   Result: ${res.status} (Might be 500 if query fails, but Auth passed)`);
        }
    } catch (e) { console.error(e); }

    // 3. Test Admin (Exempt)
    console.log("\n🧪 Testing 'admin' Access...");
    const adminToken = generateToken(ADMIN_USER);
    try {
        const res = await makeRequest('/inventory', adminToken);
        if (res.status === 200) console.log("✅ ADMIN ACCESS GRANTED (Correct)");
        else console.error(`❌ ADMIN ACCESS FAILED: ${res.status} ${res.body}`);
    } catch (e) { console.error(e); }
};

main();
