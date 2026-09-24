/* Corre VL_API2.gs fuera de Google, fingiendo ser Apps Script. */
const fs = require('fs');

/* ---------- planilla falsa ---------- */
function Hoja(nombre){
  this.nombre = nombre; this.filas = [['id']]; this.texto = false;
}
Hoja.prototype.getName = function(){ return this.nombre; };
Hoja.prototype.getMaxRows = function(){ return Math.max(1000, this.filas.length); };
Hoja.prototype.getMaxColumns = function(){ return Math.max(26, this.getLastColumn()); };
Hoja.prototype.getLastRow = function(){ return this.filas.length; };
Hoja.prototype.getLastColumn = function(){
  return this.filas.reduce((a,f)=>Math.max(a,f.length), 0); };
Hoja.prototype.rellenar_ = function(){
  const w = this.getLastColumn();
  this.filas.forEach(f => { while (f.length < w) f.push(''); });
};
Hoja.prototype.getRange = function(f, c, nf, nc){
  const h = this;
  nf = nf || 1; nc = nc || 1;
  return {
    getValues(){
      const out = [];
      for (let i=0;i<nf;i++){
        const fila = h.filas[f-1+i] || [];
        const r = [];
        for (let j=0;j<nc;j++) r.push(fila[c-1+j] === undefined ? '' : fila[c-1+j]);
        out.push(r);
      }
      return out;
    },
    setValues(v){
      for (let i=0;i<v.length;i++){
        while (h.filas.length < f+i) h.filas.push([]);
        const fila = h.filas[f-1+i];
        for (let j=0;j<v[i].length;j++) fila[c-1+j] = h.comoSheets_(v[i][j]);
      }
      h.rellenar_();
    },
    setValue(v){ this.setValues([[v]]); },
    setFontWeight(){ return this; },
    setNumberFormat(f){ if (f === '@') h.texto = true; return this; },
  };
};
/* Google Sheets no guarda texto plano: si escribís "2026-09-14" en una celda
   lo convierte en fecha, y te vuelve un objeto Date. Eso mismo hace esta falsa,
   porque si no las pruebas pasan y la planilla de verdad falla. */
Hoja.prototype.comoSheets_ = function(v){
  /* Con la hoja en formato texto, Sheets guarda TODO como texto: los true/false
     vuelven como las palabras "true"/"false" y los números como su texto.
     Comprobado leyendo db_PEDIDOS de la planilla de verdad el 15/9. */
  if (this.texto){
    if (typeof v === 'boolean') return String(v);
    if (typeof v === 'number') return String(v);
    return v;
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)){
    const p = v.split('-').map(Number);
    return new Date(p[0], p[1]-1, p[2]);
  }
  return v;
};
Hoja.prototype.getDataRange = function(){
  this.rellenar_();
  return this.getRange(1, 1, Math.max(1,this.filas.length), Math.max(1,this.getLastColumn()));
};
Hoja.prototype.appendRow = function(v){ this.filas.push(v.slice()); this.rellenar_(); };
Hoja.prototype.deleteRow = function(f){ this.filas.splice(f-1, 1); };
Hoja.prototype.deleteRows = function(f, n){ this.filas.splice(f-1, n); };
Hoja.prototype.setFrozenRows = function(){ return this; };
Hoja.prototype.insertRowsAfter = function(){ return this; };
Hoja.prototype.insertColumnsAfter = function(){ return this; };
Hoja.prototype.autoResizeColumns = function(){ return this; };
Hoja.prototype.clear = function(){ this.filas = [['id']]; };

const HOJAS = {};
global.SpreadsheetApp = {
  getActiveSpreadsheet(){
    return {
      getSheetByName: n => HOJAS[n] || null,
      insertSheet: n => (HOJAS[n] = new Hoja(n)),
    };
  },
  getUi(){ return {alert(){}, createMenu(){ return {addItem(){return this;},
    addSeparator(){return this;}, addToUi(){}}; }, ButtonSet:{YES_NO:1}, Button:{YES:1}}; },
};
const PROPS = {};
global.PropertiesService = {getScriptProperties: () => ({
  getProperty: k => PROPS[k], setProperty: (k,v) => { PROPS[k]=v; } })};
