/* Sirve la carpeta por HTTP. En file:// el navegador a veces se olvida del
   localStorage al recargar, y eso no pasa en el teléfono: ahí la app vive
   en una dirección de verdad. */
const http = require('http'), fs = require('fs'), path = require('path');
const TIPOS = {'.html':'text/html; charset=utf-8', '.js':'text/javascript',
               '.json':'application/json', '.png':'image/png', '.txt':'text/plain'};
module.exports = function servir(dir){
  return new Promise(res => {
    const s = http.createServer((req, rep) => {
      let ruta = decodeURIComponent(req.url.split('?')[0]);
      if (ruta.endsWith('/')) ruta += 'index.html';   // como cualquier servidor
      const f = path.join(dir, ruta);
      fs.readFile(f, (e, b) => {
        if (e){ rep.writeHead(404); return rep.end('no está'); }
        rep.writeHead(200, {'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream'});
        rep.end(b);
      });
    });
    s.listen(0, '127.0.0.1', () => res({
      base: 'http://127.0.0.1:' + s.address().port + '/',
      cerrar: () => new Promise(r => s.close(r)),
    }));
  });
};
