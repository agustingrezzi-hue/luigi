/* El teléfono se guarda la app. Abrir deja de depender de la red: se muestra
   lo que ya tiene y, por detrás, se baja la versión nueva.
   Los datos NO pasan por acá: van siempre y directo a la planilla. */
const CACHE = 'luigi-4';
const BASICOS = ['./', './index.html', './manifest.webmanifest',
                 './icono-192.png', './icono-512.png'];

self.addEventListener('install', e => {
  /* de a uno: si un archivo falla, el resto se guarda igual. Con addAll, uno
     solo que falle tira abajo la instalación entera y la app queda sin worker. */
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(BASICOS.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
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

  const bajada = revalidar(e.request);
  /* Esto es lo que faltaba. Sin waitUntil, apenas contestamos con la copia
     guardada el navegador puede apagar el worker, y la bajada de la versión
     nueva queda a mitad de camino: la app se queda pegada a la copia vieja
     para siempre. Pasó el 21/9 y no se arreglaba ni reinstalando. */
  e.waitUntil(bajada);
  e.respondWith(responder(e.request, bajada));
});

/* baja la versión de la red, la guarda y avisa si cambió */
async function revalidar(req){
  try {
    const res = await fetch(req);
    if (!res || !res.ok) return res || null;
    const cache = await caches.open(CACHE);
    const copia = res.clone();
    if (esLaApp(req)){
      const guardado = await cache.match(req, {ignoreSearch: true});
      if (guardado){
        const nuevo = await copia.clone().text();
        const viejo = await guardado.clone().text();
        if (nuevo !== viejo) avisarNueva();
      }
    }
    await cache.put(req, copia);
    return res;
  } catch (e){ return null; }
}

/* primero lo que ya tenemos: la app abre al toque aunque no haya señal */
async function responder(req, bajada){
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(req, {ignoreSearch: true});
  if (guardado) return guardado;
  return (await bajada) || new Response('Sin conexión', {status: 503});
}

function esLaApp(req){
  const p = new URL(req.url).pathname;
  return req.mode === 'navigate' || p.endsWith('/') || p.endsWith('index.html');
}

async function avisarNueva(){
  const abiertas = await self.clients.matchAll({type: 'window'});
  abiertas.forEach(c => c.postMessage({nueva: true}));
}
