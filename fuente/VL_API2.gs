/**
 * VAMOS LUIGI · servidor propio
 * ------------------------------------------------------------------
 * Guarda los datos del panel en esta misma planilla y sirve el panel
 * como página web. No tiene reglas de negocio: los costos, los kilos y
 * los bollos los calcula el panel. Acá solo se guarda y se lee.
 *
 * PUESTA EN MARCHA
 *   1. Extensiones → Apps Script.
 *   2. Pegá este archivo en Código.gs.
 *   3. Archivo nuevo → HTML → llamalo  panel  → pegá adentro VL_PANEL.txt.
 *   4. Ejecutar → inicializar().  (La primera vez pide permisos: aceptá.)
 *   5. Implementar → Nueva implementación → Aplicación web.
 *        Ejecutar como: Yo     ·     Acceso: Cualquier usuario
 *   6. La URL que te da es la app. Abrila en el celular y agregala a inicio.
 *
 * PARA ACTUALIZAR EL PANEL más adelante: pegás el panel nuevo en el
 * archivo  panel  y hacés Implementar → Administrar implementaciones →
 * lápiz → Versión: Nueva → Implementar. La URL no cambia.
 */

var CFG = {
  pin: '',              // poné algo como '4821' y la app lo va a pedir para entrar
  titulo: 'Vamos Luigi',
  icono: 'https://lh3.googleusercontent.com/d/1XgIKOE-4K0YoT4Z-4QUyUhzF6EzJzFN2'
};

/** Una hoja por colección. El panel usa exactamente estos nombres. */
var COLECCIONES = ['productos', 'insumos', 'clientes', 'tandas',
                   'pedidos', 'movimientos', 'recetas', 'config', 'notas', 'finanzas'];

var PREFIJO = 'db_';
var MARCA_JSON = '@json:';


/* ===================================================================
 *  ENTRADAS
 * =================================================================== */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var r = p.r || 'panel';

  if (r === 'panel') return servirPanel();

  try {
    if (!pinOk(p.pin)) return json({ok: false, error: 'pin', mensaje: 'PIN incorrecto'});
    if (r === 'version') return json({ok: true, version: versionActual()});
    if (r === 'todo')    return json({ok: true, version: versionActual(), datos: leerTodo()});
    if (r === 'escribir') {
      var ops = [];
      try { ops = JSON.parse(p.ops || '[]'); } catch (x) {
        return json({ok: false, error: 'no entendí las operaciones'});
      }
      return json(apiEscribir(p.pin, ops));
    }
    return json({ok: false, error: 'no conozco r=' + r});
  } catch (err) {
    return json({ok: false, error: String(err && err.message || err)});
  }
}

function doPost(e) {
  var b = {};
  try { b = JSON.parse(e.postData.contents); } catch (x) {}
  try {
    if (!pinOk(b.pin)) return json({ok: false, error: 'pin', mensaje: 'PIN incorrecto'});
    var ops = b.ops || [{op: b.op, col: b.col, id: b.id, datos: b.datos}];
    return json(aplicarLote_(ops));
  } catch (err) {
    return json({ok: false, error: String(err && err.message || err)});
  }
}