global.LockService = {getScriptLock: () => ({waitLock(){}, releaseLock(){}})};
global.ContentService = {
  MimeType:{JSON:'json'},
  createTextOutput: t => ({ texto:t, setMimeType(){ return this; } }),
};
let ARCHIVO_PANEL = null;
global.HtmlService = {
  createHtmlOutputFromFile(n){
    if (ARCHIVO_PANEL == null) throw new Error('no existe ' + n);
    return {getContent: () => ARCHIVO_PANEL};
  },
  createHtmlOutput(h){ return {html:h, setTitle(){return this;},
    addMetaTag(){return this;},
    setXFrameOptionsMode(m){ this.marco = (m === 1 ? 'ALLOWALL' : m); return this; },
    setFaviconUrl(u){ this.favicon = u; return this; }}; },
  XFrameOptionsMode:{ALLOWALL:1},
};
global.ScriptApp = {getService: () => ({getUrl: () => 'https://script.google.com/macros/s/XYZ/exec'})};
global.Logger = {log: (...a) => console.log('  [log]', ...a)};

/* ---------- cargar el código ---------- */
eval(fs.readFileSync('VL_API2.gs','utf8'));

const R = t => JSON.parse(t.texto);
const L = (...a) => console.log(...a);
let fallos = 0;
function ok(cond, msg){ if (!cond){ fallos++; L('  ✗ ' + msg); } else L('  ✓ ' + msg); }

L('== inicializar ==');
inicializar();
ok(Object.keys(HOJAS).length === 10, 'crea las 10 hojas: ' + Object.keys(HOJAS).join(', '));

L('\n== escribir documentos ==');
let r = R(doPost({postData:{contents: JSON.stringify({op:'set', col:'productos', id:'PRE-TOM',
  datos:{sku:'PRE-TOM', nombre:'Prepizza Tomate y Albahaca', tipo:'Prepizza',
         tamano:'Única', precio:4500, orden:1}})}}));
ok(r.ok && r.version === 1, 'set productos/PRE-TOM · version ' + r.version);

r = R(doPost({postData:{contents: JSON.stringify({ops:[
  {op:'set', col:'productos', id:'PRE-CEB', datos:{sku:'PRE-CEB', nombre:'Prepizza Mix de Cebollas',
    tipo:'Prepizza', tamano:'Única', precio:4500, orden:2}},
  {op:'set', col:'clientes', id:'cintia', datos:{nombre:'Cintia', zona:'Centro',
    direccion1:'Sarmiento 653', direccion2:'', tipo:'Particular'}},
  {op:'set', col:'insumos', id:'I01', datos:{nombre:'Harina 00', unidad_compra:'bolsa 25 kg',
    contenido_gr:25000, precio_compra:42000}},
]})}}));
ok(r.ok && r.hechas === 3, 'lote de 3 documentos · version ' + r.version);

L('\n== documento con lista adentro (las líneas del pedido) ==');
const pedido = {tanda:'2026-09-14', clienteId:'cintia', cliente:'Cintia', envio:2000,
  direccion:'Sarmiento 653', formaPago:'Transferencia', observaciones:'Tocar timbre',
  lineas:[{sku:'PRE-TOM', cantidad:4, precioUnit:4500, costoUnit:981},
          {sku:'PRE-CEB', cantidad:2, precioUnit:4500, costoUnit:794}],
  sinCargo:false, totalManual:null, preparado:false, entregado:false, cobrado:false};
r = R(doPost({postData:{contents: JSON.stringify({op:'set', col:'pedidos', id:'P1', datos:pedido})}}));
ok(r.ok, 'set pedidos/P1');

let todo = R(doGet({parameter:{r:'todo'}}));
let p = todo.datos.pedidos[0];
ok(Array.isArray(p.lineas) && p.lineas.length === 2 && p.lineas[0].sku === 'PRE-TOM',
   'las líneas vuelven como lista: ' + JSON.stringify(p.lineas[0]));
ok(p.cliente === 'Cintia' && p.envio === 2000, 'los campos simples vuelven tal cual');
ok(todo.datos.productos.length === 2 && todo.datos.clientes.length === 1,
   'leerTodo trae las 8 colecciones con su contenido');

