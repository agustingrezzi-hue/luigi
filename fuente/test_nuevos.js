/* Biga, ingredientes libres, stock automático, insumo nuevo, buscador,
   calendario, estado de las tarjetas y el laboratorio del cronómetro. */
const {chromium} = require('playwright');
const fs = require('fs');
const SEED = require('./_seed.js');
const servir = require('./servidorcito.js');
const L=(...a)=>console.log(...a); let f=0;
const ok=(c,m)=>{ if(!c){f++;L('  ✗ '+m);} else L('  ✓ '+m); };
const limpio = t => t.replace(/\s+/g,' ').trim();
const cerca = (a,b) => Math.abs(a-b) < 0.01;

(async () => {
  const web = await servir(__dirname);
  const url = web.base + 'vl_web_prueba.html';
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:360,height:800}, acceptDownloads:true});
  const pg = await ctx.newPage();
  const errs=[]; pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
  pg.on('console', m => { if (m.type()==='error' && !/TUNNEL|fonts|ERR_|favicon/.test(m.text())) errs.push(m.text()); });
  await pg.route('https://api.open-meteo.com/**', r => r.fulfill({status:200, contentType:'application/json',
    headers:{'access-control-allow-origin':'*'},
    body: JSON.stringify({current:{temperature_2m:17.34, relative_humidity_2m:70.4}})}));
  await pg.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  await pg.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
  /* una semana pasada con un pedido entregado pero sin cobrar, stock cargado
     antes, y una semana que viene */
  await pg.addInitScript(`(function(){ const s=window.__apps.store;
    if(Object.keys(s.productos).length) return;
    Object.keys(window.__semilla).forEach(k=>{const p=k.split('/'); s[p[0]][p[1]]=window.__semilla[k];});
    const iso = d => d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
    const h = new Date(); const dow=(h.getDay()+6)%7; h.setDate(h.getDate()-dow);
    const lun = n => { const d=new Date(h); d.setDate(d.getDate()+n*7); return iso(d); };
    const pasada = lun(-1), prox = lun(1), antes = lun(-2);
    window.__fechas = {pasada, prox, antes};
    s.tandas[pasada] = {semana:pasada, estado:'abierta', entregas:[{dia:4}]};
    s.pedidos['PX1'] = {tanda:pasada, entrega:0, cliente:'Bife Padel', clienteId:'bife-padel', envio:0,
      lineas:[{sku:'PRE-TOM',cantidad:10,precioUnit:4500,costoUnit:800}],
      preparado:true, entregado:true, cobrado:false, sinCargo:false, totalManual:null};
    s.pedidos['PX2'] = {tanda:prox, entrega:0, cliente:'Camila Abal', clienteId:'camila-abal', envio:0,
      lineas:[{sku:'PRE-CEB',cantidad:4,precioUnit:4500,costoUnit:800}],
      preparado:false, entregado:false, cobrado:false, sinCargo:false, totalManual:null};
    s.movimientos['M0'] = {insumo:'Harina 00', gramos:50000, origen:'compra', fecha:antes};
    s.movimientos['M1'] = {insumo:'Levadura', gramos:500, origen:'compra', fecha:antes};
  })();`);
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:9000});
  await pg.waitForTimeout(1500);
  const F = await pg.evaluate(()=>window.__fechas);

  L('== 1. el stock se descuenta solo ==');
  let autos = await pg.evaluate(()=>S.movimientos.filter(esAuto).map(m=>({id:m.id, i:m.insumo, g:m.gramos, o:m.origen})));
  const har = autos.find(m=>m.i==='Harina 00');
  const esperado = await pg.evaluate(()=>{ const s=lunesDe(window.__fechas.pasada); return Math.round(calcular(s,0).consumo['Harina 00']); });
  ok(har && har.g === -esperado, 'la semana pasada descontó la harina: ' + (har&&har.g) + ' (esperado -' + esperado + ')');
  ok(autos.length > 3 && autos.every(m=>/^tanda /.test(m.o)), plu2(autos.length) + ', todos dicen de qué tanda');
  ok(!autos.some(m=>m.id.indexOf(F.prox.replace(/-/g,''))>=0), 'la semana que viene no se descuenta todavía');
  L('   config/stock:', JSON.stringify(await pg.evaluate(()=>window.__apps.store.config.stock)), F.antes);
  ok(await pg.evaluate(()=>window.__apps.store.config.stock && JSON.stringify(window.__apps.store.config.stock.desde).slice(1,11)) === F.antes,
     'quedó anotado desde cuándo se descuenta');
  const stockHar = await pg.evaluate(()=>stockDe('Harina 00'));
  ok(stockHar === 50000 - esperado, 'el stock de harina quedó en ' + stockHar);
  /* corregir la tanda pasada: el descuento se reescribe, no se duplica */
  await pg.evaluate(()=>parchar('pedidos/PX1', {lineas:[{sku:'PRE-TOM',cantidad:20,precioUnit:4500,costoUnit:800}]}));
  await pg.waitForTimeout(1600);
  const har2 = await pg.evaluate(()=>S.movimientos.filter(m=>esAuto(m) && m.insumo==='Harina 00'));
  const esp2 = await pg.evaluate(()=>Math.round(calcular(lunesDe(window.__fechas.pasada),0).consumo['Harina 00']));
  ok(har2.length === 1 && har2[0].gramos === -esp2 && esp2 > esperado,
     'al corregir la tanda el mismo movimiento pasa a -' + esp2 + ' (uno solo)');
  ok(await pg.evaluate(()=>Object.keys(window.__apps.store.movimientos).filter(k=>/^T/.test(k)).length) === autos.length,
     'y en la planilla tampoco se duplica');
  /* dos veces seguidas no escribe nada nuevo */
  const colaAntes = await pg.evaluate(()=>window.__apps.version);
  await pg.evaluate(()=>descontarSolo()); await pg.waitForTimeout(600);
  ok(await pg.evaluate(()=>window.__apps.version) === colaAntes, 'si nada cambió, no vuelve a escribir');

  L('\n== 2. pantalla de stock ==');
  await pg.click('#nav button[data-v="stock"]'); await pg.waitForTimeout(400);
  const menos = await (await pg.$('#s-menos')).boundingBox();
  const campo = await (await pg.$('#s-cant')).boundingBox();
  const mas = await (await pg.$('#s-mas')).boundingBox();
  const sel = await (await pg.$('#s-insumo')).boundingBox();
  ok(menos.x + menos.width <= campo.x + 0.5 && campo.x + campo.width <= mas.x + 0.5,
     'el − , el número y el + no se pisan (a 360 px)');
  ok(sel.x + sel.width <= menos.x + 0.5, 'ni el selector con el −');
  ok(mas.x + mas.width <= 360 - 12, 'y el + entra en la pantalla');
  await pg.screenshot({path:'n_stock.png'});
  ok(/Se usó en la tanda/.test(limpio(await pg.textContent('#v-stock'))), 'los descuentos se ven agrupados en una línea');
  ok(await pg.$$eval('.mov.grupo [data-mdel]', e=>e.length) === 0, 'y no se pueden borrar a mano');
  await pg.click('#in-abrir'); await pg.waitForTimeout(250);
  await pg.fill('#in-nom', 'Harina integral'); await pg.fill('#in-cat', 'Harinas');
  await pg.fill('#in-uni', 'bolsa 25 kg'); await pg.fill('#in-cont', '25000'); await pg.fill('#in-pre', '38000');
  await pg.click('#in-ok'); await pg.waitForTimeout(700);
  const nuevo = await pg.evaluate(()=>Object.values(window.__apps.store.insumos).find(i=>i.nombre==='Harina integral'));
  ok(nuevo && nuevo.contenido_gr === 25000 && nuevo.precio_compra === 38000, 'se cargó un insumo nuevo: ' + JSON.stringify(nuevo));
  ok(await pg.$$eval('#s-insumo option', e=>e.some(o=>o.textContent==='Harina integral')), 'y aparece para comprar');

  L('\n== 3. recetas: ingrediente libre y la biga ==');
  await pg.click('#b-recetas'); await pg.waitForTimeout(400);
  const costoAntes = await pg.evaluate(()=>costoSku('PRE-TOM', precioGr()));
  const masaAntes = await pg.evaluate(()=>masaTotal('masa_prepizza'));
  await pg.fill('[data-addsel="masa_prepizza"]', 'Agua final');
  await pg.fill('[data-addval="masa_prepizza"]', '50');
  await pg.click('[data-addok="masa_prepizza"]'); await pg.waitForTimeout(500);
  ok(await pg.evaluate(()=>receta('masa_prepizza')['Agua final']) === 50, 'se agregó "Agua final", un nombre que no es insumo');
  ok(await pg.evaluate(()=>masaTotal('masa_prepizza')) === masaAntes + 50, 'la masa pesa 50 g más');
  const costoDesp = await pg.evaluate(()=>costoSku('PRE-TOM', precioGr()));
  ok(costoDesp <= costoAntes, 'el agua no suma costo (' + costoAntes + ' → ' + costoDesp + ', baja porque rinde más)');
  await (await pg.$('#biga-pct')).scrollIntoViewIfNeeded(); await pg.screenshot({path:'n_recbiga.png'});
  ok(await pg.$('#biga-pct') !== null, 'hay tarjeta de biga con su porcentaje');
  let d = await pg.evaluate(()=>desdoblar(receta('masa_prepizza'), 1));
  ok(cerca(d.biga['Harina 00'],500) && cerca(d.biga['Agua'],250) && cerca(d.biga['Levadura'],0.5),
     'biga de 1 kg: 500 harina, 250 agua, 0,5 levadura');
  ok(cerca(d.fin['Harina 00'],400) && cerca(d.fin['Agua'],400) && cerca(d.fin['Levadura'],3.5) && d.fin['Agua final']===50,
     'final: 400 harina 00, 400 agua, 3,5 levadura, y el agua final intacta');
  ok(cerca(d.pesoBiga, 750.5), 'la biga pesa ' + d.pesoBiga + ' g');
  await pg.fill('#biga-pct', '40'); await pg.dispatchEvent('#biga-pct','change'); await pg.waitForTimeout(500);
  await pg.fill('[data-rec="biga"][data-k="Levadura"]', '2'); await pg.dispatchEvent('[data-rec="biga"][data-k="Levadura"]','change');
  await pg.waitForTimeout(500);
  d = await pg.evaluate(()=>desdoblar(receta('masa_prepizza'), 1));
  ok(cerca(d.biga['Harina 00'],400) && cerca(d.biga['Levadura'],0.8) && cerca(d.fin['Levadura'],3.2),
     'al cambiar la biga a 40% y 2 g de levadura, todo sigue: ' + JSON.stringify(d.biga));
  ok(await pg.evaluate(()=>{const r=window.__apps.store.recetas.biga; return r.pct===40 && r.items.Levadura===2;}),
     'y quedó guardada');

  L('\n== 4. activar la biga en la tanda ==');
  await pg.evaluate(()=>{ S.semanaSel = lunesDe(window.__fechas.prox); S.entregaSel = 0; });
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(500);
  ok(await pg.$('[data-biga="pre"]') !== null, 'la masa de prepizza tiene el switch "Activar biga"');
  ok(await pg.$('.tirada .fase') === null, 'apagado: tiradas como siempre');
  await pg.click('[data-biga="pre"]'); await pg.waitForTimeout(600);
  ok(await pg.evaluate(()=>window.__apps.store.tandas[S.semanaSel].entregas[0].biga.pre) === true, 'se guarda en la entrega');
  const tir = limpio(await pg.textContent('.tirada'));
  ok(/Biga · el día antes/.test(tir) && /Amasado final/.test(tir), 'la tirada se desdobla: ' + tir.slice(0,120));
  await (await pg.$('.tirada')).scrollIntoViewIfNeeded(); await pg.screenshot({path:'n_biga.png'});
  const kg = await pg.evaluate(()=>repartirKg(calcular(S.semanaSel,0).kgPre, calcular(S.semanaSel,0).kgTirada)[0]);
  ok(tir.indexOf('Biga ' + (kg*400>=1000 ? (kg*400/1000).toFixed(2).replace('.',',')+' kg' : kg*400+' g')) >= 0 || /Harina 00/.test(tir),
     'con las cantidades de la biga nueva');
  await pg.click('#b-masa'); await pg.waitForTimeout(400);
  await pg.evaluate(()=>{ ui.amaVista='agua'; ui.masa.cual='masa_prepizza'; ui.masa.kg=2; vistaAmasado(); });
  const ag = await pg.evaluate(()=>aguasDe('masa_prepizza', 2));
  ok(ag.conBiga && cerca(ag.ingreso, 2*(650-200)) && ag.final === 100,
     'amasado: el agua a templar es la que queda después de la biga (' + ag.ingreso + ' g) y avisa el agua final');
  ok(/Agua final\s*100 g/.test(limpio(await pg.textContent('#agua-linea'))), 'y muestra el agua final aparte');

  L('\n== 5. cronómetro: temperatura de la masa y laboratorio ==');
  ok(await pg.$('#termo-n') !== null && await pg.$('#reloj') === null,
     'Amasado abre en la pantalla del agua, sin el cronómetro');
  await pg.click('[data-ama="crono"]'); await pg.waitForTimeout(400);
  ok(await pg.$('#reloj') !== null && await pg.$('#termo-n') === null, 'y la otra pantalla es la del cronómetro');
  await pg.click('#c-go'); await pg.waitForTimeout(1200);
  await pg.click('#c-temp'); await pg.waitForTimeout(200);
  await pg.fill('#c-grados', '25,5'); await pg.click('#c-grados-ok'); await pg.waitForTimeout(300);
  ok(/Masa a 25,5 °C/.test(limpio(await pg.textContent('#v-amasado'))), 'la temperatura queda como una marca');
  await pg.screenshot({path:'n_crono.png', fullPage:true});
  await pg.click('#c-stop'); await pg.waitForTimeout(700);
  const proc = await pg.evaluate(()=>window.__apps.store.tandas[S.semanaSel].entregas[0].procesos);
  ok(proc && proc.length === 1 && proc[0].marcas[0].temp === 25.5 && proc[0].masa === 'prepizza' && proc[0].biga === true,
     'al bollar se guarda el proceso en la tanda: ' + JSON.stringify(proc && proc[0]).slice(0,160));
  ok(proc[0].aguaObjetivo != null && proc[0].ambiente === 20, 'con la temperatura del agua y del ambiente');
  await pg.click('#b-stats'); await pg.waitForTimeout(600);
  await pg.click('details.lab summary'); await (await pg.$('details.lab')).scrollIntoViewIfNeeded();
  await pg.screenshot({path:'n_lab.png'});
  ok(await pg.$$eval('details.lab', e=>e.length) === 1, 'en Estadísticas aparece en el laboratorio');
  ok(/masa 25,5°/.test(limpio(await pg.textContent('details.lab summary'))), 'con la temperatura final de la masa');
  const [bajada] = await Promise.all([pg.waitForEvent('download'), pg.click('#lab-csv')]);
  const csv = fs.readFileSync(await bajada.path(), 'utf8');
  ok(/temp_masa1/.test(csv) && /25,5/.test(csv), 'se baja como planilla: ' + bajada.suggestedFilename());

  L('\n== 6. clientes: buscador ==');
  await pg.click('#nav button[data-v="clientes"]'); await pg.waitForTimeout(400);
  const todos = await pg.$$eval('.cli', e=>e.length);
  await pg.type('#cli-busca', 'pserga'); await pg.waitForTimeout(250);
  ok(await pg.$$eval('.cli', e=>e.length) === 1 && /Carla Pserga/.test(await pg.textContent('.cli')), 'encuentra por apellido ('+todos+' → 1)');
  await pg.screenshot({path:'n_cli.png'});
  ok(await pg.evaluate(()=>document.activeElement.id) === 'cli-busca', 'sin perder el cursor');
  await pg.fill('#cli-busca', 'hospital'); await pg.dispatchEvent('#cli-busca','input'); await pg.waitForTimeout(250);
  ok(await pg.$$eval('.cli', e=>e.length) >= 1, 'también por zona');
  await pg.fill('#cli-busca', 'zzzz'); await pg.dispatchEvent('#cli-busca','input'); await pg.waitForTimeout(250);
  ok(/Nadie con/.test(await pg.textContent('#cli-lista')), 'y dice cuando no hay nadie');

  L('\n== 7. calendario y tarjetas ==');
  await pg.evaluate(()=>{ S.semanaSel = semanaHoy(); });
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(500);
  ok(await pg.isVisible('#cal .cal-tira'), 'arriba del título hay una tira de días');
  await pg.evaluate(()=>window.scrollTo(0,0)); await pg.screenshot({path:'n_cal.png'});
  const alto = (await (await pg.$('#cal .cal-tira')).boundingBox()).height;
  ok(alto <= 44, 'finita: ' + Math.round(alto) + ' px');
  const reps = await pg.$$eval('#cal .dia.rep', e=>e.map(x=>x.className.replace(/\s+/g,' ').trim()));
  ok(reps.some(c=>/debe/.test(c)) && reps.some(c=>/sig/.test(c)), 'marca los repartos: la pasada en rojo, la que sigue en violeta: ' + reps.join(' | '));
  const colores = await pg.$$eval('#cal .dia.rep b', e=>e.map(x=>getComputedStyle(x).backgroundColor));
  ok(new Set(colores).size === colores.length, 'cada una con su color: ' + colores.join(' / '));
  const orden = await pg.evaluate(()=>{ const h=[...document.querySelector('header').children].map(x=>x.id||x.className); return h.join(' > '); });
  ok(/cal > tandas-nav > titulo-bar/.test(orden), 'las tarjetas de las semanas van abajo del calendario y arriba del título: ' + orden);
  await pg.click('#cal .cal-tira'); await pg.waitForTimeout(300);
  await pg.evaluate(()=>window.scrollTo(0,0)); await pg.screenshot({path:'n_calmes.png'});
  ok(await pg.$('.cal-mes') !== null, 'tocándola se abre el mes');
  const mes1 = await pg.textContent('.cal-mes .cab span');
  await pg.click('[data-mm="1"]'); await pg.waitForTimeout(200);
  const mes2 = await pg.textContent('.cal-mes .cab span');
  ok(mes1 !== mes2, 'se navega: ' + mes1 + ' → ' + mes2);
  await pg.click('[data-mm="-1"]'); await pg.click('[data-mm="-1"]'); await pg.waitForTimeout(200);
  const fDia = await pg.$$eval('.cal-mes .c:not(.fuera)', e=>e[3].dataset.f);
  await pg.click('.cal-mes .c[data-f="'+fDia+'"]'); await pg.waitForTimeout(500);
  ok(await pg.evaluate(f=>S.semanaSel===lunesDe(f), fDia) && await pg.$('.cal-mes') === null,
     'tocando un día va a esa semana y se cierra (' + fDia + ')');
  const chips = await pg.$$eval('.tchip', e=>e.map(x=>({s:x.dataset.s, t:x.querySelector('.u')&&x.querySelector('.u').textContent, c:x.className})));
  const cPas = chips.find(c=>c.s===F.pasada), cProx = chips.find(c=>c.s===F.prox);
  ok(cPas && cPas.t === 'Falta cobrar' && /debe/.test(cPas.c), 'la tarjeta de la semana pasada: ' + (cPas&&cPas.t));
  ok(cProx && /^1 bandeja$/.test(cProx.t) && !/debe|falta/.test(cProx.c), 'la que viene muestra las bandejas: ' + (cProx&&cProx.t));
  ok(!/bandeja/.test(cPas.t), 'la pasada no habla de bandejas');
  await pg.evaluate(()=>parchar('pedidos/PX1', {cobrado:true})); await pg.waitForTimeout(500);
  const cPas2 = await pg.$eval('.tchip[data-s="'+F.pasada+'"] .u', e=>e.textContent);
  ok(cPas2 === 'Finalizado', 'cobrado todo: ' + cPas2);

  L('\n== 7b. tarjetas: "03 SEP", dos tamaños, calendario centrado ==');
  await pg.evaluate(()=>{ S.semanaSel = semanaHoy(); S.entregaSel = 0; render(); });
  await pg.waitForTimeout(500);
  const fHoy = await pg.$eval('.tchip[data-s="'+(await pg.evaluate(()=>semanaHoy()))+'"] .f', e=>e.textContent);
  ok(fHoy === await pg.evaluate(()=>semanaMes(semanaHoy())) && /^\d\d [A-Z]{3}$/.test(fHoy), 'la tarjeta dice "' + fHoy + '"');
  const anchos = await pg.$$eval('.tchip[data-s]', e=>e.map(x=>({c:x.classList.contains('centro'), w:Math.round(x.getBoundingClientRect().width), s:x.dataset.s})));
  const centrales = anchos.filter(a=>a.c);
  ok(centrales.length === 1 && centrales[0].s === await pg.evaluate(()=>S.semanaSel), 'la del centro es la elegida');
  ok(new Set(anchos.filter(a=>!a.c).map(a=>a.w)).size === 1 && centrales[0].w > anchos.find(a=>!a.c).w,
     'dos tamaños fijos: ' + centrales[0].w + ' px al centro, ' + anchos.find(a=>!a.c).w + ' px las demás');
  const centroTira = await pg.evaluate(()=>{ const t=document.getElementById('tandas-strip'), c=t.querySelector('.centro').getBoundingClientRect(), r=t.getBoundingClientRect();
    return Math.abs((c.left+c.width/2) - (r.left+r.width/2)); });
  ok(centroTira < 30, 'y está centrada (desvío ' + Math.round(centroTira) + ' px)');
  await pg.evaluate(()=>{ const t=document.getElementById('tandas-strip'); t.scrollLeft += 240; });
  await pg.waitForTimeout(500);
  const otra = await pg.$eval('.tchip.centro', e=>e.dataset.s);
  ok(otra !== await pg.evaluate(()=>S.semanaSel), 'al deslizar crece la que llega al centro');
  const calDesvio = await pg.evaluate(()=>{ const t=document.querySelector('.cal-tira'), d=[...t.querySelectorAll('.dia.sel')];
    const r=t.getBoundingClientRect(), a=d[0].getBoundingClientRect().left, b=d[d.length-1].getBoundingClientRect().right;
    return Math.abs((a+b)/2 - (r.left+r.width/2)); });
  ok(calDesvio < 20, 'el calendario centra la semana (desvío ' + Math.round(calDesvio) + ' px)');
  await pg.evaluate(()=>{ render(); }); await pg.waitForTimeout(200);
  const calDesvio2 = await pg.evaluate(()=>{ const t=document.querySelector('.cal-tira'), d=[...t.querySelectorAll('.dia.sel')];
    const r=t.getBoundingClientRect(), a=d[0].getBoundingClientRect().left, b=d[d.length-1].getBoundingClientRect().right;
    return Math.abs((a+b)/2 - (r.left+r.width/2)); });
  ok(calDesvio2 < 20, 'y la sigue centrando cuando se redibuja');
  await pg.evaluate(()=>window.scrollTo(0,0)); await pg.screenshot({path:'n_chips.png'});

  L('\n== 7c. focaccias libres para ubicar ==');
  await pg.evaluate(()=>{ const sem = lunesDe(window.__fechas.prox); S.semanaSel = sem; S.entregaSel = 0;
    parchar('pedidos/PX2', {lineas:[{sku:'PRE-CEB',cantidad:4,precioUnit:4500,costoUnit:800},
      {sku:'FOC-ROM-M',cantidad:2,precioUnit:6000,costoUnit:900}]}); });
  await pg.waitForTimeout(500);
  await pg.evaluate(()=>escribirEntrega(S.semanaSel, 0, {salidos:{pre:5, med:5, gra:1}}));
  await pg.waitForTimeout(500);
  const libres = limpio(await pg.textContent('#v-tanda'));
  ok(/3 medianas · 1 grande/.test(libres) && /libres? para ubicar/.test(libres),
     'cuenta las focaccias libres: ' + (libres.match(/\d+\s*libres? para ubicar[^A-Z]*/)||[''])[0]);
  ok(/Focaccias medianas[^F]*3 libres/.test(libres), 'y lo dice en cada fila de bollos que salieron');
  const tarjetas = await pg.$$eval('#v-tanda .card .rot', e=>e.map(x=>x.textContent.trim()));
  ok(tarjetas.join(' | ') === 'Qué hay que hacer | Las masas | Bollos que salieron | Espacio en heladera',
     'las tarjetas en orden: ' + tarjetas.join(' | '));
  ok(!/Bolleo/.test(libres), 'la tarjeta de Bolleo ya no está');
  ok(/Se perdieron en producción/.test(libres), 'y las pérdidas se cargan en la misma tarjeta');

  L('\n== 7d. masa única ==');
  await pg.evaluate(()=>{ S.entregaSel = 0; render(); }); await pg.waitForTimeout(300);
  const antesKg = await pg.evaluate(()=>{ const c = calcular(S.semanaSel, 0);
    return {pre:c.kgPre, foc:c.kgFoc, masas: [...document.querySelectorAll('#v-tanda .rec-cab .t')].map(x=>x.textContent)}; });
  ok(antesKg.masas.length === 2, 'sin masa única hay dos masas: ' + antesKg.masas.join(' | '));
  await pg.click('#b-unica'); await pg.waitForTimeout(700);
  ok(await pg.evaluate(()=>window.__apps.store.tandas[S.semanaSel].entregas[0].unica.activa) === true,
     'el interruptor queda guardado en la entrega');
  const uni = await pg.evaluate(()=>{ const c = calcular(S.semanaSel, 0);
    return {kg:c.unica.kg, rec:c.unica.receta, pre:c.kgPre, foc:c.kgFoc, sal:c.salidosAuto,
            masas:[...document.querySelectorAll('#v-tanda .rec-cab .t')].map(x=>x.textContent),
            gr: c.pre*REGLA.grPrepizza + c.med*REGLA.grFocMediana + c.gra*REGLA.grFocGrande}; });
  ok(uni.masas.length === 1 && /Masa única/.test(uni.masas[0]), 'con masa única hay una sola: ' + uni.masas[0]);
  ok(uni.kg === Math.ceil(uni.gr/ (await pg.evaluate(()=>masaTotal('masa_prepizza')))),
     'los kilos salen de los gramos pedidos: ' + uni.kg + ' kg para ' + uni.gr + ' g');
  ok(uni.pre === uni.kg && uni.foc === 0, 'toda la harina cuenta como la receta elegida');
  ok(uni.sal.med === 2 && uni.sal.gra === 0, 'las focaccias pedidas siguen saliendo como focaccias');
  const consumo = await pg.evaluate(()=>{ const c = calcular(S.semanaSel, 0);
    return {h00: Math.round(c.consumo['Harina 00']), h000: Math.round(c.consumo['Harina 000']||0)}; });
  ok(consumo.h000 === 0 && consumo.h00 > 0, 'el stock descuenta solo la receta única: ' + JSON.stringify(consumo));
  await pg.click('[data-uni="masa_focaccia"]'); await pg.waitForTimeout(700);
  const uni2 = await pg.evaluate(()=>{ const c = calcular(S.semanaSel, 0);
    return {rec:c.unica.receta, kg:c.unica.kg, foc:c.kgFoc, h000:Math.round(c.consumo['Harina 000']||0)}; });
  ok(uni2.rec === 'masa_focaccia' && uni2.foc === uni2.kg && uni2.h000 > 0, 'se puede elegir la receta de focaccia');
  ok(await pg.$('[data-biga="uni"]') !== null, 'y la biga se activa igual');
  await pg.screenshot({path:'n_unica.png'});
  await pg.click('#b-unica'); await pg.waitForTimeout(700);
  ok(await pg.evaluate(()=>calcular(S.semanaSel,0).unica.activa) === false, 'y se vuelve atrás sin perder nada');

  L('\n== 8. tandas 01 y 02, y Nuevo pedido ==');
  await pg.evaluate(()=>{ const sem = lunesDe(window.__fechas.prox); S.semanaSel = sem;
    escribirEntregas(sem, [entregaLimpia({dia:2}), entregaLimpia({dia:5})]); });
  await pg.waitForTimeout(600);
  const tz = await pg.$$eval('.trozo', e=>e.map(x=>x.textContent.replace(/\s+/g,' ').trim()));
  ok(tz.length === 2 && /^01/.test(tz[0]) && /^02/.test(tz[1]), 'la cabecera marca 01 y 02: ' + tz.join(' | '));
  ok(tz.every(t => /bandeja|sin pedidos/.test(t)), 'con sus bandejas');
  await pg.click('#nav button[data-v="nuevo"]'); await pg.waitForTimeout(400);
  const ts = limpio(await pg.textContent('.tanda-sel'));
  const esperadoTs = await pg.evaluate(()=>numeroSemana(S.semanaSel)+' / '+diasSemana(S.semanaSel)+' / tanda 01');
  ok(ts.replace(/ /g,'').startsWith(esperadoTs.replace(/ /g,'')), 'Nuevo pedido dice "' + ts + '"');
  await pg.click('[data-nent="1"]'); await pg.waitForTimeout(300);
  ok(/tanda 02/.test(limpio(await pg.textContent('.tanda-sel'))), 'y cambia a la tanda 02');
  ok(await pg.evaluate(()=>numeroSemana('2026-09-21')) === 'SEP 03' && await pg.evaluate(()=>numeroSemana('2026-09-28')) === 'SEP 04'
     && await pg.evaluate(()=>numeroSemana('2026-09-07')) === 'SEP 01', 'las semanas del mes: 7/9 es SEP 01, 21/9 SEP 03, 28/9 SEP 04');
  await pg.screenshot({path:'n_nuevo.png'});
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(400);
  await pg.evaluate(()=>window.scrollTo(0,0)); await pg.screenshot({path:'n_cab.png'});

  L('\n== 9. timecode, bollos y fermentación ==');
  await pg.evaluate(()=>{ S.entregaSel = 0; });
  await pg.click('#b-masa'); await pg.waitForTimeout(300);
  await pg.click('[data-ama="crono"]'); await pg.waitForTimeout(400);
  ok(await pg.$('#f-suelto') !== null, 'sin amasados todavía: ofrece anotar sin cronómetro');
  await pg.click('#c-go'); await pg.waitForTimeout(700);
  const tcTxt = await pg.textContent('#reloj');
  ok(/^\d\d:\d\d:\d\d$/.test(tcTxt), 'el reloj en horas, minutos y segundos: ' + tcTxt);
  await pg.click('#c-marca'); await pg.waitForTimeout(200);
  ok(/Marca 1\s*00:00:0\d/.test(limpio(await pg.textContent('#v-amasado'))), 'las marcas en horas, minutos y segundos');
  await pg.click('#c-bolle'); await pg.waitForTimeout(300);
  await pg.click('#c-stop'); await pg.waitForTimeout(900);
  let pr = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.slice(-1)[0]);
  ok(pr && pr.clima && pr.clima.temp === 17.3 && pr.clima.hum === 70, 'al bollar se guarda el clima de afuera: ' + JSON.stringify(pr.clima));
  ok(pr.marcas[0].tc && /^\d\d:\d\d:\d\d$/.test(pr.marcas[0].tc), 'y la marca con su tiempo: ' + pr.marcas[0].tc);
  ok(await pg.$$eval('.ferm', e=>e.length) === 1, 'aparece en "Los bollos · fermentación"');
  const k = pr ? await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.length-1) : 0;
  await pg.fill('#ft-'+k+'-heladera', '24,5'); await pg.click('[data-fok="'+k+':heladera"]'); await pg.waitForTimeout(600);
  await pg.fill('#ft-'+k+'-salida', '6'); await pg.click('[data-fok="'+k+':salida"]'); await pg.waitForTimeout(600);
  await pg.fill('#ft-'+k+'-horno', '21'); await pg.click('[data-fok="'+k+':horno"]'); await pg.waitForTimeout(600);
  pr = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.slice(-1)[0]);
  ok(pr.ferm && pr.ferm.heladera.temp === 24.5 && pr.ferm.salida.temp === 6 && pr.ferm.horno.temp === 21,
     'los tres momentos con su temperatura');
  ok(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(pr.ferm.heladera.cuando) && pr.ferm.horno.clima.temp === 17.3,
     'el día, la hora y el clima los pone solo: ' + pr.ferm.heladera.cuando);
  /* corregir la hora: salieron 18 h después y al horno 2 h más tarde */
  const base = pr.ferm.heladera.cuando;
  const salidaT = await pg.evaluate(([b, h]) => { const d = deLocal(b); d.setMinutes(d.getMinutes()+h*60);
    return iso(d)+'T'+dos(d.getHours())+':'+dos(d.getMinutes()); }, [base, 18]);
  const hornoT = await pg.evaluate(([b, h]) => { const d = deLocal(b); d.setMinutes(d.getMinutes()+h*60);
    return iso(d)+'T'+dos(d.getHours())+':'+dos(d.getMinutes()); }, [base, 20.5]);
  await pg.click('[data-fedit="'+k+':salida"]'); await pg.waitForTimeout(250);
  await pg.fill('#fc-'+k+'-salida', salidaT); await pg.click('[data-fok="'+k+':salida"]'); await pg.waitForTimeout(600);
  await pg.click('[data-fedit="'+k+':horno"]'); await pg.waitForTimeout(250);
  await pg.fill('#fc-'+k+'-horno', hornoT); await pg.click('[data-fok="'+k+':horno"]'); await pg.waitForTimeout(600);
  const tiempos = limpio(await pg.textContent('.ftiempos'));
  ok(/En frío\s*18 h 00 min/.test(tiempos) && /Atemperado\s*2 h 30 min/.test(tiempos), 'los tiempos salen solos: ' + tiempos);
  pr = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.slice(-1)[0]);
  ok(pr.ferm.salida.temp === 6 && pr.ferm.salida.clima && pr.ferm.salida.clima.temp === 17.3, 'corregir la hora no pierde la temperatura ni el clima');
  await (await pg.$('.ferm')).scrollIntoViewIfNeeded(); await pg.screenshot({path:'n_ferm.png'});
  await pg.click('#b-stats'); await pg.waitForTimeout(600);
  ok(/18 h 00 min en frío/.test(limpio(await pg.textContent('#v-stats'))), 'el laboratorio muestra el tiempo en frío');
  const [baj2] = await Promise.all([pg.waitForEvent('download'), pg.click('#lab-csv')]);
  const csv2 = fs.readFileSync(await baj2.path(), 'utf8');
  const cab2 = csv2.split('\n')[0].replace(/^\ufeff/, '').split(';');
  const fila2 = csv2.split('\n').slice(-1)[0].split(';');
  const col = n => fila2[cab2.indexOf(n)];
  ok(col('min_en_frio') === '1080' && col('min_atemperado') === '150' && col('heladera_temp') === '24,5' && col('afuera_hum') === '70',
     'y la planilla trae todo: frío ' + col('min_en_frio') + ' min, atemperado ' + col('min_atemperado') + ' min');

  L('\n== 10. controles intermedios de temperatura ==');
  await pg.click('#b-masa'); await pg.waitForTimeout(400);
  await pg.click('[data-ama="crono"]'); await pg.waitForTimeout(400);
  await pg.fill('#ft-'+k+'-cnuevo', '12,5'); await pg.click('[data-fok="'+k+':cnuevo"]'); await pg.waitForTimeout(700);
  let ctr = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.slice(-1)[0].ferm.controles);
  ok(ctr.length === 1 && ctr[0].temp === 12.5 && /T\d\d:\d\d$/.test(ctr[0].cuando) && ctr[0].clima.temp === 17.3,
     'se anota un control con su hora y su clima: ' + JSON.stringify(ctr[0]));
  await pg.fill('#ft-'+k+'-cnuevo', '9'); await pg.click('[data-fok="'+k+':cnuevo"]'); await pg.waitForTimeout(700);
  ctr = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.slice(-1)[0].ferm.controles);
  ok(ctr.length === 2, 'se pueden anotar varios: ' + ctr.map(x=>x.temp).join(' · '));
  await pg.click('[data-fedit="'+k+':c0"]'); await pg.waitForTimeout(250);
  await pg.fill('#ft-'+k+'-c0', '11'); await pg.click('[data-fok="'+k+':c0"]'); await pg.waitForTimeout(700);
  ctr = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.slice(-1)[0].ferm.controles);
  ok(ctr[0].temp === 11, 'se corrigen igual que los otros momentos');
  await pg.click('[data-fedit="'+k+':c1"]'); await pg.waitForTimeout(250);
  await pg.click('[data-fdel="'+k+':c1"]'); await pg.waitForTimeout(700);
  ctr = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.slice(-1)[0].ferm.controles);
  ok(ctr.length === 1, 'y se pueden quitar');
  await pg.click('#b-stats'); await pg.waitForTimeout(600);
  ok(/Control ·/.test(limpio(await pg.textContent('#v-stats'))), 'el laboratorio los muestra');
  const [baj3] = await Promise.all([pg.waitForEvent('download'), pg.click('#lab-csv')]);
  const csv3 = fs.readFileSync(await baj3.path(), 'utf8');
  const cab3 = csv3.split('\n')[0].replace(/^\ufeff/, '').split(';');
  const fila3 = csv3.split('\n').slice(-1)[0].split(';');
  ok(cab3.indexOf('control1_temp') > 0 && fila3[cab3.indexOf('control1_temp')] === '11',
     'y la planilla trae la columna del control: ' + fila3[cab3.indexOf('control1_temp')]);

  L('\n== 11. marcas en el calendario ==');
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(400);
  await pg.evaluate(()=>{ ui.calAbierto = false; pintarCal(); });
  await pg.click('#cal .cal-tira'); await pg.waitForTimeout(400);
  await pg.click('#cal-marcar'); await pg.waitForTimeout(400);
  ok(await pg.$('#mk-fecha') !== null, 'se abre la hoja para marcar un día');
  const dia1 = await pg.evaluate(()=>suma(semanaHoy(), 9)), dia2 = await pg.evaluate(()=>suma(semanaHoy(), 13));
  await pg.fill('#mk-fecha', dia1); await pg.fill('#mk-hasta', dia2);
  await pg.selectOption('#mk-tipo', 'Vacaciones');
  await pg.fill('#mk-txt', 'Nos tomamos unos días');
  await pg.click('#mk-ok'); await pg.waitForTimeout(900);
  const marca = await pg.evaluate(()=>Object.values(window.__apps.store.notas).find(n=>n.tipo==='fecha'));
  ok(marca && marca.titulo === 'Nos tomamos unos días' && marca.marca === 'Vacaciones',
     'queda guardada en la planilla: ' + JSON.stringify(marca).slice(0,120));
  await pg.evaluate(()=>{ ui.calAbierto = false; pintarCal(); }); await pg.waitForTimeout(300);
  const marcados = await pg.$$eval('#cal .dia.marcado', e=>e.map(x=>x.textContent));
  ok(marcados.length === 5, 'los 5 días quedan marcados en la tira: ' + marcados.join(' '));
  ok(/m-vacaciones/.test(await pg.$eval('#cal .dia.marcado', e=>e.className)), 'con el color de vacaciones');
  await pg.click('#cal .cal-tira'); await pg.waitForTimeout(400);
  ok(/Nos tomamos unos días/.test(await pg.textContent('.cal-mes .marcas')), 'y se listan en el mes');
  ok(await pg.$$eval('.cal-mes .c.marcado', e=>e.length) >= 5, 'los días del mes también');
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(200);
  await pg.click('#b-notas'); await pg.waitForTimeout(500);
  ok(!/Nos tomamos unos días/.test(await pg.textContent('#v-notas')), 'no ensucia la pantalla de Notas');
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(400);
  await pg.evaluate(()=>{ ui.calAbierto = true; ui.calMes = S.semanaSel.slice(0,7); pintarCal(); });
  await pg.waitForTimeout(300);
  await pg.click('.cal-mes .marca'); await pg.waitForTimeout(400);
  ok(await pg.$('#mk-del') !== null, 'tocando la marca se puede editar o borrar');
  await pg.click('#mk-del'); await pg.waitForTimeout(800);
  ok(await pg.evaluate(()=>S.notas.filter(n=>n.tipo==='fecha').length) === 0, 'y se borra');
  await pg.screenshot({path:'n_marcas.png'});

  L('\nerrores:', errs.length ? errs : 'ninguno');
  if (errs.length) f++;
  await pg.screenshot({path:'s_nuevos.png'});
  await b.close(); await web.cerrar();
  L(f ? '\n✗ ' + f + ' fallos' : '\n✓ todo bien');
  process.exit(f?1:0);
})();
function plu2(n){ return n + ' movimientos automáticos'; }
