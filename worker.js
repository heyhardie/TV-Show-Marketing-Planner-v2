export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Function to inject the API Key into HTML
    const injectKey = async (response) => {
      const text = await response.text();
      
      const apiKey = env.API_KEY || ""; 
      const newText = text.replace('__CLOUDFLARE_RUNTIME_API_KEY__', apiKey);
      
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newHeaders.set('X-Worker-Status', 'Injected'); // Debug header
      newHeaders.delete('ETag');
      newHeaders.delete('Last-Modified');
      
      return new Response(newText, {
        headers: newHeaders,
        status: response.status,
        statusText: response.statusText
      });
    };

    // Determine if this looks like a request for an HTML page
    // We check URL path AND Accept header to be safe
    const acceptHeader = request.headers.get('Accept');
    const isHtmlRequest = url.pathname === '/' || 
                          url.pathname === '/index.html' || 
                          (!url.pathname.includes('.') && !url.pathname.startsWith('/api')) ||
                          (acceptHeader && acceptHeader.includes('text/html'));

    let requestToFetch = request;

    if (isHtmlRequest) {
      const newHeaders = new Headers(request.headers);
      // Force fresh content from origin/ASSETS
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
        // Fallback if ASSETS fails
        return new Response("Internal Worker Error: " + e.message, { status: 500 });
    }
    
    // Handle SPA Routing: If 404 and not a file extension, try serving index.html
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexRequest = new Request(`${url.origin}/index.html`, {
          headers: requestToFetch.headers
      });
      const indexResponse = await env.ASSETS.fetch(indexRequest);
      // Only use the index response if it was actually found
      if (indexResponse.status === 200) {
        response = indexResponse;
      }
    }

    // Check if the response is HTML. If so, inject the key.
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      return injectKey(response);
    }
    
    return response;
  },
};