function pinOk(dado) {
  return !CFG.pin || String(dado || '') === String(CFG.pin);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ===================================================================
 *  EL PANEL
 * =================================================================== */

function servirPanel() {
  var html;
  try {
    html = HtmlService.createHtmlOutputFromFile('panel').getContent();
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<p style="font:16px sans-serif;padding:24px">Falta el archivo <b>panel</b> ' +
      'en este proyecto de Apps Script. Crealo con Archivo → Nuevo → Archivo HTML, ' +
      'llamalo <b>panel</b> y pegá adentro el contenido de VL_PANEL.txt.</p>');
  }
  html = html.replace('__VL_BASE__', ScriptApp.getService().getUrl())
             .replace('__VL_PIN__', CFG.pin ? '1' : '');
  return HtmlService.createHtmlOutput(html)
    .setTitle(CFG.titulo)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/* ===================================================================
 *  LO QUE LLAMA EL PANEL (google.script.run, sin CORS de por medio)
 * =================================================================== */

function apiLeer(pin) {
  if (!pinOk(pin)) return {ok: false, error: 'pin'};
  return {ok: true, version: versionActual(), datos: leerTodo()};
}

function apiVersion(pin) {
  if (!pinOk(pin)) return {ok: false, error: 'pin'};
  return {ok: true, version: versionActual()};
}

function apiEscribir(pin, ops) {
  if (!pinOk(pin)) return {ok: false, error: 'pin'};
  if (!ops || !ops.length) return {ok: true, version: versionActual(), hechas: 0, rechazadas: []};
  return aplicarLote_(ops);
}

/* Cada cambio se aplica por su cuenta. Si uno no se puede, los demás entran
   igual y se avisa cuál falló. Antes el primero que fallaba cortaba el lote
   entero, y el panel lo reintentaba para siempre con todo lo demás atrás. */
function aplicarLote_(ops) {
  var hechas = 0, rechazadas = [];
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    /* Todo el lote se arma en memoria, hoja por hoja, y se escribe de una sola
       vez al final. Antes cada cambio leía y escribía la planilla por su cuenta
       y costaba un segundo; ahora un lote de veinte cuesta casi lo mismo que uno. */
    var memoria = {};
    ops.forEach(function (o, i) {
      try { aplicarEnMemoria_(o, memoria); hechas++; }
      catch (err) {
        rechazadas.push({i: i, col: o && o.col, id: o && o.id,
                         error: String(err && err.message || err)});
      }
    });
    for (var col in memoria) volcar_(memoria[col]);
    var v = hechas ? subirVersion_() : versionActual();
    return {ok: true, version: v, hechas: hechas, rechazadas: rechazadas};
  } finally {
    lock.releaseLock();
  }
}

/* Lo que se sabe de una hoja durante un lote: sus columnas, en qué fila está
   cada id, y los documentos que hay que escribir o borrar. */
function hojaEnMemoria_(memoria, col) {
  if (memoria[col]) return memoria[col];
  var h = hoja_(col);
  var ancho = Math.max(1, h.getLastColumn()), alto = h.getLastRow();
  var cab = h.getRange(1, 1, 1, ancho).getValues()[0].map(function (x) { return String(x || ''); });
  if (!cab[0]) cab[0] = 'id';
  while (cab.length > 1 && !cab[cab.length - 1]) cab.pop();
  var ids = alto > 1 ? h.getRange(2, 1, alto - 1, 1).getValues()
    .map(function (r) { return textoDe_(r[0]); }) : [];
  memoria[col] = {h: h, cab: cab, cabOriginal: cab.length, ids: ids, altoOriginal: ids.length, valores: null,
                  docs: {}, borrar: []};
  return memoria[col];
}

function aplicarEnMemoria_(o, memoria) {
  if (!o || !o.op) throw new Error('operación vacía');
  if (COLECCIONES.indexOf(o.col) < 0) throw new Error('no conozco la colección ' + o.col);
  if (!o.id) throw new Error('falta el id');
  if (o.op !== 'set' && o.op !== 'update' && o.op !== 'delete')
    throw new Error('no conozco la operación ' + o.op);

  var m = hojaEnMemoria_(memoria, o.col);
  var id = String(o.id);
  var k = m.ids.indexOf(id);
  var fila = k >= 0 ? k + 2 : 0;

  if (o.op === 'delete') {
    if (fila > 0) {
      m.ids[k] = null;
      delete m.docs[fila];
      /* una fila agregada en este mismo lote todavía no está en la hoja */
      if (fila <= m.altoOriginal + 1 && m.borrar.indexOf(fila) < 0) m.borrar.push(fila);
    }
    return;
  }

  var base = {};
  if (o.op === 'update' && fila > 0) base = m.docs[fila] || docEnMemoria_(m, fila);
  base = copiar_(base);
  delete base.id;
  var datos = o.datos || {};
  for (var c in datos) base[c] = datos[c];
  for (var c2 in base) if (c2 !== 'id' && m.cab.indexOf(c2) < 0) m.cab.push(c2);

  if (fila === 0) { m.ids.push(id); fila = m.ids.length + 1; }
  m.docs[fila] = base;
}

function copiar_(d) { var o = {}; for (var k in d) o[k] = d[k]; return o; }

