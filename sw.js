// sw.js
const CACHE_NAME = 'jadwal-piket-cache-v1';
const urlsToCache = [
    '/pwa-jadwal-piket/', // Cache halaman root dari scope
    '/pwa-jadwal-piket/index.html',
    '/pwa-jadwal-piket/style.css',
    '/pwa-jadwal-piket/script.js',
    '/pwa-jadwal-piket/manifest.json',
    '/pwa-jadwal-piket/icons/icon-192x192.png',
    '/pwa-jadwal-piket/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Menginstall...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching assets');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('Service Worker: Gagal cache assets saat install', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Mengaktifkan...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Menghapus cache lama', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('notificationclick', event => {
    console.log('Notifikasi diklik:', event.notification.tag);
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : self.registration.scope;
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});