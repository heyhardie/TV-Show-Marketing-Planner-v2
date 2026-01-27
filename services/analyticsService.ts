
export const trackEvent = async (type: 'view' | 'report') => {
  // Only track in production (when running on custom domain or workers.dev)
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    console.debug(`[Analytics-Dev] Skipped tracking '${type}'`);
    return;
  }

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
  } catch (e) {
    // Fail silently, analytics shouldn't break the app
    console.warn("Analytics Error", e);
  }
};
