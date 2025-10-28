// Service Worker for Jap Jap! Card Game
// Enables offline functionality for PWA

const CACHE_NAME = 'jap-jap-v1';
const urlsToCache = [
  './',
  './index.html',
  './index.fr.html',
  './manifest.json',
  './japjap.js',
  './cards.js',
  './example.css',
  './jquery-1.7.min.js',
  './img/cards.png',
  './img/icon-72x72.png',
  './img/icon-96x96.png',
  './img/icon-128x128.png',
  './img/icon-144x144.png',
  './img/icon-152x152.png',
  './img/icon-192x192.png',
  './img/icon-384x384.png',
  './img/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }
        
        // Cache miss - fetch from network
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(error => {
        console.error('[Service Worker] Fetch failed:', error);
        // You could return a custom offline page here
        throw error;
      })
  );
});

// Message event - for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