L('\n== update no pisa lo que no mandás ==');
r = R(doPost({postData:{contents: JSON.stringify({op:'update', col:'pedidos', id:'P1',
  datos:{cobrado:true}})}}));
todo = R(doGet({parameter:{r:'todo'}}));
p = todo.datos.pedidos[0];
ok(p.cobrado === true && p.lineas.length === 2 && p.cliente === 'Cintia',
   'cobrado=true y las líneas siguen ahí');

L('\n== columnas nuevas sobre la marcha ==');
r = R(doPost({postData:{contents: JSON.stringify({op:'update', col:'pedidos', id:'P1',
  datos:{descuentoCharlado:'un invento nuevo'}})}}));
todo = R(doGet({parameter:{r:'todo'}}));
ok(todo.datos.pedidos[0].descuentoCharlado === 'un invento nuevo',
   'un campo que no existía se agrega solo como columna');

L('\n== recetas y reglas (objetos anidados) ==');
r = R(doPost({postData:{contents: JSON.stringify({ops:[
  {op:'set', col:'recetas', id:'masa_prepizza', datos:{items:{'Harina 00':900,'Agua':650,'Sal':30}}},
  {op:'set', col:'config', id:'reglas', datos:{valores:{grPrepizza:320, lugarFocGrande:3, envio:2000}}},
]})}}));
todo = R(doGet({parameter:{r:'todo'}}));
ok(todo.datos.recetas[0].items['Harina 00'] === 900, 'la receta vuelve como objeto');
ok(todo.datos.config[0].valores.grPrepizza === 320, 'las reglas vuelven como objeto');

L('\n== borrar ==');
r = R(doPost({postData:{contents: JSON.stringify({op:'delete', col:'clientes', id:'cintia'})}}));
todo = R(doGet({parameter:{r:'todo'}}));
ok(todo.datos.clientes.length === 0, 'el cliente se borró');
ok(todo.datos.pedidos.length === 1, 'el pedido sigue (guarda el nombre, no la ficha)');

L('\n== versión: el panel pregunta si cambió algo antes de bajar todo ==');
const v1 = R(doGet({parameter:{r:'version'}})).version;
R(doPost({postData:{contents: JSON.stringify({op:'update', col:'pedidos', id:'P1',
  datos:{entregado:true}})}}));
const v2 = R(doGet({parameter:{r:'version'}})).version;
ok(v2 === v1 + 1, 'la versión sube con cada escritura: ' + v1 + ' → ' + v2);

L('\n== PIN ==');
CFG.pin = '4821';
ok(R(doGet({parameter:{r:'todo'}})).error === 'pin', 'sin PIN no deja leer');
ok(R(doPost({postData:{contents: JSON.stringify({op:'delete', col:'pedidos', id:'P1'})}})).error === 'pin',
   'sin PIN no deja escribir');
ok(R(doGet({parameter:{r:'todo', pin:'4821'}})).ok, 'con el PIN correcto sí');
CFG.pin = '';

L('\n== servir el panel ==');
let salida = servirPanel();
ok(/Falta el archivo/.test(salida.html), 'sin el archivo panel avisa qué hacer');
ARCHIVO_PANEL = '<html><script>window.__VL_API="__VL_BASE__";window.__VL_PIN="__VL_PIN__";</script></html>';
salida = servirPanel();
ok(salida.html.indexOf('https://script.google.com/macros/s/XYZ/exec') > 0,
   'le inyecta su propia URL al panel');
ok(salida.html.indexOf('__VL_BASE__') < 0, 'no queda ningún marcador sin reemplazar');
/* el ícono no se pone acá: Apps Script rechaza las imágenes de Drive.
   Lo pone la paginita de GitHub que envuelve al panel. */
ok(!salida.favicon, 'no intenta poner ícono (Apps Script lo rechaza)');
ok(salida.marco === 'ALLOWALL', 'deja que la paginita lo muestre adentro del marco');

L('\n== guardar por la dirección, para los teléfonos que no dejan salir el POST ==');
const antes = R(doGet({parameter:{r:'version'}})).version;
r = R(doGet({parameter:{r:'escribir', ops: JSON.stringify([
  {op:'set', col:'clientes', id:'pato', datos:{nombre:'Pato Urtasun', zona:'UNLu'}},
  {op:'update', col:'pedidos', id:'P1', datos:{preparado:true}},
])}}));
ok(r.ok && r.hechas === 2, 'acepta un lote por la dirección · ' + JSON.stringify(r));
todo = R(doGet({parameter:{r:'todo'}}));
ok(todo.datos.clientes.length === 1 && todo.datos.clientes[0].nombre === 'Pato Urtasun',
   'el cliente quedó guardado');
