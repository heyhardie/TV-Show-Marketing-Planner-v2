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

    // 1. Fetch the requested asset
    let response = await env.ASSETS.fetch(request);
    
    // 2. Handle SPA Routing: If 404 and not a file extension, serve index.html
    if (response.status === 404 && !url.pathname.includes('.')) {
      response = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
    }

    // 3. Check if the response is HTML. If so, inject the key.
    // This is safer than checking URL paths as it covers root, subpaths, and index.html explicitly.
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      return injectKey(response);
    }
    
    return response;
  },
};