/* la fila tal como está en la planilla; la hoja se lee entera una sola vez */
function docEnMemoria_(m, fila) {
  if (!m.valores) m.valores = m.h.getDataRange().getValues();
  var vals = m.valores[fila - 1] || [];
  var doc = {};
  for (var c = 1; c < m.cabOriginal; c++) if (m.cab[c]) doc[m.cab[c]] = desArmar_(vals[c]);
  return doc;
}

/* Escribe lo que quedó en memoria: el encabezado si hay columnas nuevas, las
   filas tocadas en bloques seguidos, y al final borra las que se fueron (de
   abajo para arriba, para que no se corran los números). */
function volcar_(m) {
  var h = m.h, ancho = m.cab.length;
  /* las filas nuevas se apilan sin huecos: si una se creó y se borró en el
     mismo lote, no deja una fila vacía */
  var nuevas = [], libre = m.altoOriginal + 2;
  for (var k = m.altoOriginal; k < m.ids.length; k++) {
    if (m.ids[k] == null) continue;
    nuevas.push([libre++, m.docs[k + 2], m.ids[k]]);
    delete m.docs[k + 2];
  }
  var idDe = {};
  nuevas.forEach(function (x) { m.docs[x[0]] = x[1]; idDe[x[0]] = x[2]; });
  var filas = Object.keys(m.docs).map(Number).sort(function (a, b) { return a - b; });
  var ultima = filas.length ? filas[filas.length - 1] : 1;
  if (ultima > h.getMaxRows()) h.insertRowsAfter(h.getMaxRows(), ultima - h.getMaxRows());
  if (ancho > h.getMaxColumns()) h.insertColumnsAfter(h.getMaxColumns(), ancho - h.getMaxColumns());
  if (ancho > m.cabOriginal) {
    h.getRange(1, 1, 1, ancho).setNumberFormat('@').setValues([m.cab]);
  }
  var i = 0;
  while (i < filas.length) {
    var j = i;
    while (j + 1 < filas.length && filas[j + 1] === filas[j] + 1) j++;
    var bloque = [];
    for (var n = i; n <= j; n++) {
      var d = m.docs[filas[n]];
      var salida = [idDe[filas[n]] || m.ids[filas[n] - 2]];
      for (var c = 1; c < ancho; c++) salida.push(armar_(d[m.cab[c]]));
      bloque.push(salida);
    }
    h.getRange(filas[i], 1, bloque.length, ancho).setNumberFormat('@').setValues(bloque);
    i = j + 1;
  }
  m.borrar.sort(function (a, b) { return b - a; }).forEach(function (f) { h.deleteRow(f); });
}

/* Un cambio suelto, fuera de un lote: lo usa inicializar e importar. */
function aplicar_(o) {
  var memoria = {};
  aplicarEnMemoria_(o, memoria);
  for (var col in memoria) volcar_(memoria[col]);
}


/* ===================================================================
 *  LEER
 * =================================================================== */

function leerTodo() {
  var salida = {};
  COLECCIONES.forEach(function (c) { salida[c] = leer(c); });
  return salida;
}

function leer(col) {
  var h = hoja_(col);
  var valores = h.getDataRange().getValues();
  if (valores.length < 2) return [];
  var cab = valores[0];
  var docs = [];
  for (var f = 1; f < valores.length; f++) {
    var fila = valores[f];
    if (!fila[0]) continue;
    var doc = {id: textoDe_(fila[0])};
    for (var c = 1; c < cab.length; c++) {
      if (!cab[c]) continue;
      doc[cab[c]] = desArmar_(fila[c]);
    }
    docs.push(doc);
  }
  return docs;
}


/* ===================================================================
 *  ESCRIBIR
 * =================================================================== */

function buscarFila_(h, id) {
  var ultima = h.getLastRow();
  if (ultima < 2) return 0;
  var ids = h.getRange(2, 1, ultima - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (textoDe_(ids[i][0]) === String(id)) return i + 2;
  }
  return 0;
}

function docDeFila_(h, fila) {
  var cab = h.getRange(1, 1, 1, Math.max(1, h.getLastColumn())).getValues()[0];
  var vals = h.getRange(fila, 1, 1, cab.length).getValues()[0];
  var doc = {};
  for (var c = 1; c < cab.length; c++) if (cab[c]) doc[cab[c]] = desArmar_(vals[c]);
  return doc;
}