ok(todo.datos.pedidos[0].preparado === true && todo.datos.pedidos[0].lineas.length === 2,
   'el update no pisó las líneas');
ok(R(doGet({parameter:{r:'version'}})).version === antes + 1, 'y sube la versión igual que el POST');
ok(R(doGet({parameter:{r:'escribir', ops:'esto no es json'}})).error.indexOf('operaciones') >= 0,
   'si el lote viene roto lo dice');

L('\n== fechas: la planilla las convierte y hay que devolverlas como texto ==');
/* una hoja escrita ANTES de marcarla como texto, como la de Agus */
HOJAS['db_TANDAS'].texto = false;
HOJAS['db_TANDAS'].filas = [['id','diaEntrega'], ['2026-09-14', 5]];
HOJAS['db_TANDAS'].filas[1][0] = HOJAS['db_TANDAS'].comoSheets_('2026-09-14');
ok(Object.prototype.toString.call(HOJAS['db_TANDAS'].filas[1][0]) === '[object Date]',
   'la planilla guardó la semana como fecha, no como texto');
todo = R(doGet({parameter:{r:'todo'}}));
ok(todo.datos.tandas[0].id === '2026-09-14',
   'al leer vuelve como la esperamos: ' + todo.datos.tandas[0].id);
/* y escribirle encima no duplica la fila */
R(doGet({parameter:{r:'escribir', ops: JSON.stringify([
  {op:'update', col:'tandas', id:'2026-09-14', datos:{diaEntrega:4}}])}}));
todo = R(doGet({parameter:{r:'todo'}}));
ok(todo.datos.tandas.length === 1 && todo.datos.tandas[0].diaEntrega === 4,
   'la encuentra y la corrige, no crea una fila nueva: ' + todo.datos.tandas.length + ' fila(s)');
/* de acá en adelante la hoja queda en texto */
R(doGet({parameter:{r:'escribir', ops: JSON.stringify([
  {op:'set', col:'pedidos', id:'P9', datos:{tanda:'2026-09-21', cliente:'Prueba', lineas:[]}}])}}));
todo = R(doGet({parameter:{r:'todo'}}));
const p9 = todo.datos.pedidos.filter(function(x){ return x.id === 'P9'; })[0];
ok(p9 && p9.tanda === '2026-09-21', 'un pedido nuevo guarda la semana como texto: ' + (p9 && p9.tanda));
R(doGet({parameter:{r:'escribir', ops: JSON.stringify([
  {op:'delete', col:'pedidos', id:'P9'}])}}));   /* lo sacamos: era solo la prueba */

L('\n== sí/no y números que la planilla guardó como texto ==');
/* tal cual quedó en db_PEDIDOS de la planilla real: todo texto */
function filaCruda(hoja, valores){
  const h = HOJAS[hoja], cab = h.filas[0];
  Object.keys(valores).forEach(k => { if (cab.indexOf(k) < 0) cab.push(k); });
  h.filas.push(cab.map(c => valores[c] === undefined ? '' : valores[c]));
  h.rellenar_();
}
filaCruda('db_PEDIDOS', {
  id:'Ptexto', cliente:'Manu Escola', creado:'2026-09-15T18:34:29.432Z',
  cobrado:'false', tanda:'2026-09-14', clienteId:'manu-escola',
  lineas:'@json:[{"sku":"PRE-CEB","cantidad":2,"precioUnit":4500,"costoUnit":794}]',
  envio:'0', sinCargo:'false', preparado:'false', entregado:'false'});
todo = R(doGet({parameter:{r:'todo'}}));
const pt = todo.datos.pedidos.filter(function(x){ return x.id === 'Ptexto'; })[0];
ok(pt.preparado === false && pt.entregado === false && pt.cobrado === false,
   'los tres estados vuelven en false de verdad, no como texto');
