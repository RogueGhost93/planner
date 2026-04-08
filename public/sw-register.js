/**
 * Module: Service Worker Registration
 * Purpose: Extracted from index.html to avoid CSP inline-script violations.
 *          Handles seamless updates via controllerchange.
 * Dependencies: none
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });

  // Seamless update: new SW has called skipWaiting() + clients.claim()
  // → controller changes → reload page for a consistent state
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
