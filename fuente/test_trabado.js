/* Lo del 21/9: un cambio que el servidor rechaza no puede trabar a todos los demás. */
const {chromium} = require('playwright');
const fs = require('fs');
const SEED = require('./_seed.js');
const servir = require('./servidorcito.js');
const L=(...a)=>console.log(...a); let f=0;
const ok=(c,m)=>{ if(!c){f++;L('  ✗ '+m);} else L('  ✓ '+m); };

async function escenario(viejo){
  const web = await servir(__dirname);
  const url = web.base + 'vl_web_prueba.html';
  const b = await chromium.launch();
  const pg = await (await b.newContext({viewport:{width:468,height:940}})).newPage();
  const errs=[]; pg.on('pageerror', e=>errs.push(e.message));
  await pg.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  await pg.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
  await pg.addInitScript(`(function(){ const s=window.__apps.store;
    if(!Object.keys(s.productos).length)
      Object.keys(window.__semilla).forEach(k=>{const p=k.split('/'); s[p[0]][p[1]]=window.__semilla[k];});
  })();`);
  await pg.goto(url);
  await pg.evaluate(v=>{ try { localStorage.clear(); localStorage.setItem('__apps_viejo', v?'1':'0'); } catch(e){} }, viejo);
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true && API.cargando===false}catch(e){return false}},null,{timeout:9000});
  await pg.waitForTimeout(1200);

  // un pedido guardado de antes
  await pg.evaluate(()=>guardar('pedidos/P1', {tanda:S.semanaSel, entrega:0, cliente:'Vicky',
    clienteId:'x', envio:0, lineas:[{sku:'PRE-TOM',cantidad:4,precioUnit:4500,costoUnit:981}],
    preparado:false, entregado:false, cobrado:false, sinCargo:false, totalManual:null}));
  await pg.waitForTimeout(1200);

  // como hizo Agus: primero una nota, después toca pedidos
  await pg.evaluate(()=>{ API.enviando = true; });          // que se junten en un mismo lote
  await pg.evaluate(()=>guardar('notas/N1', {titulo:'Compras', tipo:'lista', items:[]}));
  await pg.evaluate(()=>parchar('pedidos/P1', {preparado:true}));
  await pg.evaluate(()=>parchar('pedidos/P1', {formaPago:'Efectivo'}));
  await pg.evaluate(()=>{ API.enviando = false; vaciarCola(); });
  await pg.waitForTimeout(3500);

  const p1 = await pg.evaluate(()=>window.__apps.store.pedidos.P1);
  const res = {
    preparado: p1 && p1.preparado === true,
    pago: p1 && p1.formaPago === 'Efectivo',
    cola: await pg.evaluate(()=>API.cola.length),
    apartados: await pg.evaluate(()=>(API.apartados||[]).length),
    motivo: await pg.evaluate(()=>API.motivo),
    nota: await pg.evaluate(()=>!!(window.__apps.store.notas||{}).N1),
  };
  await b.close(); await web.cerrar();
  res.errs = errs;
  return res;
}

