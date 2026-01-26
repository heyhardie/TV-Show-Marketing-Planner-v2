export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Function to inject the API Key into HTML
    const injectKey = async (response) => {
      // If the response is not 200 (e.g. 304, 404, 500), we might not be able to inject.
      // However, we force 200 via request headers below.
      const text = await response.text();
      
      // Replace the placeholder with the actual Secret from Cloudflare environment
      const apiKey = env.API_KEY || ""; 
      const newText = text.replace('__CLOUDFLARE_RUNTIME_API_KEY__', apiKey);
      
      const newHeaders = new Headers(response.headers);
      // Prevent caching of the HTML so the key injection always runs on future reloads
      newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newHeaders.delete('ETag');
      newHeaders.delete('Last-Modified');
      
      return new Response(newText, {
        headers: newHeaders,
        status: response.status,
        statusText: response.statusText
      });
    };

    // Determine if this looks like a request for an HTML page
    // We want to intercept root (/), index.html, and SPA routes (no extension)
    const isHtmlRequest = url.pathname === '/' || 
                          url.pathname === '/index.html' || 
                          (!url.pathname.includes('.') && !url.pathname.startsWith('/api'));

    let requestToFetch = request;

    if (isHtmlRequest) {
      // Create a new request without conditional headers (If-None-Match, etc.)
      // This forces the ASSETS binding to return the full file (200 OK) instead of 304 Not Modified.
      // We NEED the full body to perform the string replacement.
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

    // 1. Fetch the requested asset
    let response = await env.ASSETS.fetch(requestToFetch);
    
    // 2. Handle SPA Routing: If 404 and not a file extension, serve index.html
    if (response.status === 404 && !url.pathname.includes('.')) {
      // Fetch index.html explicitly, again forcing fresh content
      const indexRequest = new Request(`${url.origin}/index.html`, {
          headers: requestToFetch.headers
      });
      response = await env.ASSETS.fetch(indexRequest);
    }

    // 3. Check if the response is HTML. If so, inject the key.
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      return injectKey(response);
    }
    
    return response;
  },
};