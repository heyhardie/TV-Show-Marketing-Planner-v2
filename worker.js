export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Function to inject the API Key into HTML
    const injectKey = async (response) => {
      const text = await response.text();
      // Replace the placeholder with the actual Secret from Cloudflare environment
      // If env.API_KEY is undefined, we leave it empty to be handled by client logic
      const apiKey = env.API_KEY || ""; 
      const newText = text.replace('__CLOUDFLARE_RUNTIME_API_KEY__', apiKey);
      
      const newHeaders = new Headers(response.headers);
      // Prevent caching of the HTML so the key injection always runs
      newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newHeaders.delete('ETag');
      
      return new Response(newText, {
        headers: newHeaders,
        status: response.status,
        statusText: response.statusText
      });
    };

    // Attempt to serve the static asset
    let response = await env.ASSETS.fetch(request);
    
    // If it's the index.html (root), inject the key
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return injectKey(response);
    }

    // Handle SPA Routing (404s -> index.html)
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexResponse = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
      return injectKey(indexResponse);
    }
    
    return response;
  },
};