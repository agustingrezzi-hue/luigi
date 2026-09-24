const {chromium} = require('playwright');
const fs = require('fs');
const path = 'file://' + require('path').resolve('panel2.html');
const SEED = require('./_seed.js');

const L = (...a)=>console.log(...a);
const limpio = t => t.replace(/\s+/g,' ').trim();

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({viewport:{width:468,height:940}});
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR: '+(e&&e.message)+' @ '+(((e&&e.stack)||'').split('\n')[1]||'')));
  pg.on('console', m => { if (m.type()==='error' && !/TUNNEL|fonts|ERR_/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(fs.readFileSync('mockdb.js','utf8'));
  await pg.addInitScript(`window.__seed = ${JSON.stringify(SEED)};
    Object.assign(window.__store = window.__store||{}, window.__seed);`);
  await pg.goto(path); await pg.waitForTimeout(900);

  L('errores tras cargar:', errs.length?errs:'ninguno');

  L('\n===== 1. CABECERA Y SEMANAS =====');
  L('pantalla:', await pg.textContent('#pantalla'), '| título:', await pg.textContent('#titulo'),
    '·', await pg.textContent('#subtitulo'));
  L('pill:', await pg.textContent('#pill'));
  L('clase de la barra (esta semana):', await pg.getAttribute('#titulo-bar','class'));
  L('tira:', limpio(await pg.$$eval('.tchip', e=>e.map(x=>x.textContent).join(' | '))));
  const chips = await pg.$$('.tchip[data-s]');
  await chips[1].click(); await pg.waitForTimeout(250);
  L('al pasar a una semana pasada →', await pg.getAttribute('#titulo-bar','class'),
    '· pill:', await pg.textContent('#pill'));
  L('color de la barra en semana cerrada:', await pg.$eval('#titulo-bar', e=>getComputedStyle(e).backgroundColor));
  L('color del chip pasado:', await pg.$$eval('.tchip.pasada', e=>e.length
    ? getComputedStyle(e[0]).backgroundColor+' / texto '+getComputedStyle(e[0]).color
    : 'no hay semanas pasadas en la tira (las vacías se esconden)'));
  await pg.screenshot({path:'v_cerrada.png', clip:{x:0,y:0,width:468,height:230}});
  await pg.$$eval('.tchip.esta', e=>{ if (e[0]) e[0].click(); }); await pg.waitForTimeout(250);
  L('vuelta a la actual →', await pg.getAttribute('#titulo-bar','class'));

  L('\n===== 2. DÍA DE ENTREGA (manteniendo apretada la tanda) =====');
  L('módulo aparte en la pantalla Tanda:', await pg.$$eval('#v-tanda .dias', e=>e.length) ? 'SIGUE (mal)' : 'no está (bien)');
  L('por defecto:', limpio(await pg.textContent('#subtitulo')));
  const chipAct = await pg.$('.tchip.esta');
  const caja = await chipAct.boundingBox();
  await pg.mouse.move(caja.x+caja.width/2, caja.y+caja.height/2);
  await pg.mouse.down(); await pg.waitForTimeout(700); await pg.mouse.up();
  await pg.waitForTimeout(300);
  L('hoja abierta:', await pg.$('.hoja') ? 'sí' : 'NO');
  L('título de la hoja:', limpio(await pg.textContent('.hoja h2')), '·', limpio(await pg.textContent('.hoja .s')));
  await pg.click('.hoja [data-ent="0"][data-dia="3"]'); await pg.waitForTimeout(450);
  L('sigue abierta para tocar otra:', await pg.$('.hoja') ? 'sí' : 'NO');
  await pg.click('#mas-entrega'); await pg.waitForTimeout(500);
  L('con dos entregas:', await pg.$$eval('.entrega-fila', e=>e.length));
  await pg.click('.hoja [data-quitar="1"]'); await pg.waitForTimeout(500);
  L('y de vuelta a una:', await pg.$$eval('.entrega-fila', e=>e.length));
  await pg.mouse.click(5, 5); await pg.waitForTimeout(350);
  L('hoja cerrada al tocar afuera:', await pg.$('.hoja') ? 'NO' : 'sí');
  L('cambiado a miércoles:', limpio(await pg.textContent('#subtitulo')));
  L('guardado en la base:', JSON.stringify(await pg.evaluate(()=>{
    const k = Object.keys(window.__store).find(k=>k.startsWith('tandas/'));
    return {k, v:window.__store[k]}; })));
  L('la tanda no cambió de semana:', await pg.textContent('#titulo'));

  L('\n===== 3. CREAR TANDA A 3 MESES =====');
  await pg.click('#mas-tanda'); await pg.waitForTimeout(300);
  L('vista previa:', limpio(await pg.textContent('#nt-vista')));
  await pg.click('#nt-ok'); await pg.waitForTimeout(400);
  L('tras crear, título:', await pg.textContent('#titulo'), '· pill:', await pg.textContent('#pill'));
  await pg.$$eval('.tchip.esta', e=>{ if (e[0]) e[0].click(); }); await pg.waitForTimeout(250);

  L('\n===== 4. PEDIDO NORMAL =====');
  await pg.click('#nav button[data-v="nuevo"]'); await pg.waitForTimeout(250);
  await pg.fill('#cli','Cint'); await pg.waitForTimeout(200);
  await pg.click('#sug button'); await pg.waitForTimeout(250);
  L('orden de prepizzas en el formulario:', await pg.$$eval('#v-nuevo .step .t', e=>e.map(x=>x.textContent).join(' → ')));
  for (let i=0;i<4;i++) await pg.click('[data-sku="PRE-TOM"][data-d="1"]');
  await pg.click('#add-foc'); await pg.waitForTimeout(150);
  await pg.selectOption('[data-i="0"][data-k="tam"]','Grande'); await pg.waitForTimeout(200);
  L('total (4 pre + 1 foc grande + envío):', await pg.textContent('.total .v'));
  await pg.click('#guardar'); await pg.waitForTimeout(450);
  L('tiles:', limpio(await pg.$$eval('.tile', e=>e.map(x=>x.textContent).join(' | '))));

  L('\n===== 5. PEDIDO SIN CARGO (desde Nuevo) =====');
  await pg.click('#nav button[data-v="nuevo"]'); await pg.waitForTimeout(250);
  await pg.fill('#cli','Feli'); await pg.waitForTimeout(200);
  await pg.click('#sug button'); await pg.waitForTimeout(250);
  for (let i=0;i<2;i++) await pg.click('[data-sku="PRE-CEB"][data-d="1"]');
  await pg.click('[data-nm="sin"]'); await pg.waitForTimeout(250);
  L('total con sin cargo:', await pg.textContent('.total .v'),
    '· clase:', await pg.getAttribute('.total','class'));
  await pg.click('#guardar'); await pg.waitForTimeout(450);
  L('tiles:', limpio(await pg.$$eval('.tile', e=>e.map(x=>x.textContent).join(' | '))));
  L('chip del pedido regalado:', await pg.$$eval('.chip.regalo', e=>e.map(x=>x.textContent).join(' / ')));

  L('\n===== 6. BONIFICAR UN PEDIDO YA CARGADO =====');
  const idPed = await pg.$$eval('[data-cobro]', e=>e[0].dataset.cobro);
  await pg.click('[data-cobro="'+idPed+'"]'); await pg.waitForTimeout(250);
  await pg.fill('#cm-'+idPed, '30000');
  await pg.click('[data-cmok="'+idPed+'"]'); await pg.waitForTimeout(450);
  L('tarjeta:', limpio(await pg.$$eval('.ped', e=>e[0].textContent)).slice(0,150));
  L('tiles:', limpio(await pg.$$eval('.tile', e=>e.map(x=>x.textContent).join(' | '))));

  L('\n===== 7. PRODUCCIÓN, BOLLEO Y CAPACIDAD =====');
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(350);
  L('qué hay que hacer:', limpio(await pg.$$eval('#v-tanda .fila', e=>e.map(x=>x.textContent).join(' ; '))));
  L('bloques:', limpio(await pg.$$eval('.rec-cab', e=>e.map(x=>x.textContent).join(' | '))));
  L('bolleo:', limpio(await pg.$$eval('#v-tanda .card:nth-last-child(4) .rec-row', e=>e.map(x=>x.textContent).join(' · '))));
  L('orden de la receta en la tirada:', await pg.$$eval('.tirada:first-child .rec-row span:first-child', e=>e.map(x=>x.textContent).join(' → ')));
  L('medidor:', limpio(await pg.textContent('.medidor')), '·', limpio(await pg.textContent('#v-tanda .pie')));
  // heladera editable
  await pg.click('#b-cap'); await pg.waitForTimeout(250);
  await pg.fill('#in-cap','20'); await pg.click('#ok-cap'); await pg.waitForTimeout(450);
  L('heladera a 20:', limpio(await pg.textContent('.medidor')), '·', limpio(await pg.textContent('#v-tanda .pie')));
  L('guardada en la base:', await pg.evaluate(()=>window.__store['config/reglas'].valores.bandejasHeladera));
  // bollos que salieron, a mano
  L('salidas:', limpio(await pg.$$eval('.salida', e=>e.map(x=>x.textContent).join(' | '))));
  await pg.click('[data-sal="med"][data-d="1"]'); await pg.waitForTimeout(450);
  L('sumando una mediana:', limpio(await pg.textContent('.medidor')));
  await pg.click('#auto-sal'); await pg.waitForTimeout(450);
  L('vuelto al automático:', limpio(await pg.textContent('.medidor')));
  // bandejas a mano
  await pg.click('#b-band'); await pg.waitForTimeout(250);
  await pg.fill('#in-band','9'); await pg.click('#ok-band'); await pg.waitForTimeout(450);
  L('bandejas fijadas a mano:', limpio(await pg.textContent('.medidor')));
  await pg.click('#b-band'); await pg.waitForTimeout(250);
  await pg.click('#auto-band'); await pg.waitForTimeout(450);
  L('y de vuelta:', limpio(await pg.textContent('.medidor')));

  L('\n===== 8. STOCK: sumar, descontar, corregir, deshacer =====');
  await pg.click('#nav button[data-v="stock"]'); await pg.waitForTimeout(350);
  await pg.click('#s-cargar'); await pg.waitForTimeout(400);
  const stockDe = async n => limpio(await pg.$$eval('.st', (e,n)=>{
    const x = e.find(s=>s.querySelector('.n').textContent===n); return x? x.querySelector('.q').textContent:'—';}, n));
  L('primero del selector:', await pg.$eval('#s-insumo option', o=>o.textContent));
  L('tras sumar 1 compra del primero (harina):', await stockDe('Harina 00'));
  await pg.click('[data-sg="-1"]'); await pg.waitForTimeout(200);
  await pg.click('#s-cargar'); await pg.waitForTimeout(400);
  L('tras descontar la misma cantidad:', await stockDe('Harina 00'));
  L('movimientos listados:', await pg.$$eval('.mov', e=>e.length));
  await pg.click('[data-precio="I01"]'); await pg.waitForTimeout(250);
  await pg.fill('#ns-I01','12500'); await pg.click('[data-fix="I01"]'); await pg.waitForTimeout(450);
  L('harina corregida a 12,5 kg →', await stockDe('Harina 00'));
  await pg.$$eval('[data-mdel]', e=>e[0].click()); await pg.waitForTimeout(400);
  L('tras deshacer el último movimiento →', await stockDe('Harina 00'),
    '· movimientos:', await pg.$$eval('.mov', e=>e.length));
  L('¿quedó la tabla de márgenes?', await pg.$$eval('#v-stock .fila', e=>e.length) ? 'SÍ (mal)' : 'no (bien)');
  L('orden del stock:', await pg.$$eval('#v-stock .grupo, #v-stock .st .n',
      e=>e.map(x=>x.className==='grupo'?('['+x.textContent+']'):x.textContent).join(' · ')));
  await pg.click('[data-precio="I01"]'); await pg.waitForTimeout(200);
  await pg.fill('#np-I01','60000'); await pg.click('[data-save="I01"]'); await pg.waitForTimeout(450);
  L('precio de la harina cambiado a $60.000 (afecta costos nuevos)');

  L('\n===== 8b. GRAMAJES =====');
  await pg.click('#b-recetas'); await pg.waitForTimeout(450);
  L('reglas:', limpio(await pg.$$eval('[data-reg]', e=>e.map(x=>x.dataset.reg+'='+x.value).join(' · '))));
  L('rindes calculados:', limpio(await pg.$$eval('#v-recetas .agua .rec-row', e=>e.map(x=>x.textContent).join(' | '))));
  L('orden en el editor (prepizza):', await pg.$$eval('[data-rec="masa_prepizza"]', e=>e.map(x=>x.dataset.k).join(' → ')));
  L('orden en el editor (focaccia):', await pg.$$eval('[data-rec="masa_focaccia"]', e=>e.map(x=>x.dataset.k).join(' → ')));
  L('lugares declarados:', await pg.$$eval('[data-reg^="lugar"]', e=>e.map(x=>x.dataset.reg+'='+x.value).join(' · ')));
  await pg.fill('[data-reg="grPrepizza"]','280');
  await pg.dispatchEvent('[data-reg="grPrepizza"]','change'); await pg.waitForTimeout(550);
  L('bajando el bollo a 280 g:', limpio(await pg.$$eval('#v-recetas .agua .rec-row', e=>e[0].textContent)));
  await pg.fill('[data-reg="grPrepizza"]','320');
  await pg.dispatchEvent('[data-reg="grPrepizza"]','change'); await pg.waitForTimeout(550);
  L('vuelta a 320 g:', limpio(await pg.$$eval('#v-recetas .agua .rec-row', e=>e[0].textContent)));
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(300);

  L('\n===== 9. RECETAS =====');
  await pg.click('#b-recetas'); await pg.waitForTimeout(450);
  L('pantalla:', await pg.textContent('#pantalla'), '| h1 oculto:', await pg.$eval('#titulo', e=>e.hidden),
    '·', await pg.textContent('#subtitulo'));
  L('bloques:', await pg.$$eval('.badge-costo', e=>e.slice(0,3).map(x=>x.textContent).join(' | ')));
  const costoAntes = await pg.$$eval('.badge-costo', e=>e[0].textContent);
  await pg.fill('[data-rec="masa_prepizza"][data-k="Harina 00"]','800');
  await pg.dispatchEvent('[data-rec="masa_prepizza"][data-k="Harina 00"]','change');
  await pg.waitForTimeout(500);
  L('costo de la prepizza antes/después de bajar la harina a 800 g:',
    costoAntes, '→', await pg.$$eval('.badge-costo', e=>e[0].textContent));
  await pg.fill('[data-addsel="masa_prepizza"]','Miel');
  await pg.fill('[data-addval="masa_prepizza"]','5');
  await pg.click('[data-addok="masa_prepizza"]'); await pg.waitForTimeout(450);
  L('ingredientes de la masa ahora:', await pg.$$eval('[data-rec="masa_prepizza"]', e=>e.map(x=>x.dataset.k).join(', ')));
  await pg.click('[data-recdel="masa_prepizza"][data-k="Miel"]'); await pg.waitForTimeout(450);
  L('tras quitar la miel:', await pg.$$eval('[data-rec="masa_prepizza"]', e=>e.map(x=>x.dataset.k).join(', ')));
  await pg.fill('[data-reg="envio"]','3000');
  await pg.dispatchEvent('[data-reg="envio"]','change'); await pg.waitForTimeout(500);
  L('envío en la base:', JSON.stringify(await pg.evaluate(()=>window.__store['config/reglas'].valores.envio)));

  L('\n===== 10. ESTADÍSTICAS =====');
  L('errores hasta acá:', errs.length?errs:'ninguno');
  await pg.click('#b-stats'); await pg.waitForTimeout(600);
  L('vista:', await pg.evaluate(()=>document.querySelector('.vista.on').id));
  L('pedidos en la base:', await pg.evaluate(()=>Object.keys(window.__store).filter(k=>k.startsWith('pedidos/')).map(k=>k+' → '+window.__store[k].tanda).join(' | ')));
  L('html:', (await pg.innerHTML('#v-stats')).slice(0,200));
  L('hero:', limpio(await pg.textContent('.hero')));
  L('tiles:', limpio(await pg.$$eval('#v-stats .tile', e=>e.map(x=>x.textContent).join(' | '))));
  L('columnas:', await pg.$$eval('.col', e=>e.length), '· barras clientes:', await pg.$$eval('#v-stats .hb', e=>e.length));
  L('tabla insumos:', limpio(await pg.$$eval('#v-stats .tabla tbody tr', e=>e.slice(0,3).map(x=>x.textContent).join(' | '))));

  L('\n===== 11. CLIENTES: eliminar =====');
  await pg.click('#nav button[data-v="clientes"]'); await pg.waitForTimeout(350);
  const antesCli = await pg.$$eval('.cli', e=>e.length);
  await pg.$$eval('.cli', e=>e[e.length-1].click()); await pg.waitForTimeout(300);
  await pg.click('#c-borrar'); await pg.waitForTimeout(250);
  L('confirmación:', limpio(await pg.textContent('.confirm')));
  await pg.click('#c-borrar-si'); await pg.waitForTimeout(450);
  L('clientes antes/después:', antesCli, '→', await pg.$$eval('.cli', e=>e.length));
  L('\n===== 12. HISTÓRICO DE LAS PLANILLAS =====');
  L('fila de cliente con histórico:', limpio(await pg.$$eval('.cli .hx', e=>e[0].textContent)));
  L('cuántos marcados dormidos:', await pg.$$eval('.cli .hx em', e=>e.length));
  await pg.$$eval('.cli', e=>e[1].click()); await pg.waitForTimeout(300);
  L('ficha:', limpio(await pg.$$eval('#v-clientes .agua', e=>e.length? e[0].textContent : 'sin bloque')));
  await pg.click('#c-volver'); await pg.waitForTimeout(250);
  await pg.click('#b-stats'); await pg.waitForTimeout(500);
  L('bloque previo:', limpio((await pg.$$eval('#v-stats .card', e=>e[e.length-1].textContent))).slice(0,260));

  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(300);
  await pg.screenshot({path:'v_tanda.png', fullPage:true});
  await pg.click('#b-stats'); await pg.waitForTimeout(400);
  await pg.screenshot({path:'v_stats.png', fullPage:true});
  await pg.click('#b-recetas'); await pg.waitForTimeout(400);
  await pg.screenshot({path:'v_recetas.png', fullPage:true});
  await pg.click('#nav button[data-v="pedidos"]'); await pg.waitForTimeout(400);
  await pg.screenshot({path:'v_pedidos.png', fullPage:true});

  L('\nERRORES FINALES:', errs.length?errs:'ninguno');
  await b.close();
})();
