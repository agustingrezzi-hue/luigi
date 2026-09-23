/* Cómo abre la app: pantalla de arranque, datos guardados, volver a donde
   estabas y tirar para actualizar. Corre sobre el HTML de GitHub Pages. */
const {chromium} = require('playwright');
const fs = require('fs');
const SEED = require('./_seed.js');
const servir = require('./servidorcito.js');
const L=(...a)=>console.log(...a); let f=0;
const ok=(c,m)=>{ if(!c){f++;L('  ✗ '+m);} else L('  ✓ '+m); };
const limpio = t => t.replace(/\s+/g,' ').trim();

const SEMBRAR = `(function(){ const s=window.__apps.store;
  if(!Object.keys(s.productos).length)
    Object.keys(window.__semilla).forEach(k=>{const p=k.split('/'); s[p[0]][p[1]]=window.__semilla[k];});
})();`;

/* un tirón hacia abajo de verdad, con dedo */
async function tirar(pg, px){
  await pg.evaluate(async d => {
    const t = document.body;
    const toca = (y) => new Touch({identifier:1, target:t, clientX:120, clientY:y,
      radiusX:10, radiusY:10, force:1});
    const ev = (tipo, y) => { const e = new TouchEvent(tipo, {
      touches: tipo==='touchend' ? [] : [toca(y)],
      targetTouches: tipo==='touchend' ? [] : [toca(y)],
      changedTouches:[toca(y)], bubbles:true, cancelable:true});
      t.dispatchEvent(e); };
    ev('touchstart', 10);
    for (let y = 10; y <= 10 + d; y += 20){ ev('touchmove', y); await new Promise(r=>setTimeout(r,16)); }
    ev('touchend', 10 + d);
  }, px);
}

