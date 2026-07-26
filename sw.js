const CACHE_NAME = 'offlinetube-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js'
];

// Enregistrer les fichiers dans le cache de l'iPhone
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Servir les fichiers depuis le cache s'il n'y a pas de réseau
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
