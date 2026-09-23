/* El caso de Agus: el teléfono no deja salir el POST. */
const {chromium} = require('playwright');
const fs = require('fs');
const SEED = require('./_seed.js');
const servir = require('./servidorcito.js');
const L=(...a)=>console.log(...a); let f=0;
const ok=(c,m)=>{ if(!c){f++;L('  ✗ '+m);} else L('  ✓ '+m); };
/* el clic puede caer antes de que la pantalla esté enganchada: insistimos */
async function irA(pg, v){
  for (let i=0;i<10;i++){
    await pg.click('#nav button[data-v="'+v+'"]');
    try { await pg.waitForFunction(x=>{ try { return S.vista === x; } catch(e){ return false; } },
      v, {timeout:1200}); return; } catch(e){}
  }
  throw new Error('no pude ir a ' + v);
}

(async () => {
  const web = await servir(__dirname);
  const url = web.base + 'vl_panel_prueba.html';
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:468,height:940}});
  const pg = await ctx.newPage();
  const errs=[];
  pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
  await pg.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  await pg.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
  await pg.addInitScript(`(function(){ const s=window.__apps.store;
    if (!Object.keys(s.productos).length)
      Object.keys(window.__semilla).forEach(k=>{const p=k.split('/'); s[p[0]][p[1]]=window.__semilla[k];});
    window.__apps.sinPost = true; })();`);
  
  await pg.goto(url); await pg.waitForTimeout(900);

  L('== el POST está bloqueado ==');
  ok(await pg.evaluate(()=>API.activo), 'igual conecta y lee');
  await pg.click('#nav button[data-v="nuevo"]'); await pg.waitForTimeout(250);
  await pg.fill('#cli','Cint'); await pg.waitForTimeout(250);
  await pg.click('#sug button'); await pg.waitForTimeout(250);
  for (let i=0;i<4;i++) await pg.click('[data-sku="PRE-TOM"][data-d="1"]');
  await pg.click('#guardar'); await pg.waitForTimeout(1400);
  ok(await pg.evaluate(()=>Object.keys(window.__apps.store.pedidos).length)===1,
     'el pedido igual llegó a la planilla');
  ok(await pg.evaluate(()=>window.__apps.llamadas.porGet)>0, 'pasó por la vía alternativa');
  ok(await pg.evaluate(()=>API.cola.length)===0, 'la cola quedó vacía');
  ok(await pg.evaluate(()=>API.via)==='get', 'y se queda usando esa vía');
  const ped = await pg.evaluate(()=>Object.values(window.__apps.store.pedidos)[0]);
  ok(ped.lineas && ped.lineas[0].cantidad===4, 'las líneas viajaron enteras por la dirección');

  L('\n== cierra y vuelve a entrar ==');
  await pg.goto(url);
  await pg.waitForLoadState('domcontentloaded');
  await pg.waitForFunction(()=>{ try { return S.listo === true; } catch(e){ return false; } }, null, {timeout:8000});
  await irA(pg, 'pedidos');
  await pg.waitForSelector('.ped .tog[data-k="preparado"]', {timeout:8000});
  ok(await pg.$$eval('.ped', e=>e.length)===1, 'el pedido sigue ahí');
  ok(await pg.evaluate(()=>API.via)==='get', 'se acuerda de la vía que anda');

  L('\n== servidor caído del todo: lo pendiente no desaparece de la pantalla ==');
  await pg.evaluate(()=>{ window.__apps.caido = true; });
  await pg.click('.ped .tog[data-k="preparado"]'); await pg.waitForTimeout(600);
  ok(await pg.evaluate(()=>API.cola.length)===1, 'quedó en la cola');
  await pg.evaluate(()=>{ window.__apps.caido = false; });
  await pg.goto(url);
  await pg.waitForLoadState('domcontentloaded');
  await pg.waitForFunction(()=>{ try { return S.listo === true; } catch(e){ return false; } }, null, {timeout:8000});
  await irA(pg, 'pedidos');
  await pg.waitForSelector('.ped', {timeout:8000}); await pg.waitForTimeout(600);
  ok(await pg.evaluate(()=>Object.values(window.__apps.store.pedidos)[0].preparado)===true,
     'al volver a entrar se manda solo lo que quedó pendiente');

  L('\n== el puntito cuenta qué pasa ==');
  await pg.click('#conex'); await pg.waitForTimeout(300);
  const t = (await pg.textContent('.hoja')).replace(/\s+/g,' ');
  ok(/Vía para guardar/.test(t), 'la hoja de conexión abre: ' + t.slice(0,150));
  await b.close();

  /* --- el caso de Agus: el POST anda, pero la planilla le cambia las fechas --- */
  L('\n== con el POST andando, el pedido tiene que sobrevivir igual ==');
  const b2 = await chromium.launch();
  const c2 = await b2.newContext({viewport:{width:468,height:940}});
  const p2 = await c2.newPage();
  p2.on('pageerror', e=>errs.push('PAGEERROR(2): '+e.message));
  await p2.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  await p2.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
  await p2.addInitScript(`(function(){ const s=window.__apps.store;
    if (!Object.keys(s.productos).length)
      Object.keys(window.__semilla).forEach(k=>{const p=k.split('/'); s[p[0]][p[1]]=window.__semilla[k];});
  })();`);
  await p2.goto(url); await p2.waitForTimeout(900);
  await p2.click('#nav button[data-v="nuevo"]'); await p2.waitForTimeout(250);
  await p2.fill('#cli','Cint'); await p2.waitForTimeout(250);
  await p2.click('#sug button'); await p2.waitForTimeout(250);
  for (let i=0;i<3;i++) await p2.click('[data-sku="PRE-TOM"][data-d="1"]');
  await p2.click('#guardar'); await p2.waitForTimeout(1200);
  ok(await p2.evaluate(()=>API.via)==='post', 'guardó por la vía directa');
  const guardada = await p2.evaluate(()=>Object.values(window.__apps.store.pedidos)[0].tanda);
  ok(String(guardada).length > 10, 'la planilla igual le cambió la fecha: ' + guardada);
  await p2.goto(url);
  await p2.waitForLoadState('domcontentloaded');
  await p2.waitForFunction(()=>{ try { return S.listo === true; } catch(e){ return false; } }, null, {timeout:8000});
  await irA(p2, 'pedidos');
  await p2.waitForSelector('.ped', {timeout:8000}); await p2.waitForTimeout(300);
  ok(await p2.$$eval('.ped', e=>e.length)===1, 'y al volver a entrar el pedido está');
  const tira = await p2.textContent('#tandas-strip');
  ok(/1 bandeja/.test(tira.replace(/\s+/g,' ')),
     'la semana lo cuenta: ' + tira.replace(/\s+/g,' ').slice(40,110));
  await b2.close();

  L('\nerrores: ' + (errs.length?errs.join(' | '):'ninguno')); if (errs.length) f++;
  await web.cerrar();
  L(f ? '\n✗ '+f+' fallos' : '\n✓ todo bien');
  process.exit(f?1:0);
})();