ok(pt.sinCargo === false, 'y sin cargo también');
ok(pt.envio === 0, 'el envío vuelve número: ' + JSON.stringify(pt.envio));
ok(pt.creado === '2026-09-15T18:34:29.432Z', 'la fecha larga queda intacta');
ok(pt.cliente === 'Manu Escola', 'y el nombre sigue siendo texto');
/* lo que parece número pero no lo es se queda como está */
filaCruda('db_CLIENTES', {id:'tel-raro', nombre:'Con teléfono', telefono:'02323-0456',
  tipo:'Particular'});
todo = R(doGet({parameter:{r:'todo'}}));
const cr = todo.datos.clientes.filter(function(x){ return x.id === 'tel-raro'; })[0];
ok(cr.telefono === '02323-0456', 'un teléfono no se convierte en número: ' + cr.telefono);
/* y al escribir un false, vuelve false */
R(doGet({parameter:{r:'escribir', ops: JSON.stringify([
  {op:'update', col:'pedidos', id:'Ptexto', datos:{cobrado:true}}])}}));
todo = R(doGet({parameter:{r:'todo'}}));
const pt2 = todo.datos.pedidos.filter(function(x){ return x.id === 'Ptexto'; })[0];
ok(pt2.cobrado === true && pt2.preparado === false,
   'marcar cobrado no enciende los otros: ' + JSON.stringify({c:pt2.cobrado, p:pt2.preparado}));
R(doGet({parameter:{r:'escribir', ops: JSON.stringify([
  {op:'delete', col:'pedidos', id:'Ptexto'}])}}));

L('\n== errores con nombre ==');
const rechazo = cuerpo => (R(doPost({postData:{contents: JSON.stringify(cuerpo)}})).rechazadas || [{}])[0].error || '';
ok(rechazo({op:'set', col:'inventada', id:'x', datos:{}}).indexOf('inventada') >= 0,
   'colección desconocida');
ok(rechazo({op:'set', col:'pedidos', datos:{}}).indexOf('id') >= 0, 'falta el id');

L('\n== uno malo no traba a los demás ==');
const vAntes = R(doGet({parameter:{r:'version'}})).version;
r = R(doPost({postData:{contents: JSON.stringify({ops:[
  {op:'set', col:'notas_que_no_existen', id:'N1', datos:{titulo:'x'}},
  {op:'set', col:'clientes', id:'bueno1', datos:{nombre:'Entra igual'}},
  {op:'set', col:'clientes', id:'bueno2', datos:{nombre:'También'}},
]})}}));
ok(r.ok && r.hechas === 2, 'entran los dos buenos: ' + JSON.stringify({hechas:r.hechas}));
ok(r.rechazadas.length === 1 && r.rechazadas[0].i === 0,
   'y dice cuál no: ' + JSON.stringify(r.rechazadas));
todo = R(doGet({parameter:{r:'todo'}}));
ok(todo.datos.clientes.some(c=>c.id==='bueno1') && todo.datos.clientes.some(c=>c.id==='bueno2'),
   'los dos están en la planilla');
ok(R(doGet({parameter:{r:'version'}})).version === vAntes + 1, 'y la versión sube una vez');
r = R(doPost({postData:{contents: JSON.stringify({op:'set', col:'nada', id:'x', datos:{}})}}));
ok(r.hechas === 0 && R(doGet({parameter:{r:'version'}})).version === vAntes + 1,
   'si no entra ninguno, la versión no se mueve');
R(doGet({parameter:{r:'escribir', ops: JSON.stringify([
  {op:'delete', col:'clientes', id:'bueno1'}, {op:'delete', col:'clientes', id:'bueno2'}])}}));
ok(R(doGet({parameter:{r:'loquesea'}})).error.indexOf('loquesea') >= 0, 'r desconocido');

