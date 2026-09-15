/* El teléfono se guarda la app. Abrir deja de depender de la red: se muestra
   lo que ya tiene y, por detrás, mira si hay una versión nueva.
   Los datos NO pasan por acá: van siempre y directo a la planilla. */
const CACHE = 'luigi-3';
const BASICOS = ['./', './index.html', './manifest.webmanifest',
                 './icono-192.png', './icono-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const viejos = (await caches.keys()).filter(k => k !== CACHE);
    await Promise.all(viejos.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  /* todo lo que no sea nuestro (la planilla, las tipografías) va derecho a la red */
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(servir(e.request));
});

async function servir(req){
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(req, {ignoreSearch: true});

  const red = fetch(req).then(async res => {
    if (!res || !res.ok) return res;
    if (esLaApp(req) && guardado){
      const nuevo = await res.clone().text();
      const viejo = await guardado.clone().text();
      if (nuevo !== viejo) avisarNueva();
    }
    await cache.put(req, res.clone());
    return res;
  }).catch(() => null);

  /* primero lo que ya tenemos: la app abre al toque aunque no haya señal */
  return guardado || (await red) || new Response('Sin conexión', {status: 503});
}

function esLaApp(req){
  const p = new URL(req.url).pathname;
  return req.mode === 'navigate' || p.endsWith('/') || p.endsWith('index.html');
}

async function avisarNueva(){
  const abiertas = await self.clients.matchAll({type: 'window'});
  abiertas.forEach(c => c.postMessage({nueva: true}));
}
