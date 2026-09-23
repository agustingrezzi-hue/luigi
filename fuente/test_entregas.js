/* Semanas con dos y tres entregas, pedidos editables y notas. */
const {chromium} = require('playwright');
const fs = require('fs');
const SEED = require('./_seed.js');
const servir = require('./servidorcito.js');
const L=(...a)=>console.log(...a); let f=0;
const ok=(c,m)=>{ if(!c){f++;L('  ✗ '+m);} else L('  ✓ '+m); };
const limpio = t => t.replace(/\s+/g,' ').trim();

async function mantener(pg, sel){
  const caja = await (await pg.$(sel)).boundingBox();
  await pg.mouse.move(caja.x+caja.width/2, caja.y+Math.min(20, caja.height/2));
  await pg.mouse.down(); await pg.waitForTimeout(750); await pg.mouse.up();
  await pg.waitForTimeout(400);
}
async function pedido(pg, nombre, cuantas){
  await pg.click('#nav button[data-v="nuevo"]'); await pg.waitForTimeout(300);
  await pg.fill('#cli', nombre); await pg.waitForTimeout(300);
  await pg.click('#sug button'); await pg.waitForTimeout(250);
  for (let i=0;i<cuantas;i++) await pg.click('[data-sku="PRE-TOM"][data-d="1"]');
  await pg.click('#guardar'); await pg.waitForTimeout(900);
}