L('\n== un lote mezclado se escribe en memoria y de una ==');
{
  const H = HOJAS['db_MOVIMIENTOS'];
  /* tres de base */
  R(doPost({postData:{contents: JSON.stringify({ops:[
    {op:'set', col:'movimientos', id:'A', datos:{insumo:'Harina 00', gramos:100}},
    {op:'set', col:'movimientos', id:'B', datos:{insumo:'Sal', gramos:200}},
    {op:'set', col:'movimientos', id:'C', datos:{insumo:'Levadura', gramos:300}},
  ]})}}));
  /* contar cuántas veces se toca la hoja */
  let llamadas = 0;
  const orig = Hoja.prototype.getRange;
  Hoja.prototype.getRange = function(){ llamadas++; return orig.apply(this, arguments); };
  const origBorrar = Hoja.prototype.deleteRow;
  Hoja.prototype.deleteRow = function(){ llamadas++; return origBorrar.apply(this, arguments); };
  const ops = [
    {op:'update', col:'movimientos', id:'A', datos:{gramos:111}},
    {op:'delete', col:'movimientos', id:'B'},
    {op:'set',    col:'movimientos', id:'D', datos:{insumo:'Gas', gramos:-5, origen:'tanda'}},
    {op:'update', col:'movimientos', id:'D', datos:{fecha:'2026-09-17'}},
    {op:'set',    col:'movimientos', id:'E', datos:{insumo:'Tomate', gramos:1}},
    {op:'delete', col:'movimientos', id:'E'},
    {op:'update', col:'movimientos', id:'C', datos:{nota:'columna nueva'}},
    {op:'update', col:'movimientos', id:'Z', datos:{insumo:'Nuevo por update', gramos:9}},
  ];
  for (let i=0;i<20;i++) ops.push({op:'set', col:'movimientos', id:'T'+i, datos:{insumo:'Sal', gramos:-i}});
  const r2 = R(doPost({postData:{contents: JSON.stringify({ops})}}));
  Hoja.prototype.getRange = orig; Hoja.prototype.deleteRow = origBorrar;
  ok(r2.ok && r2.hechas === ops.length && !r2.rechazadas.length, ops.length + ' cambios en un envío');
  ok(llamadas <= 8, 'tocando la planilla ' + llamadas + ' veces (antes eran más de 3 por cambio)');
  const docs = {}; R(doGet({parameter:{r:'todo'}})).datos.movimientos.forEach(d => docs[d.id] = d);
  ok(docs.A && docs.A.gramos === 111 && docs.A.insumo === 'Harina 00', 'el update conserva lo que no tocó');
  ok(!docs.B && !docs.E, 'lo borrado no está, ni lo que se creó y se borró en el mismo lote');
  ok(docs.D && docs.D.gramos === -5 && docs.D.fecha === '2026-09-17' && docs.D.origen === 'tanda',
     'set seguido de update se juntan: ' + JSON.stringify(docs.D));
  ok(docs.C && docs.C.nota === 'columna nueva' && docs.C.gramos === 300, 'columna nueva sin pisar el resto');
  ok(docs.Z && docs.Z.gramos === 9, 'update de algo que no existía lo crea');
  ok(docs.T19 && docs.T19.gramos === -19 && Object.keys(docs).filter(k=>/^T\d/.test(k)).length === 20, 'los 20 de corrido');
  ok(H.filas.length === 1 + 3 - 1 + 2 + 20, 'sin filas de más: ' + (H.filas.length-1) + ' movimientos');
  ok(!H.filas.some(f => !f[0]), 'sin filas vacías en el medio');
  /* un segundo lote sobre lo que quedó, borrando del medio y agregando */
  const r3 = R(doPost({postData:{contents: JSON.stringify({ops:[
    {op:'delete', col:'movimientos', id:'T5'}, {op:'delete', col:'movimientos', id:'T6'},
    {op:'update', col:'movimientos', id:'T7', datos:{gramos:77}},
    {op:'set', col:'movimientos', id:'F', datos:{insumo:'Miel', gramos:3}},
  ]})}}));
  const d2 = {}; R(doGet({parameter:{r:'todo'}})).datos.movimientos.forEach(d => d2[d.id] = d);
  ok(r3.ok && !d2.T5 && !d2.T6 && d2.T7.gramos === 77 && d2.T8.gramos === -8 && d2.F.gramos === 3,
     'borrar del medio no corre los demás');
}

L('\n== resumen legible ==');
R(doPost({postData:{contents: JSON.stringify({op:'set', col:'pedidos', id:'P2',
  datos:{tanda:'2026-09-14', cliente:'Bife Padel', envio:0, sinCargo:true, lineas:[
    {sku:'PRE-TOM', cantidad:10, precioUnit:4500, costoUnit:981}]}})}}));
