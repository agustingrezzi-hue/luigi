/* El panel corriendo como lo va a servir Apps Script. */
const {chromium} = require('playwright');
const fs = require('fs');
const SEED = require('./_seed.js');
const servir = require('./servidorcito.js');
let web = null, path = '';

const L = (...a) => console.log(...a);
const limpio = t => t.replace(/\s+/g,' ').trim();
let fallos = 0;
const ok = (c, m) => { if (!c){ fallos++; L('  ✗ '+m); } else L('  ✓ '+m); };

(async () => {
  web = await servir(__dirname);
  path = web.base + (process.env.PANEL || 'vl_panel_prueba.html');
  const b = await chromium.launch();
  const pg = await b.newPage({viewport:{width:468,height:940}});
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  pg.on('console', m => { if (m.type()==='error' && !/TUNNEL|fonts|ERR_/.test(m.text())) errs.push(m.text()); });

  await pg.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  // la semilla entra directo al store del backend falso
  await pg.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
  await pg.addInitScript(`(function(){
    const s = window.__apps.store;
    Object.keys(window.__semilla).forEach(k => {
      const p = k.split('/'); s[p[0]][p[1]] = window.__semilla[k];
    });
  })();`);
  await pg.goto(path); await pg.waitForTimeout(900);

  L('== 1. arranque contra Apps Script ==');
  ok(await pg.evaluate(()=>API.activo) === true, 'detecta que está servido por Apps Script');
  await pg.click('#nav button[data-v="clientes"]'); await pg.waitForTimeout(400);
  const nCli = await pg.$$eval('.cli', e=>e.length);
  ok(nCli > 0, 'trajo los clientes de la planilla: ' + nCli);
  ok((await pg.evaluate(()=>window.__apps.llamadas.todo)) === 1, 'una sola lectura al abrir');
  ok(await pg.$eval('#conex', e=>e.hidden) === false, 'aparece el indicador de conexión');
  ok(await pg.$eval('.marca .logo', i => i.complete && i.naturalWidth > 0),
     'el logo se ve (no es una imagen rota)');

  L('\n== 2. cargar un pedido: se ve al toque y llega a la planilla ==');
  await pg.click('#nav button[data-v="nuevo"]'); await pg.waitForTimeout(250);
  await pg.fill('#cli','Cint'); await pg.waitForTimeout(250);
  await pg.click('#sug button'); await pg.waitForTimeout(250);
  for (let i=0;i<4;i++) await pg.click('[data-sku="PRE-TOM"][data-d="1"]');
  await pg.click('#guardar'); await pg.waitForTimeout(150);
  const yaSeVe = await pg.$$eval('.ped', e=>e.length);
  ok(yaSeVe === 1, 'la tarjeta aparece antes de que el servidor conteste');
  await pg.waitForTimeout(600);
  const enServidor = await pg.evaluate(()=>Object.keys(window.__apps.store.pedidos).length);
  ok(enServidor === 1, 'y quedó guardada en la planilla');
  ok(await pg.evaluate(()=>API.cola.length) === 0, 'la cola quedó vacía');
  ok(limpio(await pg.textContent('#conex')) === '', 'el indicador vuelve a verde sin texto');
  const ped = await pg.evaluate(()=>Object.values(window.__apps.store.pedidos)[0]);
  ok(Array.isArray(ped.lineas) && ped.lineas[0].cantidad === 4,
     'las líneas viajaron enteras: ' + JSON.stringify(ped.lineas[0]));

  L('\n== 3. sin señal: sigue andando y encola ==');
  await pg.evaluate(()=>{ window.__apps.caido = true; });
  await pg.click('.ped .tog[data-k="preparado"]'); await pg.waitForTimeout(250);
  ok(await pg.getAttribute('.ped','class') === 'ped s-prep', 'el cambio se ve igual');
  await pg.waitForTimeout(400);
  ok(await pg.evaluate(()=>API.cola.length) === 1, 'quedó 1 cambio en la cola');
  ok(/sin guardar/.test(await pg.textContent('#conex')), 'avisa: "' + limpio(await pg.textContent('#conex')) + '"');
  await pg.click('.ped .tog[data-k="entregado"]'); await pg.waitForTimeout(300);
  await pg.evaluate(()=>{ API.enviando = false; return vaciarCola(); }); await pg.waitForTimeout(300);
  const cola = await pg.evaluate(()=>API.cola.map(o=>o.datos));
  ok(cola.length === 1 && cola[0].preparado === true && cola[0].entregado === true,
     'los dos cambios del mismo pedido se juntan en uno: ' + JSON.stringify(cola));
  ok(await pg.evaluate(()=>JSON.parse(localStorage.getItem('vl_cola')||'[]').length) === 1,
     'la cola sobrevive en el celular por si cierra la app');

  L('\n== 4. vuelve la señal ==');
  await pg.evaluate(()=>{ window.__apps.caido = false; API.falla = 0; window.dispatchEvent(new Event('online')); });
  await pg.waitForTimeout(900);
  ok(await pg.evaluate(()=>API.cola.length) === 0, 'la cola se vació sola');
  const ped2 = await pg.evaluate(()=>Object.values(window.__apps.store.pedidos)[0]);
  ok(ped2.preparado === true && ped2.entregado === true, 'los dos cambios llegaron a la planilla');
  ok(limpio(await pg.textContent('#conex')) === '', 'el indicador volvió a verde');

  L('\n== 5. la compañera carga desde otro celular ==');
  await pg.evaluate(()=>{
    window.__apps.store.pedidos['P_OTRA'] = {tanda:Object.values(window.__apps.store.pedidos)[0].tanda,
      cliente:'Pato Urtasun', clienteId:'x', envio:0, lineas:[{sku:'PRE-CEB',cantidad:6,precioUnit:4500,costoUnit:794}],
      preparado:false, entregado:false, cobrado:false, sinCargo:false, totalManual:null};
    window.__apps.version++;
  });
  await pg.evaluate(()=>mirarVersion()); await pg.waitForTimeout(700);
  ok(await pg.$$eval('.ped', e=>e.length) === 2, 'el pedido de ella aparece solo');
  ok(/Pato/.test(await pg.$$eval('.ped .nombre', e=>e.map(x=>x.textContent).join(' '))),
     'con su nombre');

  L('\n== 6. no pisa lo que tengo sin guardar ==');
  await pg.evaluate(()=>{ window.__apps.caido = true; });
  await pg.click('.ped .tog[data-k="cobrado"]'); await pg.waitForTimeout(300);
  await pg.evaluate(()=>{ window.__apps.version++; });
  await pg.evaluate(()=>mirarVersion()); await pg.waitForTimeout(400);
  ok(await pg.evaluate(()=>API.cola.length) >= 1,
     'con cambios pendientes no recarga de la planilla');
  await pg.evaluate(()=>{ window.__apps.caido = false; API.falla = 0;
    window.dispatchEvent(new Event('online')); });
  await pg.waitForTimeout(1200);
  ok(await pg.evaluate(()=>API.cola.length) === 0, 'y cuando puede, los manda');

  L('\n== 7. recetas y reglas también van a la planilla ==');
  await pg.click('#b-recetas'); await pg.waitForTimeout(500);
  await pg.fill('[data-reg="grPrepizza"]','300');
  await pg.dispatchEvent('[data-reg="grPrepizza"]','change'); await pg.waitForTimeout(700);
  ok(await pg.evaluate(()=>window.__apps.store.config.reglas.valores.grPrepizza) === 300,
     'el gramaje quedó guardado en la planilla');
  await pg.fill('[data-rec="masa_prepizza"][data-k="Sal"]','28');
  await pg.dispatchEvent('[data-rec="masa_prepizza"][data-k="Sal"]','change'); await pg.waitForTimeout(700);
  ok(await pg.evaluate(()=>window.__apps.store.recetas.masa_prepizza.items['Sal']) === 28,
     'y la receta también');

  L('\n== 7b. el POST viaja como texto plano (sin permiso previo) ==');
  const post = await pg.evaluate(()=>window.__apps.ultimoPost);
  ok(/text\/plain/.test(post.tipo||''), 'Content-Type: ' + post.tipo);
  ok(Array.isArray(post.cuerpo.ops), 'el cuerpo lleva las operaciones en lote');

  L('\n== 7c. un servidor viejo que manda "false" como texto ==');
  await pg.evaluate(()=>{
    const p = Object.values(window.__apps.store.pedidos)[0];
    p.preparado = 'false'; p.entregado = 'false'; p.cobrado = 'false'; p.sinCargo = 'false';
    window.__apps.version++;
  });
  await pg.evaluate(()=>cargarTodo()); await pg.waitForTimeout(700);
  await pg.click('#nav button[data-v="pedidos"]'); await pg.waitForTimeout(400);
  ok(await pg.evaluate(()=>S.pedidos[0].preparado) === false,
     'el panel lo entiende como no, no como texto');
  const sellos = await pg.$$eval('.ped .sello', e=>e.map(x=>x.textContent).join(' | '));
  ok(/Pendiente/.test(sellos), 'y la tarjeta queda pendiente: ' + sellos);
  ok(!/regalo/i.test(await pg.textContent('#v-pedidos')), 'sin marcarlo como regalado');

  L('\n== 8. las recetas se siembran solas la primera vez ==');
  const sembradas = await pg.evaluate(()=>Object.keys(window.__apps.store.recetas).length);
  ok(sembradas >= 19, 'quedaron ' + sembradas + ' documentos de receta (3 masas + 16 toppings)');

  await b.close();

  /* --- PIN, en una página nueva --- */
  const b2 = await chromium.launch();
  const pg2 = await b2.newPage({viewport:{width:468,height:940}});
  pg2.on('pageerror', e => errs.push('PAGEERROR(pin): '+e.message));
  await pg2.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  await pg2.addInitScript(`window.__apps.pin = '4821';`);
  await pg2.goto(web.base + 'vl_panel_pin.html');
  await pg2.waitForTimeout(900);
  L('\n== 9. PIN ==');
  ok(await pg2.$('.fondo-pin') !== null, 'pide el PIN antes de mostrar nada');
  await pg2.fill('#pin-in','1111'); await pg2.click('#pin-ok'); await pg2.waitForTimeout(600);
  ok(limpio(await pg2.textContent('.fondo-pin .s')) === 'Ese PIN no es.', 'rechaza el equivocado');
  await pg2.fill('#pin-in','4821'); await pg2.click('#pin-ok'); await pg2.waitForTimeout(700);
  ok(await pg2.$('.fondo-pin') === null, 'con el bueno entra');
  ok(await pg2.evaluate(()=>localStorage.getItem('vl_pin')) === '4821', 'y lo recuerda');
  await b2.close();

  L('\nerrores de consola: ' + (errs.length ? errs.join(' | ') : 'ninguno'));
  if (errs.length) fallos++;
  await web.cerrar();
  L(fallos ? '\n✗ ' + fallos + ' fallos' : '\n✓ todo bien');
  process.exit(fallos ? 1 : 0);
})();