(async () => {
  L('== con el servidor VIEJO (el que tiene Agus ahora) ==');
  const v = await escenario(true);
  ok(v.preparado, 'el pedido quedó marcado preparado en la planilla');
  ok(v.pago, 'y la forma de pago también');
  ok(v.cola === 0, 'la cola no queda trabada: ' + v.cola + ' pendientes');
  ok(v.apartados === 1, 'la nota queda apartada, no perdida: ' + v.apartados);
  ok(/notas/.test(v.motivo), 'y el motivo se ve: ' + v.motivo);

  L('\n== con el servidor NUEVO ==');
  const n = await escenario(false);
  ok(n.preparado && n.pago, 'los cambios del pedido llegan');
  ok(n.nota, 'y la nota también');
  ok(n.cola === 0 && n.apartados === 0, 'no queda nada pendiente ni apartado');

  L('\n== el teléfono de Agus: la cola ya venía trabada de antes ==');
  const t = await (async () => {
    const web = await servir(__dirname);
    const url = web.base + 'vl_web_prueba.html';
    const b = await chromium.launch();
    const pg = await (await b.newContext({viewport:{width:468,height:940}})).newPage();
    const errs=[]; pg.on('pageerror', e=>errs.push(e.message));
    await pg.addInitScript(fs.readFileSync('httpmock.js','utf8'));
    await pg.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
    await pg.addInitScript(`(function(){ const s=window.__apps.store;
      if(!Object.keys(s.productos).length)
        Object.keys(window.__semilla).forEach(k=>{const p=k.split('/'); s[p[0]][p[1]]=window.__semilla[k];});
      s.pedidos.P9 = s.pedidos.P9 || {tanda:'2026-09-21', cliente:'Vicky Marazzo', clienteId:'vicky-marazzo',
        envio:0, lineas:[{sku:'PRE-TOM',cantidad:5,precioUnit:4500,costoUnit:981}],
        preparado:false, entregado:false, cobrado:false, sinCargo:false, totalManual:null};
    })();`);
    await pg.goto(url);
    /* lo que quedó guardado en su teléfono: una nota primero, pedidos atrás */
    await pg.evaluate(() => { try {
      localStorage.clear();
      localStorage.setItem('__apps_viejo', '1');
      localStorage.setItem('vl_cola', JSON.stringify([
        {op:'set', ruta:'notas/Nx', datos:{titulo:'Compras', tipo:'lista', items:[]}},
        {op:'update', ruta:'pedidos/P9', datos:{entrega:0}},
        {op:'update', ruta:'pedidos/P9', datos:{preparado:true}},
        {op:'update', ruta:'pedidos/P9', datos:{formaPago:'Transferencia'}},
      ]));
    } catch(e){} });
    await pg.goto(url);
    await pg.waitForFunction(()=>{try{return S.listo===true && API.cola.length===0}catch(e){return false}},
      null, {timeout:15000}).catch(()=>{});
    await pg.waitForTimeout(800);
    const r = {
      p9: await pg.evaluate(()=>window.__apps.store.pedidos.P9),
      cola: await pg.evaluate(()=>API.cola.length),
      apartados: await pg.evaluate(()=>API.apartados.length),
      conex: await pg.evaluate(()=>document.getElementById('conex').textContent),
      errs,
    };
    /* y cuando actualiza el servidor, en la apertura siguiente entra la nota */
    await pg.evaluate(() => { try { localStorage.setItem('__apps_viejo', '0'); } catch(e){} });
    await pg.goto(url);
    await pg.waitForFunction(()=>{try{return S.listo===true && API.cola.length===0}catch(e){return false}},
      null, {timeout:15000}).catch(()=>{});
    await pg.waitForTimeout(800);
    r.notaDespues = await pg.evaluate(()=>!!(window.__apps.store.notas||{}).Nx);
    r.apartadosDespues = await pg.evaluate(()=>API.apartados.length);
    await b.close(); await web.cerrar();
    return r;
  })();
  ok(t.p9.preparado === true && t.p9.formaPago === 'Transferencia',
     'los cambios del pedido que estaban trabados llegan al abrir');
  ok(t.cola === 0, 'la cola se vacía: ' + t.cola);
  ok(t.apartados === 1, 'solo la nota queda apartada: ' + t.apartados);
  ok(/rechazad/.test(t.conex), 'y el puntito lo avisa: "' + t.conex + '"');
  ok(t.notaDespues === true, 'con el servidor nuevo, la nota entra sola en la apertura siguiente');
  ok(t.apartadosDespues === 0, 'y no queda nada apartado');

  const errs = v.errs.concat(n.errs, t.errs);
  L('\nerrores: ' + (errs.length?errs.join(' | '):'ninguno')); if (errs.length) f++;
  L(f ? '\n✗ ' + f + ' fallos' : '\n✓ todo bien');
  process.exit(f?1:0);
})();