const n = armarResumen();
const hres = HOJAS['PEDIDOS (legible)'];
ok(n === 3, 'expande una línea por producto: ' + n + ' líneas');
ok(hres.filas[1][2] === 'Prepizza Tomate y Albahaca', 'usa el nombre del producto, no el SKU');
ok(hres.filas[3][7] === 0, 'el pedido sin cargo cuenta $0');

L('\n== lo que llama el panel ==');
let a = apiLeer('');
ok(a.ok && a.datos.pedidos.length === 2, 'apiLeer devuelve todo · ' + a.datos.pedidos.length + ' pedidos');
const vA = apiVersion('').version;
a = apiEscribir('', [{op:'update', col:'pedidos', id:'P1', datos:{preparado:true}},
                     {op:'delete', col:'pedidos', id:'P2'}]);
ok(a.ok && a.hechas === 2, 'apiEscribir aplica un lote de 2');
ok(apiVersion('').version === vA + 1, 'y sube la versión una sola vez por lote');
ok(apiLeer('').datos.pedidos.length === 1, 'quedó 1 pedido');
CFG.pin = '4821';
ok(apiLeer('').error === 'pin' && apiEscribir('', []).error === 'pin', 'respetan el PIN');
ok(apiLeer('4821').ok, 'y pasan con el PIN correcto');
CFG.pin = '';
a = apiEscribir('', [{op:'set', col:'inventada', id:'x', datos:{}}]);
ok(a.ok && a.rechazadas[0].error.indexOf('inventada') >= 0, 'un error en el lote vuelve con nombre');

L('\n== importar (para migrar desde Claude) ==');
Object.keys(HOJAS).forEach(k => delete HOJAS[k]);
inicializar();
const cuantos = importar({
  productos:[{id:'PRE-TOM', sku:'PRE-TOM', nombre:'x', precio:4500}],
  clientes:[{id:'a', nombre:'A'}, {id:'b', nombre:'B'}],
  pedidos:[{id:'P9', tanda:'2026-09-14', cliente:'A', lineas:[{sku:'PRE-TOM', cantidad:2}]}],
});
todo = R(doGet({parameter:{r:'todo'}}));
ok(cuantos === 4, 'importa 4 documentos');
ok(todo.datos.clientes.length === 2 && todo.datos.pedidos[0].lineas[0].cantidad === 2,
   'quedan enteros después de la importación');


L('\n== VL_DATOS.gs: la semilla real ==');
Object.keys(HOJAS).forEach(k => delete HOJAS[k]);
inicializar();
eval(fs.readFileSync('VL_DATOS.gs','utf8').replace(/SpreadsheetApp\.getActiveSpreadsheet\(\)\.toast[\s\S]*?;/, ';'));
const cargados = cargarDatos();
const t2 = R(doGet({parameter:{r:'todo'}})).datos;
ok(cargados === 170, 'carga 170 documentos de una: ' + cargados);
ok(t2.productos.length === 16 && t2.insumos.length === 25 && t2.clientes.length === 109,
   '16 productos · 25 insumos · 109 clientes');
ok(t2.recetas.length === 19, '19 recetas (3 masas + 16 toppings)');
const rp = t2.recetas.filter(r => r.id === 'masa_prepizza')[0];
ok(rp && rp.items['Harina 00'] === 900, 'la masa de prepizza llegó entera');
const reg = t2.config[0].valores;
ok(reg.grPrepizza === 320 && reg.lugarFocGrande === 3, 'las reglas con los gramajes y los lugares');
const har = t2.insumos.filter(i => i.nombre === 'Harina 00')[0];
ok(har && har.precio_compra === 42000 && har.contenido_gr === 25000, 'la harina con su precio real');
const bife = t2.clientes.filter(c => c.nombre === 'Bife Padel')[0];
ok(bife && /pedidos/.test(bife.historico||''), 'los clientes traen su histórico: ' + (bife||{}).historico);
const tom = t2.productos.filter(p => p.sku === 'PRE-TOM')[0];
ok(tom && tom.precio === 4500 && tom.orden === 1, 'PRE-TOM $4.500 y primera en el orden');

L('\n' + (fallos ? '✗ ' + fallos + ' fallos' : '✓ todo bien'));
process.exit(fallos ? 1 : 0);
