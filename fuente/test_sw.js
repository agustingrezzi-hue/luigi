/* Lo que se rompió el 21/9: la app instalada nunca se actualizaba.
   Acá se prueba el ciclo entero con un service worker de verdad. */
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');
const servir = require('./servidorcito.js');
const L=(...a)=>console.log(...a); let f=0;
const ok=(c,m)=>{ if(!c){f++;L('  ✗ '+m);} else L('  ✓ '+m); };

const CACHE_TEST = process.env.CACHE_TEST || 'luigi-4';
const DIR = path.join(__dirname, 'sw_prueba');
const pagina = v => `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Prueba</title><link rel="manifest" href="manifest.webmanifest"></head><body>
<h1 id="v">VERSION ${v}</h1>
<script>
window.__nueva = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.nueva) window.__nueva = true;
  });
}
</script></body></html>`;

function armar(v){
  fs.mkdirSync(DIR, {recursive:true});
  fs.writeFileSync(path.join(DIR,'index.html'), pagina(v));
  fs.copyFileSync(path.join(__dirname,'paginita','sw.js'), path.join(DIR,'sw.js'));
  fs.writeFileSync(path.join(DIR,'manifest.webmanifest'), '{"name":"Prueba","start_url":"./"}');
  ['icono-192.png','icono-512.png'].forEach(n =>
    fs.copyFileSync(path.join(__dirname,'paginita',n), path.join(DIR,n)));
}
const version = pg => pg.textContent('#v');
const mandado = pg => pg.evaluate(()=>navigator.serviceWorker.controller ? 'sí' : 'no');

(async () => {
  armar('A');
  const web = await servir(DIR);
  const url = web.base + 'index.html';
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const pg = await ctx.newPage();
  pg.on('console', m => { if (m.type()==='error') console.log('   [consola]', m.text()); });
  pg.on('pageerror', e => console.log('   [error]', e.message));

  L('== 1. la primera vez se guarda ==');
  await pg.goto(url);
  const reg = await pg.evaluate(async () => {
    try { const r = await navigator.serviceWorker.register('sw.js');
          return 'registrado · scope ' + r.scope; }
    catch(e){ return 'FALLÓ: ' + e.message; }
  });
  L('   registro:', reg, '· contexto seguro:', await pg.evaluate(()=>window.isSecureContext));
  await pg.waitForFunction(()=>navigator.serviceWorker.controller !== null, null, {timeout:9000});
  ok(await mandado(pg) === 'sí', 'el service worker toma el control');
  ok((await version(pg)) === 'VERSION A', 'se ve la versión A');

  L('\n== 2. sin señal abre igual ==');
  await ctx.setOffline(true);
  await pg.goto(url);
  ok((await version(pg)) === 'VERSION A', 'sin red, sirve lo guardado');
  await ctx.setOffline(false);

  L('\n== 3. sale una versión nueva ==');
  fs.writeFileSync(path.join(DIR,'index.html'), pagina('B'));
  await pg.goto(url);
  ok((await version(pg)) === 'VERSION A', 'la primera apertura todavía muestra la vieja');
  await pg.waitForTimeout(1500);
  ok(await pg.evaluate(()=>window.__nueva) === true,
     'pero avisa que hay una nueva (el cartel de Actualizar)');
  const enCache = await pg.evaluate(async (nombre) => {
    const c = await caches.open(nombre);
    const r = await c.match('index.html', {ignoreSearch:true});
    return r ? (await r.text()).indexOf('VERSION B') > 0 : false;
  }, CACHE_TEST);
  ok(enCache === true, 'y la nueva YA quedó guardada, no a medio bajar');

  L('\n== 4. la apertura siguiente ya es la nueva ==');
  await pg.goto(url);
  ok((await version(pg)) === 'VERSION B', 'ahora sí: ' + await version(pg));

  L('\n== 5. y se sigue actualizando sola ==');
  fs.writeFileSync(path.join(DIR,'index.html'), pagina('C'));
  await pg.goto(url); await pg.waitForTimeout(1500);
  await pg.goto(url);
  ok((await version(pg)) === 'VERSION C', 'tercera versión sin tocar nada: ' + await version(pg));

  L('\n== 6. sin señal sigue abriendo con la última ==');
  await ctx.setOffline(true);
  await pg.goto(url);
  ok((await version(pg)) === 'VERSION C', 'la última guardada, sin red');
  await ctx.setOffline(false);

  await b.close(); await web.cerrar();
  fs.rmSync(DIR, {recursive:true, force:true});
  L(f ? '\n✗ ' + f + ' fallos' : '\n✓ todo bien');
  process.exit(f?1:0);
})();
