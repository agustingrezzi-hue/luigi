# -*- coding: utf-8 -*-
"""Arma las casas del panel a partir de panel_src.html.

  paginita/index.html  -> la app de verdad, servida por GitHub Pages
  panel2.html          -> el artefacto de Claude
  VL_PANEL.txt         -> el archivo 'panel' de Apps Script (red de contención)
"""
import io, base64

RAIZ = '/home/claude/vl/'
EXEC = ('https://script.google.com/macros/s/'
        'AKfycbzT2Kj19u7R72287obeTdvr2Zf3MPkWBG1YckWb1fihL7ulU5mpDGkemJHugaezAd4Z/exec')

src  = io.open(RAIZ+'panel_src.html', encoding='utf-8').read()
# OJO: el src del panel ya dice "data:image/png;base64,__LOGO__", así que el
# marcador se reemplaza SOLO con el base64 pelado. Poner el prefijo dos veces
# rompe el logo y no se nota hasta verlo en el teléfono.
b64 = base64.b64encode(io.open(RAIZ+'logo.png','rb').read()).decode()
logo = 'data:image/png;base64,' + b64          # para el src de la pantalla de arranque
cuerpo = src.replace('__LOGO__', b64)
assert 'base64,data:' not in cuerpo

# ---------------------------------------------------------------- arranque
ARRANQUE_CSS = u"""
#arranque{position:fixed;inset:0;z-index:200;background:#0B0D10;display:grid;
  place-items:center;transition:opacity .5s ease}
#arranque.se-va{opacity:0;pointer-events:none}
#arranque .caja{display:grid;justify-items:center;gap:26px;padding:24px}
#arranque .logo-arranque{width:172px;height:auto;display:block;
  animation:respira 2.6s ease-in-out infinite}
@keyframes respira{0%,100%{opacity:.8;transform:scale(1)}50%{opacity:1;transform:scale(1.035)}}
#arranque .riel{width:132px;height:3px;border-radius:99px;
  background:rgba(127,139,156,.2);overflow:hidden}
#arranque .riel i{display:block;height:100%;width:38%;border-radius:99px;background:#2589C8;
  animation:corre 1.3s ease-in-out infinite}
@keyframes corre{0%{transform:translateX(-115%)}100%{transform:translateX(370%)}}
#arranque .pie{font:11px/1.4 ui-monospace,"DM Mono",monospace;color:#5C687A;
  letter-spacing:.14em;text-transform:uppercase}
@media (prefers-reduced-motion:reduce){
  #arranque .logo-arranque,#arranque .riel i{animation:none}
  #arranque .riel i{width:100%}
}
"""

def arranque(img):
    return (u'<div id="arranque"><div class="caja">'
            u'<img class="logo-arranque" src="' + img + u'" alt="Vamos Luigi">'
            u'<div class="riel"><i></i></div>'
            u'<div class="pie">abriendo</div></div></div>')

BASE_CSS = u"""
:root{color-scheme:light dark}
html,body{margin:0;padding:0;height:100%}
img{max-width:100%}
[hidden]:not([hidden="until-found"]){display:none!important}
"""

def envolver(cabeza_extra, css_extra, arriba, abajo):
    return (u'<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
            + cabeza_extra
            + u'<style>' + BASE_CSS + ARRANQUE_CSS + css_extra + u'</style>\n'
            + u'</head>\n<body>\n' + arriba + u'\n' + cuerpo + u'\n' + abajo
            + u'\n</body>\n</html>\n')

# ------------------------------------------------- 1. la app en GitHub Pages
CABEZA_WEB = u"""<title>Vamos Luigi</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0B0D10">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icono-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="icono-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Vamos Luigi">
<meta name="mobile-web-app-capable" content="yes">
"""
CSS_WEB = u"""
html,body{overscroll-behavior-y:contain}
#nueva{position:fixed;left:12px;right:12px;bottom:76px;z-index:95;max-width:444px;
  margin:0 auto;background:#1C77AE;color:#fff;border-radius:16px;padding:13px 15px;
  display:flex;align-items:center;gap:10px;font:14px/1.35 system-ui,sans-serif;
  box-shadow:0 12px 30px -14px rgba(0,0,0,.8)}
#nueva b{flex:1;font-weight:600}
#nueva button{background:rgba(255,255,255,.22);color:#fff;border:0;font:inherit;
  font-weight:700;padding:9px 15px;border-radius:99px;cursor:pointer}
"""
PIE_WEB = u"""<div id="nueva" hidden><b>Hay una versión nueva del panel.</b>
<button id="nueva-ok">Actualizar</button></div>
<script>
/* si tarda demasiado, que al menos se vea el esqueleto */
setTimeout(function(){
  var a = document.getElementById('arranque');
  if (a) a.classList.add('se-va');
}, 9000);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function(){});
  });
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (!e.data || !e.data.nueva) return;
    var n = document.getElementById('nueva');
    if (n) n.hidden = false;
  });
  var ok = document.getElementById('nueva-ok');
  if (ok) ok.onclick = function(){ location.reload(); };
}
</script>"""

# la dirección del servidor va adentro del cuerpo: el panel la lee al arrancar,
# antes de que corra cualquier script de abajo
web = envolver(CABEZA_WEB, CSS_WEB, arranque(logo), PIE_WEB)
web = web.replace('"__VL_BASE__"', '"' + EXEC + '"').replace('"__VL_PIN__"', '""')
assert '__VL_BASE__' not in web and '__VL_PIN__' not in web
io.open(RAIZ+'paginita/index.html','w',encoding='utf-8').write(web)

# ------------------------------------------------------ 2. artefacto de Claude
io.open(RAIZ+'panel2.html','w',encoding='utf-8').write(
    u'<style>' + ARRANQUE_CSS + u'</style>\n' + arranque(logo) + u'\n' + cuerpo)

# --------------------------------------- 3. Apps Script (red de contención)
CABEZA_GAS = u"""<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0B0D10">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Vamos Luigi">
<meta name="mobile-web-app-capable" content="yes">
"""
io.open(RAIZ+'VL_PANEL.txt','w',encoding='utf-8').write(
    envolver(CABEZA_GAS, u'', arranque(logo), u''))

print('armados: paginita/index.html · panel2.html · VL_PANEL.txt')
