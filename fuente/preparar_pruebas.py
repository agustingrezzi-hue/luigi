# -*- coding: utf-8 -*-
"""Copias de prueba: el mismo HTML que se sirve, con el servidor falso puesto."""
import io
RAIZ = '/home/claude/vl/'
FALSO = 'https://servidor.falso/exec'

gas = io.open(RAIZ+'VL_PANEL.txt', encoding='utf-8').read()
io.open(RAIZ+'vl_panel_prueba.html','w',encoding='utf-8').write(
    gas.replace('"__VL_BASE__"', '"'+FALSO+'"').replace('"__VL_PIN__"', '""'))
io.open(RAIZ+'vl_panel_pin.html','w',encoding='utf-8').write(
    gas.replace('"__VL_BASE__"', '"'+FALSO+'"').replace('"__VL_PIN__"', '"1"'))

web = io.open(RAIZ+'paginita/index.html', encoding='utf-8').read()
import re
web = re.sub(r'"https://script\.google\.com/macros/s/[^"]+"', '"'+FALSO+'"', web)
# en las pruebas no queremos que se registre el service worker
web = web.replace("if ('serviceWorker' in navigator) {", "if (false) {")
assert FALSO in web and 'script.google.com' not in web
io.open(RAIZ+'vl_web_prueba.html','w',encoding='utf-8').write(web)
print('copias de prueba listas')
