/* Los kilos de cada masa puestos a mano: tienen que arrastrar todo lo demás. */
const {chromium} = require('playwright');
const fs = require('fs');
const SEED = require('./_seed.js');
const servir = require('./servidorcito.js');
const L=(...a)=>console.log(...a); let f=0;
const ok=(c,m)=>{ if(!c){f++;L('  ✗ '+m);} else L('  ✓ '+m); };
const limpio = t => t.replace(/\s+/g,' ').trim();

(async () => {
  const web = await servir(__dirname);
  const url = web.base + 'vl_panel_prueba.html';
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:468,height:940}});
  const pg = await ctx.newPage();
  const errs=[]; pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
  pg.on('console', m => { if (m.type()==='error' && !/TUNNEL|fonts|ERR_/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(fs.readFileSync('httpmock.js','utf8'));
  await pg.addInitScript(`window.__semilla = ${JSON.stringify(SEED)};`);
  await pg.addInitScript(`(function(){ const s=window.__apps.store;
    if(!Object.keys(s.productos).length)
      Object.keys(window.__semilla).forEach(k=>{const p=k.split('/'); s[p[0]][p[1]]=window.__semilla[k];});
  })();`);
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:8000});

  // un pedido de 10 prepizzas y 2 focaccias medianas
  await pg.click('#nav button[data-v="nuevo"]'); await pg.waitForTimeout(300);
  await pg.fill('#cli','Cint'); await pg.waitForTimeout(250);
  await pg.click('#sug button'); await pg.waitForTimeout(250);
  for (let i=0;i<10;i++) await pg.click('[data-sku="PRE-TOM"][data-d="1"]');
  await pg.click('#guardar'); await pg.waitForTimeout(900);
  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(500);

  L('== 1. lo que piden marca el piso ==');
  const c0 = await pg.evaluate(()=>calcular(S.semanaSel, 0));
  ok(c0.kgPreAuto === 2, '10 prepizzas piden 2 kg de harina: ' + c0.kgPreAuto);
  ok(c0.kgPre === 2, 'y esos son los kilos mientras no toques nada');
  ok(c0.sobrantes.salen === 10, 'de 2 kg salen ' + c0.sobrantes.salen + ' bollos');
  ok(c0.salidos.pre === 10, 'que son los que van a la heladera');
  ok(c0.bandejas === 2, '10 prepizzas de a 6 son ' + c0.bandejas + ' bandejas');
  ok(await pg.$('[data-kg="pre"]') !== null, 'el chip de kilos está en la masa de prepizzas');
  ok(limpio(await pg.textContent('[data-kg="pre"]')) === '2 kg', 'y dice 2 kg');

  L('\n== 2. amasamos más de lo que pidieron ==');
  await pg.click('[data-kg="pre"]'); await pg.waitForTimeout(300);
  await pg.fill('#in-kg','5');
  await pg.click('#ok-kg'); await pg.waitForTimeout(900);
  const c1 = await pg.evaluate(()=>calcular(S.semanaSel, 0));
  ok(c1.kgPre === 5, 'los kilos quedaron en 5');
  ok(c1.kgPreAuto === 2, 'y sigue sabiendo que los pedidos piden 2');
  ok(c1.sobrantes.salen === 26, 'de 5 kg salen ' + c1.sobrantes.salen + ' bollos');
  ok(c1.sobrantes.libres === 16, 'quedan ' + c1.sobrantes.libres + ' prepizzas libres para ubicar');
  ok(c1.bandejas === 5, '26 bollos de a 6 son ' + c1.bandejas + ' bandejas');
  ok(await pg.evaluate(()=>window.__apps.store.tandas[S.semanaSel].entregas[0].kgPreManual) === 5,
     'y quedó guardado en la planilla');

  L('\n== 3. el stock y las tiradas siguen a los kilos ==');
  ok(Math.round(c1.consumo['Harina 00']) === 4500,
     '5 kg piden 4.500 g de harina 00: ' + Math.round(c1.consumo['Harina 00']));
  const tiradas = await pg.$$eval('.tirada', e=>e.length);
  ok(tiradas === 2, '5 kg se parten en ' + tiradas + ' tiradas de 4 kg como tope');
  const t1 = limpio(await pg.textContent('.tirada:first-child'));
  ok(/3 kg de harina/.test(t1) || /2 kg de harina/.test(t1), 'y cada una dice sus kilos: ' + t1.slice(0,40));

  L('\n== 4. volver al cálculo automático ==');
  await pg.click('[data-kg="pre"]'); await pg.waitForTimeout(300);
  ok(limpio(await pg.textContent('#auto-kg')) === 'Volver a 2', 'ofrece volver a lo que piden');
  await pg.click('#auto-kg'); await pg.waitForTimeout(900);
  const c2 = await pg.evaluate(()=>calcular(S.semanaSel, 0));
  ok(c2.kgPre === 2 && c2.kgPreManual === null, 'volvió a 2 kg');
  ok(c2.bandejas === 2, 'y la heladera vuelve a 2 bandejas');

  L('\n== 5. los bollos que salieron se corrigen a mano ==');
  /* de la masa de prepizza salió una focaccia mediana */
  await pg.click('[data-sal="med"][data-d="1"]'); await pg.waitForTimeout(600);
  await pg.click('[data-sal="pre"][data-d="-1"]'); await pg.waitForTimeout(600);
  const cs = await pg.evaluate(()=>calcular(S.semanaSel, 0));
  ok(cs.salidos.pre === 9 && cs.salidos.med === 1,
     '9 prepizzas y 1 mediana: ' + JSON.stringify(cs.salidos));
  ok(cs.bandejas === 3, 'ahora son ' + cs.bandejas + ' bandejas (2 de prepizza + 1 de mediana)');
  ok(cs.salidosAMano === true, 'y sabe que el número es tuyo');
  await pg.click('#auto-sal'); await pg.waitForTimeout(700);
  ok(await pg.evaluate(()=>calcular(S.semanaSel, 0).salidos.pre) === 10, 'y se puede volver atrás');

  L('\n== 5b. el total de bandejas también se puede fijar ==');
  await pg.click('#b-band'); await pg.waitForTimeout(300);
  await pg.fill('#in-band','4');
  await pg.click('#ok-band'); await pg.waitForTimeout(900);
  const c3 = await pg.evaluate(()=>calcular(S.semanaSel, 0));
  ok(c3.bandejas === 4 && c3.bandejasManual === 4, 'quedó en 4 puesto a mano');
  ok(c3.bandejasAuto === 2, 'y guarda el automático para comparar: ' + c3.bandejasAuto);

  L('\n== 6. sobrevive a cerrar la app ==');
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:8000});
  await pg.waitForTimeout(400);
  const c4 = await pg.evaluate(()=>calcular(S.semanaSel, 0));
  ok(c4.bandejas === 4, 'las bandejas siguen en 4');
  await pg.click('[data-kg="pre"]'); await pg.waitForTimeout(300);
  await pg.fill('#in-kg','6'); await pg.click('#ok-kg'); await pg.waitForTimeout(900);
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:8000});
  await pg.waitForTimeout(400);
  const c5 = await pg.evaluate(()=>calcular(S.semanaSel, 0));
  ok(c5.kgPre === 6 && c5.bandejasManual === 4,
     'los kilos a mano y las bandejas a mano conviven: ' + c5.kgPre + ' kg · '
     + c5.bandejas + ' bandejas');

  await b.close(); await web.cerrar();
  L('\nerrores: ' + (errs.length?errs.join(' | '):'ninguno')); if (errs.length) f++;
  L(f ? '\n✗ ' + f + ' fallos' : '\n✓ todo bien');
  process.exit(f?1:0);
})();