(async () => {
  const web = await servir(__dirname);
  const url = web.base + 'vl_web_prueba.html';
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:468,height:940}});
  const pg = await ctx.newPage();
  const errs=[]; pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
  pg.on('console', m => { if (m.type()==='error' && !/TUNNEL|fonts|ERR_|favicon/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  await pg.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
  await pg.addInitScript(`(function(){ const s=window.__apps.store;
    if(!Object.keys(s.productos).length)
      Object.keys(window.__semilla).forEach(k=>{const p=k.split('/'); s[p[0]][p[1]]=window.__semilla[k];});
  })();`);
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:9000});
  await pg.waitForTimeout(500);

  L('== 1. una entrega: todo como antes ==');
  ok(await pg.evaluate(()=>entregasDe(S.semanaSel).length) === 1, 'la semana arranca con una');
  ok(await pg.$('.titulo.partida') === null, 'la cabecera no se parte');
  ok(/entrega vie/.test(limpio(await pg.textContent('#subtitulo'))),
     'y dice el día: ' + limpio(await pg.textContent('#subtitulo')));

  L('\n== 2. agregar una segunda entrega ==');
  await mantener(pg, '.tchip[aria-pressed="true"]');
  ok(await pg.$('.hoja') !== null, 'manteniendo apretada la semana se abre la hoja');
  await pg.click('#mas-entrega'); await pg.waitForTimeout(700);
  ok(await pg.$$eval('.entrega-fila', e=>e.length) === 2, 'quedan dos entregas');
  await pg.click('.hoja [data-ent="1"][data-dia="3"]'); await pg.waitForTimeout(700);
  await pg.mouse.click(5,5); await pg.waitForTimeout(500);
  ok(await pg.evaluate(()=>entregasDe(S.semanaSel).map(e=>e.dia).join(',')) === '5,3',
     'viernes y miércoles');
  ok(await pg.$('.titulo.partida') !== null, 'la cabecera azul se parte');
  const trozos = await pg.$$eval('.trozo .d', e=>e.map(x=>x.textContent).join(' | '));
  ok(/vie/.test(trozos) && /mié/.test(trozos), 'con un pedazo por entrega: ' + trozos);
  ok(await pg.evaluate(()=>window.__apps.store.tandas[S.semanaSel].entregas.length) === 2,
     'y quedó en la planilla');

  L('\n== 3. cada entrega es un amasado aparte ==');
  await pedido(pg, 'Cint', 4);
  ok(await pg.evaluate(()=>S.pedidos[0].entrega) === 0, 'el pedido cae en la primera entrega');
  await pg.click('.trozo[data-ent="1"]'); await pg.waitForTimeout(500);
  ok(await pg.evaluate(()=>S.entregaSel) === 1, 'me paso a la segunda');
  await pedido(pg, 'Feli', 12);
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(400);
  const c0 = await pg.evaluate(()=>calcular(S.semanaSel, 0));
  const c1 = await pg.evaluate(()=>calcular(S.semanaSel, 1));
  ok(c0.pre === 4 && c1.pre === 12, 'los pedidos van a su entrega: ' + c0.pre + ' y ' + c1.pre);
  ok(c0.kgPre === 1 && c1.kgPre === 3, 'cada una amasa lo suyo: ' + c0.kgPre + ' kg y ' + c1.kgPre + ' kg');
  ok(c0.bandejas === 1 && c1.bandejas === 3,
     'y cada una ocupa su heladera: ' + c0.bandejas + ' y ' + c1.bandejas + ' bandejas');
  const sem = await pg.evaluate(()=>calcular(S.semanaSel));
  ok(sem.pre === 16 && sem.kgPre === 4, 'la semana suma las dos: ' + sem.pre + ' prepizzas, ' + sem.kgPre + ' kg');

  L('\n== 4. los kilos de una no tocan a la otra ==');
  await pg.click('[data-kg="pre"]'); await pg.waitForTimeout(300);
  await pg.fill('#in-kg','6'); await pg.click('#ok-kg'); await pg.waitForTimeout(900);
  ok(await pg.evaluate(()=>calcular(S.semanaSel,1).kgPre) === 6, 'la segunda quedó en 6 kg');
  ok(await pg.evaluate(()=>calcular(S.semanaSel,0).kgPre) === 1, 'y la primera sigue en 1');

  L('\n== 5. la lista de pedidos sigue a la entrega elegida ==');
  await pg.click('#nav button[data-v="pedidos"]'); await pg.waitForTimeout(450);
  ok(await pg.$$eval('.ped', e=>e.length) === 1, 'se ve solo el pedido de la entrega elegida');
  ok(/Feli/.test(await pg.textContent('.ped .nombre')),
     'el del miércoles: ' + limpio(await pg.textContent('.ped .nombre')));
  await pg.click('.trozo[data-ent="0"]'); await pg.waitForTimeout(500);
  ok(/Cint/.test(await pg.textContent('.ped .nombre')),
     'y cambiando de pedazo aparece el del viernes: ' + limpio(await pg.textContent('.ped .nombre')));
  ok(/vie/.test(await pg.textContent('.dia-ped')), 'con su día al lado del nombre');

  L('\n== 6. editar un pedido sin borrarlo ==');
  const antes = await pg.evaluate(()=>S.pedidos.find(p=>p.cliente.indexOf('Cint')===0).id);
  await mantener(pg, '.ped');
  ok(await pg.evaluate(()=>S.vista) === 'nuevo', 'manteniendo apretado se abre el formulario');
  ok(limpio(await pg.textContent('#pantalla')) === 'Editar pedido', 'y dice que es una edición');
  ok(await pg.inputValue('#cli') !== '', 'con el cliente puesto: ' + await pg.inputValue('#cli'));
  await pg.selectOption('#n-pago', 'Efectivo'); await pg.waitForTimeout(200);
  await pg.click('[data-sku="PRE-TOM"][data-d="1"]'); await pg.waitForTimeout(300);
  await pg.click('#guardar'); await pg.waitForTimeout(900);
  const ped = await pg.evaluate(id=>S.pedidos.find(p=>p.id===id), antes);
  ok(await pg.evaluate(()=>S.pedidos.length) === 2, 'sigue habiendo dos pedidos, no tres');
  ok(ped.formaPago === 'Efectivo', 'cambió la forma de pago: ' + ped.formaPago);
  ok(ped.lineas[0].cantidad === 5, 'y la cantidad: ' + ped.lineas[0].cantidad);
  ok(ped.lineas[0].precioUnit === 4500, 'el precio de la línea vieja no se tocó: ' + ped.lineas[0].precioUnit);

  L('\n== 7. sin cargo esconde Cobrado ==');
  await pg.click('#nav button[data-v="pedidos"]'); await pg.waitForTimeout(400);
  ok(await pg.$$eval('.ped', e=>e.length) === 1, 'sigo en la entrega del pedido que edité');
  await pg.click('.ped [data-cobro]'); await pg.waitForTimeout(350);
  await pg.click('[data-cm="sin"]'); await pg.waitForTimeout(700);
  const botones = await pg.$$eval('.ped .tog', e=>e.map(x=>x.textContent).join(','));
  ok(!/Cobrado/.test(botones), 'no ofrece cobrar un regalo: ' + botones);
  await pg.click('.ped >> nth=0 >> [data-k="preparado"]'); await pg.waitForTimeout(400);
  await pg.click('.ped >> nth=0 >> [data-k="entregado"]'); await pg.waitForTimeout(500);
  ok(await pg.getAttribute('.ped >> nth=0','class') === 'ped s-list',
     'entregado y sin cargo ya es listo');

  L('\n== 8. la tanda cerrada se distingue ==');
  await pg.evaluate(()=>S.pedidos.forEach(p =>
    parchar('pedidos/'+p.id, {preparado:true, entregado:true, cobrado:true})));
  await pg.waitForTimeout(800);
  ok(await pg.evaluate(()=>calcular(S.semanaSel).cerrada) === true, 'la semana queda cerrada');
  ok(await pg.$('.titulo.cerrada') !== null, 'la cabecera lo muestra');
  ok(await pg.$('.tchip.cerrada') !== null, 'y la tira también');

  L('\n== 9. sacar una entrega no pierde los pedidos ==');
  await mantener(pg, '.tchip[aria-pressed="true"]');
  await pg.click('.hoja [data-quitar="1"]'); await pg.waitForTimeout(800);
  await pg.mouse.click(5,5); await pg.waitForTimeout(500);
  ok(await pg.evaluate(()=>entregasDe(S.semanaSel).length) === 1, 'queda una entrega');
  ok(await pg.evaluate(()=>S.pedidos.length) === 2, 'y los dos pedidos siguen ahí');
  ok(await pg.evaluate(()=>S.pedidos.every(p=>Number(p.entrega||0)===0)),
     'todos pasaron a la que quedó');

  L('\n== 10. notas y listas de compras ==');
  await pg.click('#b-notas'); await pg.waitForTimeout(400);
  ok(limpio(await pg.textContent('#pantalla')) === 'Notas', 'la pantalla existe');
  await pg.click('#n-lista'); await pg.waitForTimeout(700);
  await pg.fill('[data-tit]', 'Compras del jueves');
  await pg.dispatchEvent('[data-tit]','change'); await pg.waitForTimeout(600);
  await pg.fill('[data-item]', 'Harina 000');
  await pg.dispatchEvent('[data-item]','change'); await pg.waitForTimeout(600);
  await pg.click('[data-tic]'); await pg.waitForTimeout(600);
  const nota = await pg.evaluate(()=>Object.values(window.__apps.store.notas)[0]);
  ok(nota.titulo === 'Compras del jueves', 'el título llegó a la planilla');
  ok(nota.items[0].que === 'Harina 000' && nota.items[0].hecho === true,
     'y el ítem tildado: ' + JSON.stringify(nota.items[0]));
  await pg.click('[data-delnota]'); await pg.waitForTimeout(600);
  ok(await pg.evaluate(()=>Object.keys(window.__apps.store.notas).length) === 0, 'y se puede borrar');

  await b.close(); await web.cerrar();
  L('\nerrores: ' + (errs.length?errs.join(' | '):'ninguno')); if (errs.length) f++;
  L(f ? '\n✗ ' + f + ' fallos' : '\n✓ todo bien');
  process.exit(f?1:0);
})();
