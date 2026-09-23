

// semilla mínima, como la que va a cargar Claude en la base real
const SEED = {};
const P = (sku,nombre,tipo,tamano,masa,precio,orden)=>SEED['productos/'+sku]=
  {sku,nombre,tipo,tamano,masa_gr:masa,precio,precio_comercio:null,orden};
P('PRE-TOM','Prepizza Tomate y Albahaca','Prepizza','Única',341,4500,1);
P('PRE-CEB','Prepizza Mix de Cebollas','Prepizza','Única',341,4500,2);
let o=3;
['Romero','Cherrys','Verdeo','Aceitunas','Picante','Roquefort','Pesto'].forEach(s=>{
  const c=s.slice(0,3).toUpperCase();
  P('FOC-'+c+'-M','Focaccia '+s,'Focaccia','Mediana',388,6000,o++);
  P('FOC-'+c+'-G','Focaccia '+s,'Focaccia','Grande',1164,16000,o++);
});
const I=(id,nombre,uc,cont,precio)=>SEED['insumos/'+id]={nombre,categoria:'x',unidad_compra:uc,contenido_gr:cont,precio_compra:precio,proveedor:''};
I('I01','Harina 00','bolsa 25 kg',25000,42000); I('I02','Harina 000','bolsa 25 kg',25000,31820);
I('I03','Sémola rimacinata','bolsa 25 kg',25000,45000); I('I04','Sal','paquete 5 kg',5000,4150);
I('I05','Levadura','pan 500 g',500,7000); I('I06','Aceite de oliva','bidón 5 L',4600,60000);
I('I07','Extracto de malta','medio kilo',500,6000); I('I08','Gas','garrafa 10 kg',10000,25000);
I('I09','Tomate','caja 3 kg',3000,7560); I('I10','Cebolla','1 kg',1000,900);
I('I11','Albahaca','atado 200 g',200,1500); I('I12','Romero','atado 200 g',200,1500);
I('I13','Tomates cherry','1 kg',1000,6000); I('I14','Verdeo','1 kg',1000,5000);
I('I15','Aceitunas verdes','1 kg',1000,7500); I('I16','Aceitunas negras','1 kg',1000,12900);
I('I17','Roquefort','1 kg',1000,15300); I('I18','Queso sardo','1 kg',1000,15837);
I('I19','Nueces','1 kg',1000,24000); I('I20','Pesto','1 kg',1000,0);
I('I21','Miel','1 kg',1000,0); I('I22','Picante','preparado',1000,0);
I('I23','Bolsa polipropileno','paquete x100',100,4105);
I('I24','Bandeja de cartón','paquete x100',100,6840);
I('I25','Etiqueta impresa','paquete x10',10,150);
SEED['clientes/CL1']={nombre:'Cintia',tipo:'Particular',telefono:'',zona:'Centro',direccion1:'Sarmiento 653',direccion2:'',notas:''};
SEED['clientes/CL2']={nombre:'Bife Padel',tipo:'Comercio',telefono:'',zona:'Centro',direccion1:'Cancha',direccion2:'',notas:''};
SEED['clientes/CL3']={nombre:'Feli Gusmerini',tipo:'Particular',telefono:'',zona:'UNLu',direccion1:'UNLu',direccion2:'Gral. Paz 1458',notas:''};


SEED['clientes/agus-urrizmendi']={"nombre": "Agus Urrizmendi", "tipo": "Particular", "telefono": "", "zona": "", "direccion1": "", "direccion2": "", "notas": "", "historico": "1 pedidos · 2 prepizzas · última 2026-04"};
SEED['clientes/alan-pasutti']={"nombre": "Alan Pasutti", "tipo": "Particular", "telefono": "", "zona": "San Juan de Dios", "direccion1": "San Juan de Dios", "direccion2": "", "notas": "", "historico": "2 pedidos · 8 prepizzas · última 2026-01"};
SEED['clientes/ale-desivo']={"nombre": "Ale Desivo", "tipo": "Particular", "telefono": "", "zona": "", "direccion1": "", "direccion2": "", "notas": "", "historico": "1 pedidos · 2 prepizzas · última 2026-01"};
SEED['clientes/alejandra-labato']={"nombre": "Alejandra Labato", "tipo": "Particular", "telefono": "", "zona": "", "direccion1": "", "direccion2": "", "notas": "", "historico": "1 pedidos · 4 prepizzas · última 2026-02"};
SEED['clientes/ana-laura-unlu']={"nombre": "Ana Laura UNLu", "tipo": "Particular", "telefono": "", "zona": "Centro", "direccion1": "General Paz 1458 e/ Dr Muñiz e Irigoyen", "direccion2": "", "notas": "Otras direcciones: General Paz 1458", "historico": "2 pedidos · 10 prepizzas · última 2026-07"};
SEED['clientes/analia-miglioranza']={"nombre": "Analia Miglioranza", "tipo": "Particular", "telefono": "", "zona": "Hospital", "direccion1": "Consultorio", "direccion2": "", "notas": "", "historico": "2 pedidos · 6 prepizzas · última 2026-04"};
SEED['clientes/argentino-paladea']={"nombre": "Argentino Paladea", "tipo": "Particular", "telefono": "", "zona": "UNLu", "direccion1": "UNLu", "direccion2": "", "notas": "", "historico": "1 pedidos · 2 prepizzas · última 2026-07"};
SEED['clientes/ari-saves']={"nombre": "Ari Saves", "tipo": "Particular", "telefono": "", "zona": "Centro", "direccion1": "Francia 1534", "direccion2": "", "notas": "", "historico": "2 pedidos · 2 prepizzas · última 2026-01"};
SEED['clientes/benja-guindani']={"nombre": "Benja Guindani", "tipo": "Particular", "telefono": "", "zona": "", "direccion1": "", "direccion2": "", "notas": "", "historico": "1 pedidos · 0 prepizzas · última 2026-03"};
SEED['clientes/bife-padel']={"nombre": "Bife Padel", "tipo": "Comercio", "telefono": "", "zona": "Centro", "direccion1": "Cancha", "direccion2": "", "notas": "también figura como Padel Bife; precio diferencial; Otras direcciones: Centro", "historico": "10 pedidos · 187 prepizzas · última 2026-09"};
SEED['clientes/bingo-gonza']={"nombre": "Bingo Gonza", "tipo": "Promoción", "telefono": "", "zona": "", "direccion1": "", "direccion2": "", "notas": "sorteo", "historico": "1 pedidos · 4 prepizzas · última 2026-05"};
SEED['clientes/brian-lujan-pesca']={"nombre": "Brian Lujan Pesca", "tipo": "Particular", "telefono": "", "zona": "Otros", "direccion1": "Luján Pesca", "direccion2": "", "notas": "", "historico": "2 pedidos · 8 prepizzas · última 2026-07"};
SEED['clientes/camila-abal']={"nombre": "Camila Abal", "tipo": "Particular", "telefono": "", "zona": "", "direccion1": "", "direccion2": "", "notas": "", "historico": "1 pedidos · 2 prepizzas · última 2026-04"};
SEED['clientes/carla-pserga']={"nombre": "Carla Pserga", "tipo": "Particular", "telefono": "", "zona": "Hospital", "direccion1": "Hospital", "direccion2": "", "notas": "", "historico": "4 pedidos · 8 prepizzas · última 2026-08"};
module.exports = SEED;
