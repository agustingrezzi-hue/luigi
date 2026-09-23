/* Servidor falso por HTTP, con las mismas reglas que VL_API2.gs.
   Reemplaza a appsmock.js ahora que el panel habla por fetch. */
(function(){
  const COLS = ['productos','insumos','clientes','tandas','pedidos','movimientos',
                'recetas','config', 'notas'];
  /* el servidor falso sobrevive a que la página se recargue, como el de verdad */
  const store = {};
  COLS.forEach(c => store[c] = {});
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem('__apps_store') || 'null'); } catch(e){}
  if (guardado && guardado.store){
    COLS.forEach(c => store[c] = guardado.store[c] || {});
  }
  const persistir = () => { try {
    localStorage.setItem('__apps_store', JSON.stringify({store:store, version:A.version}));
  } catch(e){} };
  const A = {store, version:(guardado&&guardado.version)||0, pin:'', caido:false, lento:0, sinPost:false,
             llamadas:{todo:0, version:0, escribir:0, porGet:0}, ultimoPost:null};
  window.__apps = A;
  /* las pruebas encienden y apagan cosas desde el almacenamiento, así no
     dependen del orden en que se registran los scripts de arranque */
  try {
    A.lento = Number(localStorage.getItem('__apps_lento') || 0) || 0;
    A.caido = localStorage.getItem('__apps_caido') === '1';
    A.viejo = localStorage.getItem('__apps_viejo') === '1';
  } catch(e){}
  window.__VL_BASE = 'https://servidor.falso/exec';
  window.__VL_PIN = window.__VL_PIN_TEST || '';

  function leerTodo(){
    const out = {};
    COLS.forEach(c => out[c] = Object.keys(store[c]).map(id =>
      Object.assign({id}, JSON.parse(JSON.stringify(store[c][id])))));
    return out;
  }
  /* la planilla de verdad convierte "2026-09-14" en fecha y te la devuelve
     como fecha, no como el texto que mandaste. Acá pasa lo mismo. */
  function comoSheets(v){
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)){
      const p = v.split('-').map(Number);
      return new Date(p[0], p[1]-1, p[2]);
    }
    if (v && typeof v === 'object') return v;
    return v;
  }
  function aplicar(o){
    if (COLS.indexOf(o.col) < 0 || (A.viejo && o.col === 'notas'))
      throw new Error('no conozco la colección ' + o.col);
    if (!o.id) throw new Error('falta el id');
    if (o.op === 'delete'){ delete store[o.col][o.id]; return; }
    const base = (o.op === 'update' && store[o.col][o.id])
      ? JSON.parse(JSON.stringify(store[o.col][o.id])) : {};
    Object.assign(base, o.datos || {});
    delete base.id;
    for (const k in base) base[k] = comoSheets(base[k]);
    store[o.col][o.id] = base;
  }
  function lote(ops){
    if (A.viejo){
      try { ops.forEach(aplicar); }
      catch(e){ return {ok:false, error:String(e.message||e)}; }
      A.version++; persistir();
      return {ok:true, version:A.version, hechas:ops.length};
    }
    let hechas = 0; const rechazadas = [];
    ops.forEach((o,i) => { try { aplicar(o); hechas++; }
      catch(e){ rechazadas.push({i, col:o&&o.col, id:o&&o.id, error:String(e.message||e)}); } });
    if (hechas){ A.version++; persistir(); }
    return {ok:true, version:A.version, hechas, rechazadas};
  }
  const json = (obj, status) => new Response(JSON.stringify(obj),
    {status: status || 200, headers:{'Content-Type':'application/json'}});

  const original = window.fetch;
  window.fetch = async function (url, opciones) {
    url = String(url);
    if (url.indexOf('https://servidor.falso/exec') !== 0) return original.apply(this, arguments);
    if (A.lento) await new Promise(r => setTimeout(r, A.lento));
    if (A.caido) throw new TypeError('Failed to fetch');

    const u = new URL(url);
    const met = (opciones && opciones.method) || 'GET';

    if (met === 'GET') {
      const r = u.searchParams.get('r');
      const pin = u.searchParams.get('pin') || '';
      if (A.pin && pin !== A.pin) return json({ok:false, error:'pin'});
      if (r === 'version'){ A.llamadas.version++; return json({ok:true, version:A.version}); }
      if (r === 'todo'){ A.llamadas.todo++;
        return json({ok:true, version:A.version, datos:leerTodo()}); }
      if (r === 'escribir'){
        A.llamadas.escribir++; A.llamadas.porGet++;
        let ops = [];
        try { ops = JSON.parse(u.searchParams.get('ops') || '[]'); }
        catch(e){ return json({ok:false, error:'no entendí las operaciones'}); }
        return json(lote(ops));
      }
      return json({ok:false, error:'no conozco r=' + r});
    }

    if (A.sinPost) throw new TypeError('Failed to fetch');
    A.llamadas.escribir++;
    let b = {};
    try { b = JSON.parse(opciones.body); } catch(e){}
    A.ultimoPost = {tipo: (opciones.headers||{})['Content-Type'], cuerpo: b};
    if (A.pin && String(b.pin) !== A.pin) return json({ok:false, error:'pin'});
    return json(lote(b.ops || []));
  };
})();