(async () => {
  const web = await servir(__dirname);
  const url = web.base + 'vl_web_prueba.html';
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:468,height:940}, hasTouch:true, isMobile:true});
  const pg = await ctx.newPage();
  const errs=[]; pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
  pg.on('console', m => { if (m.type()==='error' && !/TUNNEL|fonts|ERR_|favicon/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  await pg.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
  await pg.addInitScript(SEMBRAR);

  const poner = async (clave, valor) => pg.evaluate(
    ([k,v]) => { try { localStorage.setItem(k, v); } catch(e){} }, [clave, String(valor)]);
  /* que la primera carga real termine antes de contar llamadas */
  const asentar = () => pg.waitForFunction(
    ()=>{ try { return S.listo===true && S.deGuardado===false && API.cargando===false; }
          catch(e){ return false; } }, null, {timeout:9000});

  L('== 1. la primera vez, sin nada guardado ==');
  await pg.goto(url);
  await pg.evaluate(()=>{ try { localStorage.clear(); } catch(e){} });
  await poner('__apps_lento', 700);
  await pg.goto(url);
  await pg.waitForTimeout(200);
  ok(await pg.$('#arranque') !== null, 'se ve la pantalla de arranque con el logo');
  ok(await pg.$eval('#arranque .logo-arranque', i=>i.complete && i.naturalWidth > 0),
     'con el logo cargado, no un cuadrito roto');
  ok(await pg.$$eval('.hueso', e=>e.length) > 0, 'y debajo ya están los esqueletos');
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:8000});
  await pg.waitForTimeout(900);
  ok(await pg.$('#arranque') === null, 'cuando llegan los datos, la pantalla de arranque se va');
  await asentar();
  ok(await pg.$$eval('.hueso', e=>e.length) === 0, 'y los esqueletos también');
  ok(await pg.evaluate(()=>!!leeLocal('vl_datos')), 'quedó guardada la foto de los datos');

  L('\n== 2. la segunda vez abre sin esperar al servidor ==');
  await poner('__apps_lento', 3000);
  const t0 = Date.now();
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:2500});
  const tardo = Date.now()-t0;
  ok(tardo < 2000, 'hay datos en pantalla en ' + tardo + ' ms, con el servidor tardando 3 s');
  ok(await pg.evaluate(()=>S.deGuardado) === true, 'vienen de la foto guardada');
  ok(await pg.$$eval('.tchip', e=>e.length) > 0, 'la tira de semanas ya está dibujada');
  const tapa = await pg.evaluate(()=>{ const a = document.getElementById('arranque');
    return !a || a.classList.contains('se-va'); });
  ok(tapa, 'y la pantalla de arranque ya se está yendo, no hay nada que esperar');

  L('\n== 3. vuelve a donde estabas ==');
  await poner('__apps_lento', 0);
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:8000});
  await pg.click('#nav button[data-v="stock"]'); await pg.waitForTimeout(400);
  const sem = await pg.evaluate(()=>{
    const otra = semanasVisibles().filter(x=>x!==S.semanaSel)[0];
    return otra; });
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(300);
  await pg.click('#tandas-strip [data-s="'+sem+'"]'); await pg.waitForTimeout(400);
  await pg.click('#nav button[data-v="stock"]'); await pg.waitForTimeout(400);
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:8000});
  await pg.waitForTimeout(400);
  ok(await pg.evaluate(()=>S.vista) === 'stock', 'abrió en Stock, que es donde estaba');
  ok(await pg.evaluate(()=>S.semanaSel) === sem, 'y en la semana que había elegido');
  ok(await pg.$eval('#v-stock', e=>e.classList.contains('on')), 'la pantalla correcta está a la vista');

  L('\n== 4. sin señal, la app abre igual ==');
  await poner('__apps_caido', '1');
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:5000});
  await pg.waitForTimeout(700);
  ok(await pg.evaluate(()=>S.clientes.length) > 0, 'muestra los clientes guardados');
  ok(await pg.$('#arranque') === null, 'sin quedarse en la pantalla de arranque');
  ok(await pg.evaluate(()=>API.falla) > 0, 'y sabe que no pudo hablar con el servidor');

  L('\n== 5. tirar para actualizar ==');
  await poner('__apps_caido', '0');
  await pg.goto(url);
  await asentar();
  await pg.waitForTimeout(300);
  await pg.evaluate(()=>{ window.__apps.llamadas.todo = 0; });
  await tirar(pg, 40);   // poquito: no alcanza
  await pg.waitForTimeout(500);
  ok(await pg.evaluate(()=>window.__apps.llamadas.todo) === 0, 'un tirón corto no hace nada');
  await tirar(pg, 220);  // hasta abajo
  await pg.waitForTimeout(300);
  ok(await pg.$('#tirar.girando') !== null, 'aparece la ruedita girando');
  await pg.waitForTimeout(1200);
  ok(await pg.evaluate(()=>window.__apps.llamadas.todo) >= 1, 'y trajo los datos de nuevo');
  ok(await pg.$('#tirar.girando') === null, 'la ruedita se guarda sola');

  L('\n== 6. el tirón no se mete con la tira de semanas ==');
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(400);
  await pg.evaluate(()=>{ window.__apps.llamadas.todo = 0; });
  await pg.evaluate(async () => {
    const t = document.querySelector('#tandas-strip .tchip');
    const toca = y => new Touch({identifier:2, target:t, clientX:120, clientY:y, force:1});
    const ev = (tipo,y) => t.dispatchEvent(new TouchEvent(tipo, {
      touches: tipo==='touchend'?[]:[toca(y)], targetTouches: tipo==='touchend'?[]:[toca(y)],
      changedTouches:[toca(y)], bubbles:true, cancelable:true}));
    ev('touchstart', 10);
    for (let y=10;y<=230;y+=20){ ev('touchmove', y); await new Promise(r=>setTimeout(r,16)); }
    ev('touchend', 230);
  });
  await pg.waitForTimeout(700);
  ok(await pg.evaluate(()=>window.__apps.llamadas.todo) === 0,
     'tirando desde la tira de semanas no actualiza');

  await b.close(); await web.cerrar();
  L('\nerrores: ' + (errs.length?errs.join(' | '):'ninguno')); if (errs.length) f++;
  L(f ? '\n✗ ' + f + ' fallos' : '\n✓ todo bien');
  process.exit(f?1:0);
})();
