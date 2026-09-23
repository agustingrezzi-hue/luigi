const {chromium} = require('playwright');
const fs = require('fs');
const SEED = require('./_seed.js');
const path = 'file://' + require('path').resolve('panel2.html');

// 10 semanas de pedidos falsos para ver los gráficos con datos
const hoy = new Date(); const dow = (hoy.getDay()+6)%7;
const lunes = new Date(hoy); lunes.setDate(lunes.getDate()-dow);
const iso = d => d.toISOString().slice(0,10);
const NOMS = ['Cintia','Bife Padel','Feli Gusmerini','Vicky Marazzo','Pato Urtasun','Ro Grezzi'];
SEED['clientes/CL4']={nombre:'Vicky Marazzo',tipo:'Particular',zona:'Centro',direccion1:'',direccion2:'',telefono:'',notas:''};
SEED['clientes/CL5']={nombre:'Pato Urtasun',tipo:'Particular',zona:'UNLu',direccion1:'',direccion2:'',telefono:'',notas:''};
SEED['clientes/CL6']={nombre:'Ro Grezzi',tipo:'Particular',zona:'Centro',direccion1:'',direccion2:'',telefono:'',notas:''};
let n=0;
for (let w=9; w>=0; w--){
  const d = new Date(lunes); d.setDate(d.getDate()-w*7);
  const sem = iso(d);
  const cuantos = 3 + (w%4);
  for (let i=0;i<cuantos;i++){
    const cli = NOMS[(w+i) % (w<3?3:NOMS.length)];   // los últimos 3 clientes se "duermen"
    const pre = 2 + ((w+i)%5)*2;
    const lineas = [{sku:'PRE-TOM',cantidad:pre,precioUnit:4500,costoUnit:1006}];
    if (i%2) lineas.push({sku:'FOC-CHE-M',cantidad:1+(i%3),precioUnit:6000,costoUnit:1120});
    if (i%3===0) lineas.push({sku:'FOC-ROQ-G',cantidad:1,precioUnit:16000,costoUnit:4024});
    SEED['pedidos/PX'+(n++)] = {tanda:sem, clienteId:'CL1', cliente:cli, envio:(i%2)?2000:0,
      direccion:'', formaPago:'Transferencia', observaciones:'', lineas,
      sinCargo:(w===4 && i===0), totalManual:null,
      preparado:true, entregado:true, cobrado:w>0, creado:sem};
  }
}
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({viewport:{width:468,height:940}});
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
  await pg.addInitScript(fs.readFileSync('mockdb.js','utf8'));
  await pg.addInitScript(`window.__seed = ${JSON.stringify(SEED)};
    Object.assign(window.__store = window.__store||{}, window.__seed);`);
  await pg.goto(path); await pg.waitForTimeout(900);
  await pg.click('#b-stats'); await pg.waitForTimeout(600);
  console.log('hero:', (await pg.textContent('.hero')).replace(/\s+/g,' '));
  console.log('columnas:', await pg.$$eval('.col', e=>e.length));
  console.log('ejes:', await pg.$$eval('.ejes span', e=>e.map(x=>x.textContent).join(' ')));
  console.log('dormidos:', await pg.$$eval('#v-stats .tabla', e=>e.length)>1 ? 'sí' : 'no');
  console.log('segmentos (alto px g/c):', JSON.stringify(await pg.$$eval('.col', e=>e.map(c=>{
    const g=c.querySelector('.seg-g'), k=c.querySelector('.seg-c');
    return Math.round(g.getBoundingClientRect().height)+'/'+Math.round(k.getBoundingClientRect().height);
  }))));
  await pg.screenshot({path:'v_stats2.png', fullPage:true});

  await pg.click('#nav button[data-v="tanda"]'); await pg.waitForTimeout(400);
  await pg.screenshot({path:'v_tanda2.png'});
  await pg.click('#b-stats'); await pg.waitForTimeout(400);
  await pg.evaluate(()=>{document.querySelector('.nav').style.display='none';});
  await (await pg.$('.card:has(.cols)')).screenshot({path:'v_chart.png'});
  console.log('errores:', errs.length?errs:'ninguno');
  await b.close();
})();
