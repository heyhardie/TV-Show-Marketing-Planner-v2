export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- ANALYTICS API ENDPOINT ---
    if (url.pathname === '/api/analytics/track' && request.method === 'POST') {
      try {
        const body = await request.json();
        const eventType = body.type; // 'view' or 'report'
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // 1. Increment Event Counter
        const countKey = `stats:${date}:${eventType}`;
        await env.ANALYTICS.put(countKey, (parseInt(await env.ANALYTICS.get(countKey) || '0') + 1).toString());

        // 2. Handle Unique Visitors (Daily)
        if (eventType === 'view') {
          const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
          // Simple hash of IP + Date to anonymity
          const encoder = new TextEncoder();
          const data = encoder.encode(ip + date);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          const visitorKey = `visitor:${date}:${ipHash}`;
          const hasVisited = await env.ANALYTICS.get(visitorKey);

          if (!hasVisited) {
            // New unique visitor for today
            await env.ANALYTICS.put(visitorKey, '1', { expirationTtl: 86400 * 2 }); // Expire after 2 days
            const uniqueKey = `stats:${date}:unique`;
            await env.ANALYTICS.put(uniqueKey, (parseInt(await env.ANALYTICS.get(uniqueKey) || '0') + 1).toString());
          }
        }

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // --- ADMIN DASHBOARD ---
    if (url.pathname === '/admin/stats') {
      const providedKey = url.searchParams.get('key');
      const validKey = env.API_KEY;

      // AUTH LOGIN SCREEN
      if (!validKey || providedKey !== validKey) {
        const loginHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Admin Login</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>body { background-color: #111827; color: #e5e7eb; }</style>
          </head>
          <body class="h-screen flex items-center justify-center p-4">
            <div class="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700 w-full max-w-md">
              <h1 class="text-xl font-bold text-white mb-6 text-center">Admin Access</h1>
              <form onsubmit="event.preventDefault(); window.location.href = '/admin/stats?key=' + document.getElementById('key').value">
                <label class="block text-sm font-medium text-gray-400 mb-2">Enter API Key</label>
                <input type="password" id="key" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none mb-6" placeholder="sk-..." required autofocus>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors">
                  Access Dashboard
                </button>
              </form>
              <div class="mt-4 text-center">
                <a href="/" class="text-sm text-gray-500 hover:text-gray-300">← Back to App</a>
              </div>
            </div>
          </body>
          </html>
        `;
        return new Response(loginHtml, { headers: { 'Content-Type': 'text/html' }, status: 200 });
      }

      // DATA FETCHING & DASHBOARD RENDER
      const rows = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Fetch in parallel
        const [views, unique, reports] = await Promise.all([
          env.ANALYTICS.get(`stats:${dateStr}:view`),
          env.ANALYTICS.get(`stats:${dateStr}:unique`),
          env.ANALYTICS.get(`stats:${dateStr}:report`)
        ]);

        rows.push({
          date: dateStr,
          views: views || 0,
          unique: unique || 0,
          reports: reports || 0
        });
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Analytics | TV Marketer</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>body { background-color: #111827; color: #e5e7eb; }</style>
        </head>
        <body class="p-8 max-w-4xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-indigo-400">Analytics Dashboard</h1>
            <a href="/" class="text-sm text-gray-400 hover:text-white">Back to App</a>
          </div>
          
          <div class="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
            <table class="w-full text-left">
              <thead class="bg-gray-900 text-gray-400 uppercase text-xs font-semibold">
                <tr>
                  <th class="px-6 py-4">Date</th>
                  <th class="px-6 py-4">Unique Visitors</th>
                  <th class="px-6 py-4">Page Views</th>
                  <th class="px-6 py-4 text-green-400">Reports Generated</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                ${rows.map(row => `
                  <tr class="hover:bg-gray-700/50 transition-colors">
                    <td class="px-6 py-4 font-mono text-sm">${row.date}</td>
                    <td class="px-6 py-4">${row.unique}</td>
                    <td class="px-6 py-4 text-gray-400">${row.views}</td>
                    <td class="px-6 py-4 font-bold text-green-400">${row.reports}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `;

      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    // --- STANDARD APP LOGIC ---
    
    // Function to inject the API Key into HTML
    const injectKey = async (response) => {
      const text = await response.text();
      const apiKey = env.API_KEY || ""; 
      const newText = text.replace('__CLOUDFLARE_RUNTIME_API_KEY__', apiKey);
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newHeaders.delete('ETag');
      
      return new Response(newText, {
        headers: newHeaders,
        status: response.status,
        statusText: response.statusText
      });
    };

    // Standard HTML Request Logic
    const acceptHeader = request.headers.get('Accept');
    const isHtmlRequest = url.pathname === '/' || 
                          url.pathname === '/index.html' || 
                          (!url.pathname.includes('.') && !url.pathname.startsWith('/api')) ||
                          (acceptHeader && acceptHeader.includes('text/html'));

    let requestToFetch = request;
    if (isHtmlRequest) {
      const newHeaders = new Headers(request.headers);
      newHeaders.delete('If-None-Match');
      newHeaders.delete('If-Modified-Since');
      requestToFetch = new Request(request.url, {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        redirect: request.redirect
      });
    }

    let response;
    try {
        response = await env.ASSETS.fetch(requestToFetch);
    } catch (e) {
        return new Response("Internal Worker Error: " + e.message, { status: 500 });
    }
    
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexRequest = new Request(`${url.origin}/index.html`, { headers: requestToFetch.headers });
      const indexResponse = await env.ASSETS.fetch(indexRequest);
      if (indexResponse.status === 200) response = indexResponse;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      return injectKey(response);
    }
    
    return response;
  },
};