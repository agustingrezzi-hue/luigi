/* La pantalla de amasado y los kilos a mano. */
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
  const ctx = await b.newContext({viewport:{width:468,height:940},
    permissions:[], reducedMotion:'reduce'});
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
  await pg.waitForTimeout(600);

  L('== 1. la calculadora de temperatura ==');
  await pg.click('#b-masa'); await pg.waitForTimeout(400);
  ok(limpio(await pg.textContent('#pantalla')) === 'Amasado', 'la cabecera dice AMASADO');
  ok(await pg.$('#tandas-nav[style*="none"]') !== null, 'esconde la tira de semanas');
  await pg.fill('#g-amb','22'); await pg.dispatchEvent('#g-amb','input');
  await pg.fill('#g-har','20'); await pg.dispatchEvent('#g-har','input');
  await pg.waitForTimeout(200);
  // 3 × 24 − (22 + 20 + 9) = 21
  ok(await pg.textContent('#termo-n') === '21', 'sin prefermento: 3 factores → ' + await pg.textContent('#termo-n'));
  ok(limpio(await pg.textContent('#termo-cuenta')) === '3 × 24 − (22 + 20 + 9) = 21',
     'muestra la cuenta: ' + limpio(await pg.textContent('#termo-cuenta')));

  L('\n== 2. con biga entra un factor más ==');
  await pg.click('#g-usapref'); await pg.waitForTimeout(350);
  await pg.fill('#g-pref','18'); await pg.dispatchEvent('#g-pref','input');
  await pg.waitForTimeout(200);
  // 4 × 24 − (22 + 20 + 18 + 9) = 27
  ok(await pg.textContent('#termo-n') === '27', 'con prefermento: 4 factores → ' + await pg.textContent('#termo-n'));

  L('\n== 3. el agua y el hielo de la tirada ==');
  await pg.fill('#g-kg','4'); await pg.dispatchEvent('#g-kg','input');
  await pg.waitForTimeout(250);
  const linea = limpio(await pg.textContent('#agua-linea'));
  ok(/Agua\s*2,60 kg/.test(linea), 'agua de 4 kg de prepizza (650 g/kg): ' + linea.slice(0,60));
  // pedimos un agua bien fría para que pida hielo
  await pg.fill('#g-amb','30'); await pg.dispatchEvent('#g-amb','input');
  await pg.fill('#g-pref','30'); await pg.dispatchEvent('#g-pref','input');
  await pg.fill('#g-har','30'); await pg.dispatchEvent('#g-har','input');
  await pg.waitForTimeout(250);
  ok(Number(await pg.textContent('#termo-n')) < 0, 'da bajo cero: ' + await pg.textContent('#termo-n'));
  const bajo = limpio(await pg.textContent('#agua-linea'));
  ok(/Revisá los grados/.test(bajo) && !/Hielo/.test(bajo), 'avisa corto en vez de inventar hielo: ' + bajo);
  // ahora una combinación real que sí pida hielo
  await pg.fill('#g-amb','28'); await pg.dispatchEvent('#g-amb','input');
  await pg.fill('#g-har','26'); await pg.dispatchEvent('#g-har','input');
  await pg.fill('#g-pref','24'); await pg.dispatchEvent('#g-pref','input');
  await pg.waitForTimeout(250);
  const obj = Number(await pg.textContent('#termo-n'));
  ok(obj > 0 && obj < 18, 'objetivo por debajo de la canilla: ' + obj + ' °C');
  const conHielo = limpio(await pg.textContent('#agua-linea'));
  ok(/Agua\s*[\d,.]+ (kg|g)\s*Hielo\s*[\d,.]+ (kg|g)$/.test(conHielo) && !/canilla/.test(conHielo),
     'solo el valor del hielo, sin explicación: ' + conHielo);

  L('\n== 4. las reglas de la casa se guardan ==');
  await pg.fill('#g-tdm','25'); await pg.dispatchEvent('#g-tdm','change');
  await pg.waitForTimeout(800);
  ok(await pg.evaluate(()=>window.__apps.store.config.reglas.valores.tdm) === 25,
     'la temperatura deseada quedó en la planilla');
  ok(await pg.evaluate(()=>REGLA.tdm) === 25, 'y se aplica al toque, sin recargar');
  ok(/^4 × 25/.test(limpio(await pg.textContent('#termo-cuenta'))),
     'la cuenta ya usa el número nuevo: ' + limpio(await pg.textContent('#termo-cuenta')));
  await pg.fill('#g-tdm','24'); await pg.dispatchEvent('#g-tdm','change');
  await pg.waitForTimeout(700);

  L('\n== 5. el cronómetro y sus avisos ==');
  await pg.click('[data-ama="crono"]'); await pg.waitForTimeout(400);
  await pg.evaluate(()=>{ try { localStorage.removeItem('vl_crono'); } catch(e){} cargaCrono(); });
  const nPasos = await pg.$$eval('#lista-pasos .paso', e=>e.length);
  ok(nPasos === 3, 'arranca con 3 avisos: ' + nPasos);
  // ponemos el primero a 0 minutos y arrancamos: tiene que sonar solo
  await pg.fill('#lista-pasos .paso:first-child input.m','0');
  await pg.dispatchEvent('#lista-pasos .paso:first-child input.m','change');
  await pg.waitForTimeout(700);
  await pg.click('#c-go'); await pg.waitForTimeout(900);
  ok(await pg.$('.alarma') !== null, 'saltó la alarma');
  ok(await pg.evaluate(()=>!!CRONO.sonando), 'y sigue sonando hasta que le des OK');
  ok(/Agregar el agua/.test(await pg.textContent('.alarma')),
     'con el texto del paso: ' + limpio(await pg.textContent('.alarma')));
  ok(limpio(await pg.textContent('#c-go')) === 'Pausar', 'el botón pasa a Pausar');
  ok(await pg.evaluate(()=>{
      const a = document.getElementById('alarma'), n = document.getElementById('nav');
      return a.getBoundingClientRect().bottom <= n.getBoundingClientRect().top + 1;
    }), 'no tapa la botonera de abajo');
  await pg.click('#alarma-ok'); await pg.waitForTimeout(300);
  ok(await pg.$('.alarma') === null, 'se cierra con Listo');
  ok(await pg.evaluate(()=>!CRONO.sonando), 'y recién ahí deja de sonar');
  ok(await pg.evaluate(()=>CRONO.marcas.length) === 1,
     'el paso queda marcado con su tiempo');

  L('\n== 6. el aviso llega desde otra pantalla ==');
  await pg.fill('#lista-pasos .paso:nth-child(2) input.m','0');
  await pg.dispatchEvent('#lista-pasos .paso:nth-child(2) input.m','change');
  await pg.waitForTimeout(600);
  await pg.click('#nav button[data-v="clientes"]'); await pg.waitForTimeout(900);
  ok(await pg.$('.alarma') !== null, 'suena estando en Clientes');
  ok(/Sal/.test(await pg.textContent('.alarma')), 'y dice qué toca: ' + limpio(await pg.textContent('.alarma')));
  await pg.click('#alarma-ok'); await pg.waitForTimeout(250);

  L('\n== 7. el cronómetro sobrevive a cerrar la app ==');
  const antes = await pg.evaluate(()=>cronoMs());
  await pg.goto(url);
  await pg.waitForFunction(()=>{try{return S.listo===true}catch(e){return false}},null,{timeout:8000});
  await pg.click('#b-masa'); await pg.waitForTimeout(500);
  ok(await pg.$('#reloj') !== null, 'la app vuelve a abrir en la pantalla del cronómetro');
  const despues = await pg.evaluate(()=>cronoMs());
  ok(despues > antes, 'siguió contando: ' + Math.round(antes/1000) + 's → ' + Math.round(despues/1000) + 's');
  ok(limpio(await pg.textContent('#c-go')) === 'Pausar', 'y sigue corriendo');
  L('\n== 7b. Bollé marca, Stop cierra y guarda el total ==');
  await pg.evaluate(()=>{ CRONO.acumulado = 47*60000; CRONO.desde = Date.now();
    guardaCrono(); vistaAmasado(); });
  await pg.waitForTimeout(400);
  ok(/^\d\d:\d\d:\d\d$/.test(await pg.textContent('#reloj')), 'el reloj va en segundos: ' + await pg.textContent('#reloj'));
  await pg.click('#c-bolle'); await pg.waitForTimeout(400);
  ok(await pg.evaluate(()=>CRONO.corriendo) && await pg.evaluate(()=>!!CRONO.bolle), 'Bollé marca el momento y el reloj sigue');
  ok(/Bollé · 00:47/.test(limpio(await pg.textContent('#c-bolle'))), 'el botón muestra cuándo: ' + limpio(await pg.textContent('#c-bolle')));
  await pg.click('#c-stop'); await pg.waitForTimeout(900);
  ok(await pg.evaluate(()=>cronoMs()) === 0, 'el reloj queda en cero');
  const guardado = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].minutos);
  ok(guardado === 47, 'y el total quedó en la entrega: ' + guardado + ' min');
  const pr = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.slice(-1)[0]);
  ok(pr.minBolle === 47 && pr.marcas.some(m=>m.que==='Bollé'), 'con el minuto de bollado aparte');

  L('\n== 7c. Cancelar un falso comienzo ==');
  const nProc = await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.length);
  await pg.click('#c-go'); await pg.waitForTimeout(600);
  await pg.click('#c-cancel'); await pg.waitForTimeout(200);
  ok(await pg.$('#c-cancel-si') !== null, 'pide confirmar');
  await pg.click('#c-cancel-si'); await pg.waitForTimeout(400);
  ok(await pg.evaluate(()=>cronoMs()) === 0 && await pg.evaluate(()=>!CRONO.corriendo), 'vuelve a cero');
  ok(await pg.evaluate(()=>entregasDe(S.semanaSel)[0].procesos.length) === nProc, 'sin guardar nada');
  ok(limpio(await pg.textContent('#c-go')) === 'Arrancar', 'listo para arrancar de nuevo');
  ok(await pg.evaluate(()=>window.__apps.store.tandas[S.semanaSel].entregas[0].minutos) === 47,
     'también en la planilla');

  L('\n== 8. los avisos son compartidos ==');
  ok(await pg.evaluate(()=>window.__apps.store.config.pasos.lista.length) === 3,
     'están en la planilla, no en el teléfono');
  await pg.click('#p-nuevo'); await pg.waitForTimeout(700);
  ok(await pg.evaluate(()=>window.__apps.store.config.pasos.lista.length) === 4,
     'agregar uno lo manda a la planilla');

  await b.close();
  L('\nerrores: ' + (errs.length?errs.join(' | '):'ninguno')); if (errs.length) f++;
  await web.cerrar();
  L(f ? '\n✗ ' + f + ' fallos' : '\n✓ todo bien');
  process.exit(f?1:0);
})();
