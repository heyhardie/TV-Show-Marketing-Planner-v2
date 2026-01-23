export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Attempt to serve the static asset from the KV/Assets binding
    let response = await env.ASSETS.fetch(request);
    
    // For Single Page Applications (SPA):
    // If the request results in a 404 (file not found) and it's not a request for a file (has no extension),
    // serve index.html to let the client-side router handle it.
    if (response.status === 404 && !url.pathname.includes('.')) {
      response = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
    }
    
    return response;
  },
};