/** agrega columnas nuevas si el documento trae campos que la hoja no tenía */
function asegurarColumnas_(h, doc) {
  var ancho = Math.max(1, h.getLastColumn());
  var cab = h.getRange(1, 1, 1, ancho).getValues()[0];
  if (!cab[0]) { cab[0] = 'id'; h.getRange(1, 1).setValue('id'); }
  var faltan = [];
  for (var k in doc) if (cab.indexOf(k) < 0) faltan.push(k);
  if (faltan.length) {
    h.getRange(1, cab.length + 1, 1, faltan.length).setValues([faltan]);
    cab = cab.concat(faltan);
  }
  return cab;
}

/** listas y objetos van como texto JSON; el resto va tal cual */
function armar_(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') return MARCA_JSON + JSON.stringify(v);
  return v;
}

/* Un texto que en realidad es un número, ¿lo es de verdad? Solo si al pasarlo
   a número y volver queda idéntico. Así un teléfono con cero adelante o con
   guiones sigue siendo texto. */
function esNumero_(t) {
  if (!/^-?\d+(\.\d+)?$/.test(t)) return false;
  return String(Number(t)) === t;
}

/* Al marcar la hoja como texto (para que no nos convierta las fechas), Sheets
   también guarda como texto los sí/no y los números. Acá les devolvemos su
   forma: si no, "false" es un texto con letras y para el panel eso es un sí. */
function desArmar_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return textoDe_(v);
  if (typeof v === 'string') {
    if (v.indexOf(MARCA_JSON) === 0) {
      try { return JSON.parse(v.slice(MARCA_JSON.length)); } catch (x) { return null; }
    }
    if (v === 'true'  || v === 'TRUE'  || v === 'VERDADERO') return true;
    if (v === 'false' || v === 'FALSE' || v === 'FALSO')     return false;
    if (esNumero_(v)) return Number(v);
  }
  if (v === '') return '';
  return v;
}


/* ===================================================================
 *  VERSIÓN (para que el panel sepa si cambió algo sin bajar todo)
 * =================================================================== */

function versionActual() {
  var v = PropertiesService.getScriptProperties().getProperty('version');
  return Number(v || 0);
}

function subirVersion_() {
  var v = versionActual() + 1;
  PropertiesService.getScriptProperties().setProperty('version', String(v));
  return v;
}


/* ===================================================================
 *  HOJAS
 * =================================================================== */

/* Hojas que ya pusimos en formato texto en esta corrida. */
var HOJAS_TEXTO = {};

/* Google Sheets adivina el tipo de lo que escribís: "2026-09-14" se le
   convierte en fecha y te la devuelve como fecha, no como el texto que
   mandaste. Ahí se rompía todo: la semana del pedido dejaba de coincidir con
   ninguna semana y el pedido no aparecía en ninguna pantalla. Marcando la hoja
   como texto, guarda exactamente lo que le damos. */
function asegurarTexto_(h) {
  var nombre = h.getName();
  if (HOJAS_TEXTO[nombre]) return;
  h.getRange(1, 1, Math.max(1, h.getMaxRows()), Math.max(1, h.getMaxColumns()))
   .setNumberFormat('@');
  HOJAS_TEXTO[nombre] = true;
}

/* Lo que vuelve de una celda, como texto. Si la planilla ya nos había
   convertido algo en fecha (de antes de marcarla como texto), lo devolvemos
   con la forma que esperamos: 2026-09-14. */
function textoDe_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    var dos = function (n) { return (n < 10 ? '0' : '') + n; };
    var f = v.getFullYear() + '-' + dos(v.getMonth() + 1) + '-' + dos(v.getDate());
    if (v.getHours() || v.getMinutes() || v.getSeconds()) {
      f += 'T' + dos(v.getHours()) + ':' + dos(v.getMinutes()) + ':' + dos(v.getSeconds());
    }
    return f;
  }
  return String(v);
}

function hoja_(col) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nombre = PREFIJO + col.toUpperCase();
  var h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1).setValue('id');
    h.setFrozenRows(1);
    h.getRange(1, 1, 1, 1).setFontWeight('bold');
  }
  return h;
}


/* ===================================================================
 *  PUESTA EN MARCHA Y MANTENIMIENTO
 * =================================================================== */

