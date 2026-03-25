// Self-destructing Service Worker to fix aggressive Vercel caching
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => caches.delete(key)));
        }).then(() => {
            self.registration.unregister();
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Do nothing, let the network handle it
});
