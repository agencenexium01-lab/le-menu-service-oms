// public/sw.js
const CACHE_NAME = 'lms-oms-v2'; // Incrémenté en v2 pour forcer la mise à jour
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes (Stratégie Network-First avec fallback sécurisé)
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET et les requêtes Firebase / Auth / API
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('firestore') || 
    event.request.url.includes('identitytoolkit') ||
    event.request.url.includes('securetoken')
  ) {
    return;
  }

  // Ne pas intercepter le schéma chrome-extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache seulement les réponses réseau valides
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // 1. Tenter de récupérer la ressource exacte du cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. Si c'est une navigation de page (ex: /connexion) et qu'elle n'est pas en cache,
        // renvoyer /index.html (essentiel pour les SPA React / Vite)
        if (event.request.mode === 'navigate') {
          const indexPage = await caches.match('/index.html');
          if (indexPage) {
            return indexPage;
          }
        }

        // 3. Fallback final pour éviter le crash "Failed to convert value to Response"
        return new Response('Connexion réseau indisponible', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
        });
      })
  );
});