function inicializar() {
  COLECCIONES.forEach(function (c) { hoja_(c); });
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (x) {}
  Logger.log('Hojas listas: ' + COLECCIONES.map(function (c) {
    return PREFIJO + c.toUpperCase();
  }).join(', '));
  Logger.log(url
    ? 'La app ya está publicada en: ' + url
    : 'Ahora: Implementar → Nueva implementación → Aplicación web.');
  return url;
}

/** Carga de golpe todo lo que venga en un JSON (lo uso para migrar). */
function importar(datos) {
  var ops = [];
  COLECCIONES.forEach(function (c) {
    (datos[c] || []).forEach(function (d) {
      var copia = {};
      for (var k in d) if (k !== 'id') copia[k] = d[k];
      ops.push({op: 'set', col: c, id: d.id, datos: copia});
    });
  });
  ops.forEach(aplicar_);
  subirVersion_();
  Logger.log('Importados ' + ops.length + ' documentos.');
  return ops.length;
}

/** Deja una hoja PEDIDOS legible, una línea por producto, para mirar sin la app. */
function armarResumen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName('PEDIDOS (legible)') || ss.insertSheet('PEDIDOS (legible)');
  h.clear();
  h.appendRow(['Semana', 'Cliente', 'Producto', 'Cantidad', 'Precio unit.',
               'Subtotal', 'Envío', 'Total del pedido', 'Estado', 'Observaciones']);
  h.setFrozenRows(1);
  h.getRange(1, 1, 1, 10).setFontWeight('bold');

  var prods = {};
  leer('productos').forEach(function (p) { prods[p.sku] = p; });

  var filas = [];
  leer('pedidos').sort(function (a, b) {
    return String(a.tanda).localeCompare(String(b.tanda));
  }).forEach(function (p) {
    var lineas = p.lineas || [];
    var bruto = 0;
    lineas.forEach(function (l) { bruto += l.cantidad * l.precioUnit; });
    bruto += Number(p.envio || 0);
    var total = p.sinCargo ? 0
      : (p.totalManual !== '' && p.totalManual != null ? Number(p.totalManual) : bruto);
    var estado = p.cobrado ? 'cobrado' : p.entregado ? 'entregado'
               : p.preparado ? 'preparado' : 'pendiente';
    if (!lineas.length) lineas = [{sku: '—', cantidad: 0, precioUnit: 0}];
    lineas.forEach(function (l, i) {
      var prod = prods[l.sku] || {};
      filas.push([
        p.tanda, p.cliente,
        (prod.nombre || l.sku) + (prod.tamano && prod.tamano !== 'Única' ? ' ' + prod.tamano : ''),
        l.cantidad, l.precioUnit, l.cantidad * l.precioUnit,
        i === 0 ? Number(p.envio || 0) : '',
        i === 0 ? total : '',
        i === 0 ? estado : '',
        i === 0 ? (p.observaciones || '') : ''
      ]);
    });
  });
  if (filas.length) h.getRange(2, 1, filas.length, 10).setValues(filas);
  h.autoResizeColumns(1, 10);
  Logger.log('Resumen armado: ' + filas.length + ' líneas.');
  return filas.length;
}

/** Borra todo lo cargado menos el catálogo. Pide confirmación por las dudas. */
function vaciarMovimiento() {
  var r = SpreadsheetApp.getUi().alert(
    'Vaciar pedidos, tandas y movimientos',
    'Se borran los pedidos, las tandas y los movimientos de stock. ' +
    'Productos, insumos, clientes y recetas quedan como están. ¿Seguimos?',
    SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (r !== SpreadsheetApp.getUi().Button.YES) return;
  ['pedidos', 'tandas', 'movimientos'].forEach(function (c) {
    var h = hoja_(c);
    if (h.getLastRow() > 1) h.deleteRows(2, h.getLastRow() - 1);
  });
  subirVersion_();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Vamos Luigi')
    .addItem('Abrir la app', 'mostrarUrl')
    .addItem('Armar resumen legible de pedidos', 'armarResumen')
    .addSeparator()
    .addItem('Vaciar pedidos, tandas y stock', 'vaciarMovimiento')
    .addToUi();
}

function mostrarUrl() {
  var url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert('La app está en:\n\n' + (url ||
    'Todavía no la publicaste. Implementar → Nueva implementación → Aplicación web.'));
}
