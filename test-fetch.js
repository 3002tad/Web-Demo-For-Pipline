const fetch = require('node-fetch'); // wait I can use fetch directly in newer Node
fetch('http://100.64.0.3:3100/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        event_source: 'browser_sdk',
        event_category: 'behavior',
        event_type: 'page_view',
        anonymous_id: 'auto_123',
        session_id: 'sess_123',
        page_url: '/'
    })
}).then(r => r.text()).then(console.log).catch(console.error);
