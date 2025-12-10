export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Whitelist System Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #60a5fa; }
            .card { background: #1e293b; padding: 25px; border-radius: 10px; margin: 20px 0; text-align: left; }
            .endpoint { background: #334155; padding: 15px; border-radius: 5px; margin: 10px 0; }
            code { background: #475569; padding: 2px 6px; border-radius: 3px; }
            a { color: #93c5fd; text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔐 Whitelist System Dashboard</h1>
            <p>Your script store whitelist system is running!</p>
            
            <div class="card">
                <h2>📊 API Endpoints</h2>
                <div class="endpoint">
                    <strong>Validate License</strong><br>
                    <code>POST /api/license/validate</code><br>
                    Body: <code>{"license_key": "YOUR_KEY", "hwid": "optional"}</code>
                </div>
                <div class="endpoint">
                    <strong>Generate License</strong><br>
                    <code>POST /api/license/generate</code><br>
                    Body: <code>{"product_id": "...", "customer_id": "..."}</code>
                </div>
                <div class="endpoint">
                    <strong>Test API</strong><br>
                    <code>GET /api/test</code>
                </div>
            </div>
            
            <div class="card">
                <h2>📋 Quick Start</h2>
                <ol>
                    <li>Add Supabase credentials to Vercel Environment Variables</li>
                    <li>Create products in Supabase 'products' table</li>
                    <li>Add customers in 'customers' table</li>
                    <li>Use the API to generate licenses</li>
                    <li>Give license keys to buyers</li>
                </ol>
            </div>
            
            <div class="card">
                <h2>🔗 Test Now</h2>
                <p>Copy and run in terminal:</p>
                <code>curl -X POST https://whitelist-system.vercel.app/api/license/validate -H "Content-Type: application/json" -d '{"license_key":"TEST"}'</code>
            </div>
        </div>
    </body>
    </html>
  `);
}
