# Fuente del panel de Vamos Luigi

Lo que hay acá **arma** la app. Lo que se sube a GitHub Pages es el resultado, no esto.

| archivo | qué es |
|---|---|
| `panel_src.html` | **La fuente del panel.** Todo se edita acá. |
| `armar.py` | Produce `paginita/index.html` (la app), `panel2.html` (artifact) y `VL_PANEL.txt`. Reemplaza el logo y la URL del servidor. |
| `VL_API2.gs` | El servidor de Apps Script (va en `Código.gs`, que tiene que ser el único archivo de código del proyecto). |
| `preparar_pruebas.py` | Arma las copias de prueba con el servidor falso. |
| `httpmock.js`, `servidorcito.js`, `_seed.js` | Servidor falso, servidor HTTP local y datos de prueba. |
| `test_*.js`, `test2.js`, `test3.js` | Las pruebas (Playwright + node). |
| `paginita/` | `sw.js`, `manifest.webmanifest` y los íconos, que se suben junto con `index.html`. |

## Cómo se trabaja

```
python3 armar.py            # arma la app
python3 preparar_pruebas.py # arma las copias de prueba
node test_nuevos.js         # cada prueba por separado (juntas tardan mucho)
```

Después: `paginita/index.html` va al repo `luigi` de GitHub (Add file → Upload files).
El servidor va a Apps Script y se implementa con Administrar implementaciones → lápiz → Versión nueva.

La explicación de todo lo demás está en el proyecto de Claude "Vamos Luigi",
en `claude/la-app.md` y `claude/panel-y-modelo-de-datos.md`.

## Ojo (12/10)

- `logo.png` es el logo de la pantalla de arranque y **tiene que estar acá**: sin él `armar.py` no corre. En la primera subida se había quedado afuera.
- `VL_DATOS.gs` (la semilla real de 170 documentos) volvió a la carpeta: lo usa la última sección de `test_api2.js`.
- Sigue faltando `mockdb.js`, que solo necesitan `test2.js` y `test3.js` (el panel corriendo dentro de un artifact de Claude, un modo que ya no se usa). Esas dos pruebas se saltean solas y avisan; el resto corre igual.
