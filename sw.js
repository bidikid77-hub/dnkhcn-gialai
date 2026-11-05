// Service Worker hỗ trợ cài đặt App Android / PWA
const CACHE_NAME = 'dnkhcn-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network first strategy
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
