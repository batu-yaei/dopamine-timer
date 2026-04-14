// sw.js — Dopamine Timer Service Worker
const CACHE = 'dopamine-v1';
const ASSETS = ['./index.html'];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    // Eski cache versiyonlarını temizle
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => clients.claim())
    );
});

self.addEventListener('fetch', e => {
    // Sadece same-origin GET isteklerini cache'le
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            // Cache varsa kullan, yoksa network'ten al ve cache'e ekle
            const networkFetch = fetch(e.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone));
                }
                return response;
            }).catch(() => cached); // Network yoksa cache'e düş
            return cached || networkFetch;
        })
    );
});
