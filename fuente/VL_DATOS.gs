/**
 * VAMOS LUIGI · datos de arranque
 * ------------------------------------------------------------------
 * Tu catálogo, tus insumos con precios y tus 109 clientes, más las recetas
 * y las reglas. Se corre UNA sola vez, después de inicializar().
 *
 *   Ejecutar → cargarDatos()
 *
 * Si lo corrés de nuevo, pisa lo que haya con estos valores. No toca
 * pedidos, tandas ni movimientos de stock: eso queda siempre.
 */

function cargarDatos() {
  var n = importar(DATOS_INICIALES);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Listo: ' + n + ' documentos cargados.', 'Vamos Luigi', 8);
  return n;
}

var DATOS_INICIALES =
{
 "productos": [
  {
   "masa_gr": 1164,
   "nombre": "Focaccia Aceitunas",
   "orden": 10,
   "precio": 16000,
   "precio_comercio": null,
   "sku": "FOC-ACE-G",
   "tamano": "Grande",
   "tipo": "Focaccia",
   "id": "FOC-ACE-G"
  },
  {
   "masa_gr": 388,
   "nombre": "Focaccia Aceitunas",
   "orden": 9,
   "precio": 6000,
   "precio_comercio": null,
   "sku": "FOC-ACE-M",
   "tamano": "Mediana",
   "tipo": "Focaccia",
   "id": "FOC-ACE-M"
  },
  {
   "masa_gr": 1164,
   "nombre": "Focaccia Cherrys",
   "orden": 6,
   "precio": 16000,
   "precio_comercio": null,
   "sku": "FOC-CHE-G",
   "tamano": "Grande",
   "tipo": "Focaccia",
   "id": "FOC-CHE-G"
  },
  {
   "masa_gr": 388,
   "nombre": "Focaccia Cherrys",
   "orden": 5,
   "precio": 6000,
   "precio_comercio": null,
   "sku": "FOC-CHE-M",
   "tamano": "Mediana",
   "tipo": "Focaccia",
   "id": "FOC-CHE-M"
  },
  {
   "masa_gr": 1164,
   "nombre": "Focaccia Pesto",
   "orden": 16,
   "precio": 16000,
   "precio_comercio": null,
   "sku": "FOC-PES-G",
   "tamano": "Grande",
   "tipo": "Focaccia",
   "id": "FOC-PES-G"
  },
  {
   "masa_gr": 388,
   "nombre": "Focaccia Pesto",
   "orden": 15,
   "precio": 6000,
   "precio_comercio": null,
   "sku": "FOC-PES-M",
   "tamano": "Mediana",
   "tipo": "Focaccia",
   "id": "FOC-PES-M"
  },
  {
   "masa_gr": 1164,
   "nombre": "Focaccia Picante",
   "orden": 12,
   "precio": 16000,
   "precio_comercio": null,
   "sku": "FOC-PIC-G",
   "tamano": "Grande",
   "tipo": "Focaccia",
   "id": "FOC-PIC-G"
  },
  {
   "masa_gr": 388,
   "nombre": "Focaccia Picante",
   "orden": 11,
   "precio": 6000,
   "precio_comercio": null,
   "sku": "FOC-PIC-M",
   "tamano": "Mediana",
   "tipo": "Focaccia",
   "id": "FOC-PIC-M"
  },
  {
   "masa_gr": 1164,
   "nombre": "Focaccia Romero",
   "orden": 4,
   "precio": 16000,
   "precio_comercio": null,
   "sku": "FOC-ROM-G",
   "tamano": "Grande",
   "tipo": "Focaccia",
   "id": "FOC-ROM-G"
  },
  {
   "masa_gr": 388,
   "nombre": "Focaccia Romero",
   "orden": 3,
   "precio": 6000,
   "precio_comercio": null,
   "sku": "FOC-ROM-M",
   "tamano": "Mediana",
   "tipo": "Focaccia",
   "id": "FOC-ROM-M"
  },
  {
   "masa_gr": 1164,
   "nombre": "Focaccia Roquefort",
   "orden": 14,
   "precio": 16000,
   "precio_comercio": null,
   "sku": "FOC-ROQ-G",
   "tamano": "Grande",
   "tipo": "Focaccia",
   "id": "FOC-ROQ-G"
  },
  {
   "masa_gr": 388,
   "nombre": "Focaccia Roquefort",
   "orden": 13,
   "precio": 6000,
   "precio_comercio": null,
   "sku": "FOC-ROQ-M",
   "tamano": "Mediana",
   "tipo": "Focaccia",
   "id": "FOC-ROQ-M"
  },
  {
   "masa_gr": 1164,
   "nombre": "Focaccia Verdeo",
   "orden": 8,
   "precio": 16000,
   "precio_comercio": null,
   "sku": "FOC-VER-G",
   "tamano": "Grande",
   "tipo": "Focaccia",
   "id": "FOC-VER-G"
  },
  {
   "masa_gr": 388,
   "nombre": "Focaccia Verdeo",
   "orden": 7,
   "precio": 6000,
   "precio_comercio": null,
   "sku": "FOC-VER-M",
   "tamano": "Mediana",
   "tipo": "Focaccia",
   "id": "FOC-VER-M"
  },
  {
   "masa_gr": 341,
   "nombre": "Prepizza Mix de Cebollas",
   "orden": 2,
   "precio": 4500,
   "precio_comercio": null,
   "sku": "PRE-CEB",
   "tamano": "Única",
   "tipo": "Prepizza",
   "id": "PRE-CEB"
  },
  {
   "masa_gr": 341,
   "nombre": "Prepizza Tomate y Albahaca",
   "orden": 1,
   "precio": 4500,
   "precio_comercio": null,
   "sku": "PRE-TOM",
   "tamano": "Única",
   "tipo": "Prepizza",
   "id": "PRE-TOM"
  }
 ],
 "insumos": [
  {
   "categoria": "Harina",
   "contenido_gr": 25000,
   "nombre": "Harina 00",
   "precio_compra": 42000,
   "proveedor": "Oeste Pizza (Castelar)",
   "unidad_compra": "bolsa de 25 kg",
   "id": "I01"
  },
  {
   "categoria": "Harina",
   "contenido_gr": 25000,
   "nombre": "Harina 000",
   "precio_compra": 31820,
   "proveedor": "Oeste Pizza (Castelar)",
   "unidad_compra": "bolsa de 25 kg",
   "id": "I02"
  },
  {
   "categoria": "Harina",
   "contenido_gr": 25000,
   "nombre": "Sémola rimacinata",
   "precio_compra": 45000,
   "proveedor": "Oeste Pizza (Castelar)",
   "unidad_compra": "bolsa de 25 kg",
   "id": "I03"
  },
  {
   "categoria": "Básico",
   "contenido_gr": 5000,
   "nombre": "Sal",
   "precio_compra": 4150,
   "proveedor": "",
   "unidad_compra": "paquete de 5 kg",
   "id": "I04"
  },
  {
   "categoria": "Básico",
   "contenido_gr": 500,
   "nombre": "Levadura",
   "precio_compra": 7000,
   "proveedor": "",
   "unidad_compra": "pan de 500 gr",
   "id": "I05"
  },
  {
   "categoria": "Básico",
   "contenido_gr": 4600,
   "nombre": "Aceite de oliva",
   "precio_compra": 60000,
   "proveedor": "",
   "unidad_compra": "bidón de 5 L",
   "id": "I06"
  },
  {
   "categoria": "Básico",
   "contenido_gr": 500,
   "nombre": "Extracto de malta",
   "precio_compra": 6000,
   "proveedor": "",
   "unidad_compra": "medio kilo",
   "id": "I07"
  },
  {
   "categoria": "Energía",
   "contenido_gr": 10000,
   "nombre": "Gas",
   "precio_compra": 25000,
   "proveedor": "",
   "unidad_compra": "garrafa de 10 kg",
   "id": "I08"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 3000,
   "nombre": "Tomate",
   "precio_compra": 7560,
   "proveedor": "La Minucha (Mercedes)",
   "unidad_compra": "caja de 3 kg",
   "id": "I09"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Cebolla",
   "precio_compra": 900,
   "proveedor": "Verdulería Constitución",
   "unidad_compra": "1 kg",
   "id": "I10"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 200,
   "nombre": "Albahaca",
   "precio_compra": 1500,
   "proveedor": "Verdulería Constitución",
   "unidad_compra": "atado de 200 gr",
   "id": "I11"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 200,
   "nombre": "Romero",
   "precio_compra": 1500,
   "proveedor": "Verdulería Constitución",
   "unidad_compra": "atado de 200 gr",
   "id": "I12"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Tomates cherry",
   "precio_compra": 6000,
   "proveedor": "Verdulería Constitución",
   "unidad_compra": "1 kg",
   "id": "I13"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Verdeo",
   "precio_compra": 5000,
   "proveedor": "Verdulería Constitución",
   "unidad_compra": "1 kg",
   "id": "I14"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Aceitunas verdes",
   "precio_compra": 7500,
   "proveedor": "Tienda Nacho",
   "unidad_compra": "1 kg",
   "id": "I15"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Aceitunas negras",
   "precio_compra": 12900,
   "proveedor": "Tienda Nacho",
   "unidad_compra": "1 kg",
   "id": "I16"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Roquefort",
   "precio_compra": 15300,
   "proveedor": "Silvia",
   "unidad_compra": "1 kg",
   "id": "I17"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Queso sardo",
   "precio_compra": 15837,
   "proveedor": "Tienda Nacho",
   "unidad_compra": "1 kg",
   "id": "I18"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Nueces",
   "precio_compra": 24000,
   "proveedor": "Tienda Nacho",
   "unidad_compra": "1 kg",
   "id": "I19"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Pesto",
   "precio_compra": 0,
   "proveedor": "FALTA EL COSTO",
   "unidad_compra": "1 kg",
   "id": "I20"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Miel",
   "precio_compra": 0,
   "proveedor": "FALTA EL COSTO",
   "unidad_compra": "1 kg",
   "id": "I21"
  },
  {
   "categoria": "Topping",
   "contenido_gr": 1000,
   "nombre": "Picante",
   "precio_compra": 0,
   "proveedor": "FALTA EL COSTO",
   "unidad_compra": "preparado",
   "id": "I22"
  },
  {
   "categoria": "Packaging",
   "contenido_gr": 100,
   "nombre": "Bolsa polipropileno",
   "precio_compra": 4105,
   "proveedor": "",
   "unidad_compra": "paquete x 100",
   "id": "I23"
  },
  {
   "categoria": "Packaging",
   "contenido_gr": 100,
   "nombre": "Bandeja de cartón",
   "precio_compra": 6840,
   "proveedor": "",
   "unidad_compra": "paquete x 100",
   "id": "I24"
  },
  {
   "categoria": "Packaging",
   "contenido_gr": 10,
   "nombre": "Etiqueta impresa",
   "precio_compra": 150,
   "proveedor": "",
   "unidad_compra": "paquete x 10",
   "id": "I25"
  }
 ],
 "clientes": [
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-04",
   "nombre": "Agus Urrizmendi",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "agus-urrizmendi"
  },
  {
   "direccion1": "San Juan de Dios",
   "direccion2": "",
   "historico": "2 pedidos · 8 prepizzas · última 2026-01",
   "nombre": "Alan Pasutti",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "San Juan de Dios",
   "id": "alan-pasutti"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-01",
   "nombre": "Ale Desivo",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "ale-desivo"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-02",
   "nombre": "Alejandra Labato",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "alejandra-labato"
  },
  {
   "direccion1": "General Paz 1458 e/ Dr Muñiz e Irigoyen",
   "direccion2": "",
   "historico": "2 pedidos · 10 prepizzas · última 2026-07",
   "nombre": "Ana Laura UNLu",
   "notas": "Otras direcciones: General Paz 1458",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "ana-laura-unlu"
  },
  {
   "direccion1": "Consultorio",
   "direccion2": "",
   "historico": "2 pedidos · 6 prepizzas · última 2026-04",
   "nombre": "Analia Miglioranza",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "analia-miglioranza"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-07",
   "nombre": "Argentino Paladea",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "argentino-paladea"
  },
  {
   "direccion1": "Francia 1534",
   "direccion2": "",
   "historico": "2 pedidos · 2 prepizzas · última 2026-01",
   "nombre": "Ari Saves",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "ari-saves"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-03",
   "nombre": "Benja Guindani",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "benja-guindani"
  },
  {
   "direccion1": "Cancha",
   "direccion2": "",
   "historico": "10 pedidos · 187 prepizzas · última 2026-09",
   "nombre": "Bife Padel",
   "notas": "también figura como Padel Bife; precio diferencial; Otras direcciones: Centro",
   "telefono": "",
   "tipo": "Comercio",
   "zona": "Centro",
   "id": "bife-padel"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-05",
   "nombre": "Bingo Gonza",
   "notas": "sorteo",
   "telefono": "",
   "tipo": "Promoción",
   "zona": "",
   "id": "bingo-gonza"
  },
  {
   "direccion1": "Luján Pesca",
   "direccion2": "",
   "historico": "2 pedidos · 8 prepizzas · última 2026-07",
   "nombre": "Brian Lujan Pesca",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Otros",
   "id": "brian-lujan-pesca"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-04",
   "nombre": "Camila Abal",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "camila-abal"
  },
  {
   "direccion1": "Hospital",
   "direccion2": "",
   "historico": "4 pedidos · 8 prepizzas · última 2026-08",
   "nombre": "Carla Pserga",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "carla-pserga"
  },
  {
   "direccion1": "Barrio Hospital",
   "direccion2": "",
   "historico": "3 pedidos · 10 prepizzas · última 2026-07",
   "nombre": "Ceci Devechi",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "ceci-devechi"
  },
  {
   "direccion1": "Hospital",
   "direccion2": "",
   "historico": "3 pedidos · 6 prepizzas · última 2026-08",
   "nombre": "Ceci Panattu",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "ceci-panattu"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-01",
   "nombre": "Cecilia Rodriguez",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "cecilia-rodriguez"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-08",
   "nombre": "Celi Passeri",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "celi-passeri"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-03",
   "nombre": "Chino",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "chino"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-05",
   "nombre": "Chofa",
   "notas": "sorteo",
   "telefono": "",
   "tipo": "Promoción",
   "zona": "",
   "id": "chofa"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 2 prepizzas · última 2026-09",
   "nombre": "Cintia",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "cintia"
  },
  {
   "direccion1": "Jauriguerri",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-05",
   "nombre": "Claudia Ema",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Otros",
   "id": "claudia-ema"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "3 pedidos · 6 prepizzas · última 2026-06",
   "nombre": "Confieso",
   "notas": "comercio",
   "telefono": "",
   "tipo": "Comercio",
   "zona": "",
   "id": "confieso"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-05",
   "nombre": "Cris Godard",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "cris-godard"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 19 prepizzas · última 2026-03",
   "nombre": "Cumple Geni",
   "notas": "evento",
   "telefono": "",
   "tipo": "Evento",
   "zona": "",
   "id": "cumple-geni"
  },
  {
   "direccion1": "Juancho",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-07",
   "nombre": "Dai Ferre",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Otros",
   "id": "dai-ferre"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-04",
   "nombre": "Daio Cleto",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "daio-cleto"
  },
  {
   "direccion1": "Sarmiento",
   "direccion2": "",
   "historico": "3 pedidos · 4 prepizzas · última 2026-04",
   "nombre": "Emiliano Bilello",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "emiliano-bilello"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 6 prepizzas · última 2026-07",
   "nombre": "Estani Salas",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "estani-salas"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 6 prepizzas · última 2026-04",
   "nombre": "Feche",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "feche"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 10 prepizzas · última 2026-03",
   "nombre": "Fede Freire",
   "notas": "cumpleaños",
   "telefono": "",
   "tipo": "Evento",
   "zona": "",
   "id": "fede-freire"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-01",
   "nombre": "Fede Riccomanin",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "fede-riccomanin"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "11 pedidos · 86 prepizzas · última 2026-08",
   "nombre": "Feli Gusmerini",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "feli-gusmerini"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-03",
   "nombre": "Fer Cosme",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "fer-cosme"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 20 prepizzas · última 2026-03",
   "nombre": "Feria NoDo",
   "notas": "evento",
   "telefono": "",
   "tipo": "Evento",
   "zona": "",
   "id": "feria-nodo"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-08",
   "nombre": "Gabi Veltri",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "gabi-veltri"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "2 pedidos · 4 prepizzas · última 2026-09",
   "nombre": "Gisele UNLu",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "gisele-unlu"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-03",
   "nombre": "Gloria",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "gloria"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "3 pedidos · 10 prepizzas · última 2026-08",
   "nombre": "Gonza Somma",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "gonza-somma"
  },
  {
   "direccion1": "La Concepción",
   "direccion2": "",
   "historico": "1 pedidos · 6 prepizzas · última 2026-08",
   "nombre": "Graciela Veron",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "La Concepción",
   "id": "graciela-veron"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "6 pedidos · 23 prepizzas · última 2026-05",
   "nombre": "Grego Aner",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "grego-aner"
  },
  {
   "direccion1": "Plazoleta",
   "direccion2": "",
   "historico": "4 pedidos · 14 prepizzas · última 2026-08",
   "nombre": "Guille Fragati",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "guille-fragati"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "3 pedidos · 6 prepizzas · última 2026-05",
   "nombre": "Gustavo Caminos",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "gustavo-caminos"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 6 prepizzas · última 2026-04",
   "nombre": "Japo",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "japo"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 10 prepizzas · última 2026-06",
   "nombre": "Javi Duarte",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "javi-duarte"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "3 pedidos · 14 prepizzas · última 2026-07",
   "nombre": "Jose Bossio",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "jose-bossio"
  },
  {
   "direccion1": "Rivadavia 1116, 1º piso I",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-07",
   "nombre": "Jose Guazzaroni",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "jose-guazzaroni"
  },
  {
   "direccion1": "Barrio Hospital",
   "direccion2": "",
   "historico": "4 pedidos · 4 prepizzas · última 2026-09",
   "nombre": "Juampi Marangon",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "juampi-marangon"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "1 pedidos · 8 prepizzas · última 2026-07",
   "nombre": "Juan Aguilera",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "juan-aguilera"
  },
  {
   "direccion1": "San Sebastian 1776",
   "direccion2": "",
   "historico": "2 pedidos · 4 prepizzas · última 2026-04",
   "nombre": "Juan Manuel Requena",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Otros",
   "id": "juan-manuel-requena"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "2 pedidos · 8 prepizzas · última 2026-08",
   "nombre": "Juan Manuel UNLu",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "juan-manuel-unlu"
  },
  {
   "direccion1": "Centro",
   "direccion2": "",
   "historico": "2 pedidos · 8 prepizzas · última 2026-03",
   "nombre": "Juanca Busnelli",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "juanca-busnelli"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "5 pedidos · 26 prepizzas · última 2026-09",
   "nombre": "Juli Castro",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "juli-castro"
  },
  {
   "direccion1": "Retira por casa",
   "direccion2": "",
   "historico": "1 pedidos · 3 prepizzas · última 2026-07",
   "nombre": "Juli ig",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Retira por casa",
   "id": "juli-ig"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-06",
   "nombre": "Juli Rivada",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "juli-rivada"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-07",
   "nombre": "Karina Demarco",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "karina-demarco"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-03",
   "nombre": "Ketty Busnelli",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "ketty-busnelli"
  },
  {
   "direccion1": "25 de Mayo 1667 e/ Dean Funes y Belgrano",
   "direccion2": "",
   "historico": "2 pedidos · 4 prepizzas · última 2026-02",
   "nombre": "Laura Barbosa",
   "notas": "Otras direcciones: Hospital",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "laura-barbosa"
  },
  {
   "direccion1": "Hospital",
   "direccion2": "",
   "historico": "8 pedidos · 32 prepizzas · última 2026-08",
   "nombre": "Laura Ruiz",
   "notas": "también figura como Lau Ruiz",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "laura-ruiz"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "3 pedidos · 26 prepizzas · última 2026-07",
   "nombre": "Leila Mauri",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "leila-mauri"
  },
  {
   "direccion1": "Centro",
   "direccion2": "",
   "historico": "5 pedidos · 10 prepizzas · última 2026-04",
   "nombre": "Liliana Grezzi",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "liliana-grezzi"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "6 pedidos · 12 prepizzas · última 2026-08",
   "nombre": "Lucas Caminos",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "lucas-caminos"
  },
  {
   "direccion1": "Francia 1175",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-07",
   "nombre": "Luciano Courtade",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "luciano-courtade"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "3 pedidos · 16 prepizzas · última 2026-04",
   "nombre": "MaleSal",
   "notas": "comercio",
   "telefono": "",
   "tipo": "Comercio",
   "zona": "",
   "id": "malesal"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-03",
   "nombre": "Mama Ro Dambolena",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "mama-ro-dambolena"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "3 pedidos · 10 prepizzas · última 2026-07",
   "nombre": "Manu Escola",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "manu-escola"
  },
  {
   "direccion1": "Centro",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-07",
   "nombre": "Mar Poggi",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "mar-poggi"
  },
  {
   "direccion1": "Hostería",
   "direccion2": "",
   "historico": "3 pedidos · 14 prepizzas · última 2026-09",
   "nombre": "Mara Vanesche",
   "notas": "entrega lunes",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hostería Norte",
   "id": "mara-vanesche"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 8 prepizzas · última 2026-07",
   "nombre": "Mari Grezzi",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "mari-grezzi"
  },
  {
   "direccion1": "Arroyo",
   "direccion2": "",
   "historico": "3 pedidos · 6 prepizzas · última 2026-03",
   "nombre": "Marian Ferreras",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Barrio Arroyo",
   "id": "marian-ferreras"
  },
  {
   "direccion1": "La Concepción",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-04",
   "nombre": "Mariana Gowland",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "La Concepción",
   "id": "mariana-gowland"
  },
  {
   "direccion1": "Hospital",
   "direccion2": "",
   "historico": "5 pedidos · 30 prepizzas · última 2026-04",
   "nombre": "Mariana Molinolo",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "mariana-molinolo"
  },
  {
   "direccion1": "Hospital",
   "direccion2": "",
   "historico": "1 pedidos · 3 prepizzas · última 2026-03",
   "nombre": "Mariana tallerista",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "mariana-tallerista"
  },
  {
   "direccion1": "Hospital",
   "direccion2": "",
   "historico": "7 pedidos · 69 prepizzas · última 2026-08",
   "nombre": "Mariela Libia",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "mariela-libia"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 3 prepizzas · última 2026-04",
   "nombre": "Martin Filpo",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "martin-filpo"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-07",
   "nombre": "Matias Torres",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "matias-torres"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 4 prepizzas · última 2026-05",
   "nombre": "Mica Santillan",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "mica-santillan"
  },
  {
   "direccion1": "Retira",
   "direccion2": "",
   "historico": "1 pedidos · 11 prepizzas · última 2026-01",
   "nombre": "Milagros Sicca",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Retira por casa",
   "id": "milagros-sicca"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 8 prepizzas · última 2026-08",
   "nombre": "Monchi Hernandez",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "monchi-hernandez"
  },
  {
   "direccion1": "Plazoleta",
   "direccion2": "",
   "historico": "2 pedidos · 4 prepizzas · última 2026-07",
   "nombre": "Nehuen",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "nehuen"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 8 prepizzas · última 2026-04",
   "nombre": "NFA",
   "notas": "sin costo",
   "telefono": "",
   "tipo": "Otro",
   "zona": "",
   "id": "nfa"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "5 pedidos · 32 prepizzas · última 2026-07",
   "nombre": "Nico Somma",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "UNLu",
   "id": "nico-somma"
  },
  {
   "direccion1": "Centro",
   "direccion2": "",
   "historico": "8 pedidos · 30 prepizzas · última 2026-08",
   "nombre": "Pablo Cimolai",
   "notas": "también figura como Pabli Cimolai",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "pablo-cimolai"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 8 prepizzas · última 2026-03",
   "nombre": "Pablo Guindani",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "pablo-guindani"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-03",
   "nombre": "Pacho",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "pacho"
  },
  {
   "direccion1": "Centro",
   "direccion2": "",
   "historico": "3 pedidos · 4 prepizzas · última 2026-09",
   "nombre": "Pato Urtasun",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "pato-urtasun"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-05",
   "nombre": "Piri Garate",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "piri-garate"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 6 prepizzas · última 2026-03",
   "nombre": "Polleria Amanecer",
   "notas": "comercio, precio diferencial",
   "telefono": "",
   "tipo": "Comercio",
   "zona": "",
   "id": "polleria-amanecer"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "3 pedidos · 20 prepizzas · última 2026-04",
   "nombre": "Polleria La Madrugada",
   "notas": "comercio, precio diferencial",
   "telefono": "",
   "tipo": "Comercio",
   "zona": "",
   "id": "polleria-la-madrugada"
  },
  {
   "direccion1": "Arroyo",
   "direccion2": "",
   "historico": "6 pedidos · 32 prepizzas · última 2026-07",
   "nombre": "Rocio Grezzi",
   "notas": "también figura como Ro Grezzi",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Barrio Arroyo",
   "id": "rocio-grezzi"
  },
  {
   "direccion1": "Hospital",
   "direccion2": "",
   "historico": "6 pedidos · 14 prepizzas · última 2026-08",
   "nombre": "Rocio Rasente",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "rocio-rasente"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-03",
   "nombre": "San Poggi",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "san-poggi"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-08",
   "nombre": "Sandra Grezzi",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "sandra-grezzi"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-05",
   "nombre": "Santi Riccomanin",
   "notas": "sorteo",
   "telefono": "",
   "tipo": "Promoción",
   "zona": "",
   "id": "santi-riccomanin"
  },
  {
   "direccion1": "General Paz 996 / después de 18hs Sarmiento 653",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-07",
   "nombre": "Silvia",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "silvia"
  },
  {
   "direccion1": "Valle Verde",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-08",
   "nombre": "Sofi Ubertino",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Valle Verde",
   "id": "sofi-ubertino"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-05",
   "nombre": "Sorteo Ayelen",
   "notas": "sorteo",
   "telefono": "",
   "tipo": "Promoción",
   "zona": "",
   "id": "sorteo-ayelen"
  },
  {
   "direccion1": "Sarmiento",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-01",
   "nombre": "Stela Guindani",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "stela-guindani"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-03",
   "nombre": "Steverlynck",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "steverlynck"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 10 prepizzas · última 2026-04",
   "nombre": "Susana Marino",
   "notas": "van congeladas",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "susana-marino"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 2 prepizzas · última 2026-05",
   "nombre": "Tia Estela",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "tia-estela"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 6 prepizzas · última 2026-07",
   "nombre": "Tia Stella",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "tia-stella"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 4 prepizzas · última 2026-06",
   "nombre": "Tincho",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "tincho"
  },
  {
   "direccion1": "Rodolfo Moreno 559",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-03",
   "nombre": "Tute Defranchi",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Centro",
   "id": "tute-defranchi"
  },
  {
   "direccion1": "UNLu",
   "direccion2": "",
   "historico": "1 pedidos · 22 prepizzas · última 2026-04",
   "nombre": "UNLu",
   "notas": "institución",
   "telefono": "",
   "tipo": "Institución",
   "zona": "UNLu",
   "id": "unlu"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "2 pedidos · 6 prepizzas · última 2026-03",
   "nombre": "Vanina Guazzaroni",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "vanina-guazzaroni"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 0 prepizzas · última 2026-05",
   "nombre": "Vicky Brote",
   "notas": "",
   "telefono": "",
   "tipo": "Particular",
   "zona": "",
   "id": "vicky-brote"
  },
  {
   "direccion1": "Hospital",
   "direccion2": "",
   "historico": "10 pedidos · 40 prepizzas · última 2026-05",
   "nombre": "Vicky Marazzo",
   "notas": "también figura como Vicki Marazzo",
   "telefono": "",
   "tipo": "Particular",
   "zona": "Hospital",
   "id": "vicky-marazzo"
  },
  {
   "direccion1": "",
   "direccion2": "",
   "historico": "1 pedidos · 40 prepizzas · última 2026-05",
   "nombre": "ZClub",
   "notas": "comercio, precio diferencial",
   "telefono": "",
   "tipo": "Comercio",
   "zona": "",
   "id": "zclub"
  }
 ],
 "recetas": [
  {
   "id": "masa_prepizza",
   "items": {
    "Harina 00": 900,
    "Sémola rimacinata": 100,
    "Agua": 650,
    "Sal": 30,
    "Extracto de malta": 10,
    "Aceite de oliva": 10,
    "Levadura": 4
   }
  },
  {
   "id": "masa_focaccia",
   "items": {
    "Harina 00": 500,
    "Harina 000": 500,
    "Agua": 700,
    "Sal": 25,
    "Aceite de oliva": 15,
    "Levadura": 6
   }
  },
  {
   "id": "por_unidad",
   "items": {
    "Gas": 80,
    "Bolsa polipropileno": 1,
    "Bandeja de cartón": 1,
    "Etiqueta impresa": 1
   }
  },
  {
   "id": "top_PRE-TOM",
   "items": {
    "Tomate": 80,
    "Albahaca": 10
   }
  },
  {
   "id": "top_PRE-CEB",
   "items": {
    "Cebolla": 100
   }
  },
  {
   "id": "top_FOC-ROM-M",
   "items": {
    "Romero": 5,
    "Aceite de oliva": 10
   }
  },
  {
   "id": "top_FOC-ROM-G",
   "items": {
    "Romero": 16,
    "Aceite de oliva": 30
   }
  },
  {
   "id": "top_FOC-CHE-M",
   "items": {
    "Tomates cherry": 45,
    "Aceite de oliva": 10
   }
  },
  {
   "id": "top_FOC-CHE-G",
   "items": {
    "Tomates cherry": 200,
    "Aceite de oliva": 30
   }
  },
  {
   "id": "top_FOC-VER-M",
   "items": {
    "Verdeo": 28,
    "Aceite de oliva": 10
   }
  },
  {
   "id": "top_FOC-VER-G",
   "items": {
    "Verdeo": 90,
    "Aceite de oliva": 30
   }
  },
  {
   "id": "top_FOC-ACE-M",
   "items": {
    "Aceitunas verdes": 25,
    "Aceitunas negras": 25,
    "Aceite de oliva": 10
   }
  },
  {
   "id": "top_FOC-ACE-G",
   "items": {
    "Aceitunas verdes": 60,
    "Aceitunas negras": 60,
    "Aceite de oliva": 30
   }
  },
  {
   "id": "top_FOC-PIC-M",
   "items": {
    "Picante": 1,
    "Aceite de oliva": 10
   }
  },
  {
   "id": "top_FOC-PIC-G",
   "items": {
    "Picante": 3,
    "Aceite de oliva": 30
   }
  },
  {
   "id": "top_FOC-ROQ-M",
   "items": {
    "Roquefort": 30,
    "Nueces": 8,
    "Miel": 5,
    "Aceite de oliva": 10
   }
  },
  {
   "id": "top_FOC-ROQ-G",
   "items": {
    "Roquefort": 98,
    "Nueces": 26,
    "Miel": 16,
    "Aceite de oliva": 30
   }
  },
  {
   "id": "top_FOC-PES-M",
   "items": {
    "Pesto": 23,
    "Queso sardo": 14,
    "Aceite de oliva": 10
   }
  },
  {
   "id": "top_FOC-PES-G",
   "items": {
    "Pesto": 75,
    "Queso sardo": 45,
    "Aceite de oliva": 30
   }
  }
 ],
 "config": [
  {
   "id": "reglas",
   "valores": {
    "capacidadBollos": 65,
    "maxAmasadora": 7,
    "kgTiradaDefault": 4,
    "grPrepizza": 320,
    "grFocMediana": 350,
    "grFocGrande": 1175,
    "lugarPrepizza": 1,
    "lugarFocMediana": 1,
    "lugarFocGrande": 3,
    "tdm": 24,
    "friccion": 9,
    "envio": 2000
   }
  }
 ]
};
