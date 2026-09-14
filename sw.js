/* Lo mínimo para que Chrome la considere una app instalable.
   No guarda nada en caché: los datos siguen viniendo siempre de tu planilla. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) { e.respondWith(fetch(e.request)); });
