import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Ic = {
  cal:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  gantt:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><rect x="6" y="9" width="5" height="2" rx="1" fill="currentColor" stroke="none"/><rect x="9" y="13" width="7" height="2" rx="1" fill="currentColor" stroke="none"/><rect x="6" y="17" width="9" height="2" rx="1" fill="currentColor" stroke="none"/></svg>,
  leaf:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M11 20A7 7 0 0 1 4 13c0-3.87 3.13-7 7-7 3.87 0 7 3.13 7 7a7 7 0 0 1-7 7z"/><path d="M11 20c0-4-2-7-7-8" strokeLinecap="round"/></svg>,
  bar:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  prev:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>,
  next:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>,
  print:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  dl:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  sun:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  cloud:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  moon:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  star:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  info:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  drop:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  therm:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  right:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

const MoonDefs = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
    <defs>
      <radialGradient id="mg_new" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#1e2d5a"/>
        <stop offset="70%" stopColor="#0b0f20"/>
        <stop offset="100%" stopColor="#040609"/>
      </radialGradient>
      <radialGradient id="mg_new_rim" cx="50%" cy="50%" r="50%">
        <stop offset="75%" stopColor="#1e2d5a" stopOpacity="0"/>
        <stop offset="100%" stopColor="#2a3870" stopOpacity="0.7"/>
      </radialGradient>
      <radialGradient id="mg_lit_r" cx="68%" cy="35%" r="62%">
        <stop offset="0%" stopColor="#fffef2"/>
        <stop offset="30%" stopColor="#ffe680"/>
        <stop offset="70%" stopColor="#e8a820"/>
        <stop offset="100%" stopColor="#8a6008"/>
      </radialGradient>
      <radialGradient id="mg_lit_l" cx="32%" cy="35%" r="62%">
        <stop offset="0%" stopColor="#fffef2"/>
        <stop offset="30%" stopColor="#ffe680"/>
        <stop offset="70%" stopColor="#e8a820"/>
        <stop offset="100%" stopColor="#8a6008"/>
      </radialGradient>
      <radialGradient id="mg_dark_r" cx="28%" cy="38%" r="60%">
        <stop offset="0%" stopColor="#161e40"/>
        <stop offset="100%" stopColor="#04060f"/>
      </radialGradient>
      <radialGradient id="mg_dark_l" cx="72%" cy="38%" r="60%">
        <stop offset="0%" stopColor="#161e40"/>
        <stop offset="100%" stopColor="#04060f"/>
      </radialGradient>
      <radialGradient id="mg_full" cx="40%" cy="33%" r="60%">
        <stop offset="0%" stopColor="#fffff8"/>
        <stop offset="25%" stopColor="#fff3a0"/>
        <stop offset="60%" stopColor="#f0c030"/>
        <stop offset="88%" stopColor="#c88a10"/>
        <stop offset="100%" stopColor="#8a5c06"/>
      </radialGradient>
      <radialGradient id="mg_glow" cx="50%" cy="50%" r="50%">
        <stop offset="55%" stopColor="#ffe060" stopOpacity="0"/>
        <stop offset="80%" stopColor="#ffe060" stopOpacity="0.18"/>
        <stop offset="100%" stopColor="#ffe060" stopOpacity="0"/>
      </radialGradient>
    </defs>
  </svg>
);

const MoonSVG = ({ fase, size = 'w-6 h-6' }) => {
  const R = 13, C = 16;
  const top = `${C},${C - R}`, bot = `${C},${C + R}`;

  if (fase === 'Luna Nueva') return (
    <svg viewBox="0 0 32 32" className={size}>
      <circle cx={C} cy={C} r={R} fill="url(#mg_new)"/>
      <circle cx={C} cy={C} r={R} fill="url(#mg_new_rim)"/>
      <circle cx={C} cy={C} r={R} fill="none" stroke="#1e2d5a" strokeWidth="0.6"/>
    </svg>
  );

  if (fase === 'Cuarto Creciente') return (
    <svg viewBox="0 0 32 32" className={size}>
      <circle cx={C} cy={C} r={R} fill="url(#mg_dark_r)"/>
      <path d={`M${top} A${R},${R} 0 0,1 ${bot} L${top} Z`} fill="url(#mg_lit_r)"/>
      <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8"/>
    </svg>
  );

  if (fase === 'Luna Llena') return (
    <svg viewBox="0 0 32 32" className={size}>
      <circle cx={C} cy={C} r={R + 4} fill="url(#mg_glow)"/>
      <circle cx={C} cy={C} r={R + 1.5} fill="none" stroke="#ffe060" strokeWidth="0.6" opacity="0.25"/>
      <circle cx={C} cy={C} r={R} fill="url(#mg_full)"/>
      <circle cx="20" cy="12.5" r="1.6" fill="#b8780a" opacity="0.22"/>
      <circle cx="12" cy="15.5" r="1.1" fill="#b8780a" opacity="0.17"/>
      <circle cx="19.5" cy="20" r="2" fill="#b8780a" opacity="0.14"/>
      <circle cx="13.5" cy="11.5" r="0.7" fill="#b8780a" opacity="0.2"/>
    </svg>
  );

  return (
    <svg viewBox="0 0 32 32" className={size}>
      <circle cx={C} cy={C} r={R} fill="url(#mg_dark_l)"/>
      <path d={`M${top} A${R},${R} 0 0,0 ${bot} L${top} Z`} fill="url(#mg_lit_l)"/>
      <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8"/>
    </svg>
  );
};

const MESES = [
  { mes:'Enero',      num:1,  dias:31, tempMin:4,  tempMax:16, lluvia:125, luna:[{d:6,fase:'Luna Nueva'},{d:13,fase:'Cuarto Creciente'},{d:21,fase:'Luna Llena'},{d:28,fase:'Cuarto Menguante'}], fest:[{d:1,n:'Año Nuevo'},{d:6,n:'Reyes Magos'}], siembra:['Maíz','Papa','Quinua','Cebada'], cosecha:['Habas tempranas','Arvejas'], clima:'Lluvias intensas · Riego mínimo', reco:'Época ideal para cultivos de ciclo corto. Aprovechar lluvias estacionales. Control de hongos por humedad excesiva.', semanas:[{s:1,act:'Control fitosanitario en cultivos establecidos'},{s:2,act:'Aporque de papa y maíz en crecimiento'},{s:3,act:'Siembra de quinua en parcelas preparadas'},{s:4,act:'Riego complementario si escasean lluvias'}] },
  { mes:'Febrero',    num:2,  dias:28, tempMin:5,  tempMax:15, lluvia:140, luna:[{d:5,fase:'Luna Nueva'},{d:12,fase:'Cuarto Creciente'},{d:19,fase:'Luna Llena'},{d:27,fase:'Cuarto Menguante'}], fest:[{d:2,n:'Virgen de la Candelaria'},{d:14,n:'San Valentín'}], siembra:['Trigo','Cebada','Hortalizas'], cosecha:['Papa temprana','Maíz choclo'], clima:'Lluvias máximas · Proteger parcelas', reco:'Control de plagas por humedad. Asegurar drenaje en terrenos bajos. Vigilar enfermedades foliares.', semanas:[{s:1,act:'Fumigación preventiva contra hongos'},{s:2,act:'Drenaje de surcos en áreas inundadas'},{s:3,act:'Primera cosecha de maíz choclo'},{s:4,act:'Selección de semillas para próxima campaña'}] },
  { mes:'Marzo',      num:3,  dias:31, tempMin:4,  tempMax:17, lluvia:80,  luna:[{d:7,fase:'Luna Nueva'},{d:14,fase:'Cuarto Creciente'},{d:21,fase:'Luna Llena'},{d:28,fase:'Cuarto Menguante'}], fest:[{d:8,n:'Día de la Mujer'},{d:19,n:'San José'}], siembra:['Olluco','Oca','Mashua'], cosecha:['Quinua','Kiwicha','Maíz'], clima:'Fin de lluvias · Preparar terrenos', reco:'Última siembra de cultivos andinos. Inicio de cosecha principal de la campaña. Preparar almacenes.', semanas:[{s:1,act:'Cosecha de quinua y maíz tardío'},{s:2,act:'Siembra de olluco y oca en zonas altas'},{s:3,act:'Limpieza de canales de riego'},{s:4,act:'Preparación de almacenes para cosecha'}] },
  { mes:'Abril',      num:4,  dias:30, tempMin:2,  tempMax:16, lluvia:35,  luna:[{d:5,fase:'Luna Nueva'},{d:13,fase:'Cuarto Creciente'},{d:20,fase:'Luna Llena'},{d:27,fase:'Cuarto Menguante'}], fest:[{d:1,n:'Semana Santa'}], siembra:['Habas (2da campaña)'], cosecha:['Papa','Oca','Olluco','Mashua'], clima:'Temporada seca · Cosecha principal', reco:'Época de cosecha de tubérculos andinos. Planificar almacenamiento tipo qolqa. Selección de semillas.', semanas:[{s:1,act:'Cosecha masiva de papa y tubérculos'},{s:2,act:'Clasificación y selección de semillas'},{s:3,act:'Deshidratación de papa para chuño/tunta'},{s:4,act:'Almacenamiento y registro de producción'}] },
  { mes:'Mayo',       num:5,  dias:31, tempMin:-2, tempMax:14, lluvia:12,  luna:[{d:5,fase:'Luna Nueva'},{d:12,fase:'Cuarto Creciente'},{d:19,fase:'Luna Llena'},{d:27,fase:'Cuarto Menguante'}], fest:[{d:1,n:'Día del Trabajo'},{d:11,n:'Día de la Madre'}], siembra:['Trigo de invierno'], cosecha:['Quinua','Cañihua','Tarwi'], clima:'Seco y frío · Heladas nocturnas', reco:'Protección contra heladas con humo o riego nocturno. Elaboración de chuño y moraya. Secado de granos.', semanas:[{s:1,act:'Elaboración de chuño y tunta (heladas)'},{s:2,act:'Cosecha de cañihua y tarwi'},{s:3,act:'Secado y trilla de granos'},{s:4,act:'Preparación y siembra de trigo invernal'}] },
  { mes:'Junio',      num:6,  dias:30, tempMin:-5, tempMax:13, lluvia:5,   luna:[{d:3,fase:'Luna Nueva'},{d:11,fase:'Cuarto Creciente'},{d:18,fase:'Luna Llena'},{d:25,fase:'Cuarto Menguante'}], fest:[{d:20,n:'Día del Padre'},{d:24,n:'Inti Raymi'},{d:29,n:'San Pedro y Pablo'}], siembra:[], cosecha:['Trigo','Cebada'], clima:'Mes más frío · Heladas fuertes', reco:'Mes de descanso agrícola. Mantenimiento de herramientas. Trilla de cereales. Planificación de próxima campaña.', semanas:[{s:1,act:'Trilla y venteado de trigo y cebada'},{s:2,act:'Mantenimiento de herramientas e infraestructura'},{s:3,act:'Inti Raymi — celebración y descanso'},{s:4,act:'Planificación de campaña 2026-2027'}] },
  { mes:'Julio',      num:7,  dias:31, tempMin:-6, tempMax:14, lluvia:4,   luna:[{d:2,fase:'Luna Nueva'},{d:10,fase:'Cuarto Creciente'},{d:17,fase:'Luna Llena'},{d:25,fase:'Cuarto Menguante'}], fest:[{d:28,n:'Fiestas Patrias'}], siembra:['Hortalizas bajo invernadero'], cosecha:['Habas secas'], clima:'Frío intenso · Cielos despejados', reco:'Preparación de almácigos bajo invernadero. Análisis de suelos para próxima campaña. Capacitaciones agrícolas.', semanas:[{s:1,act:'Análisis de suelo para campaña siguiente'},{s:2,act:'Almácigos de lechuga y cebolla bajo cobertura'},{s:3,act:'Fiestas Patrias — celebración y descanso'},{s:4,act:'Incorporación de abono verde al suelo'}] },
  { mes:'Agosto',     num:8,  dias:31, tempMin:-4, tempMax:16, lluvia:8,   luna:[{d:1,fase:'Luna Nueva'},{d:9,fase:'Cuarto Creciente'},{d:16,fase:'Luna Llena'},{d:23,fase:'Cuarto Menguante'},{d:30,fase:'Luna Nueva'}], fest:[{d:15,n:'Virgen de la Asunción'}], siembra:['Preparación intensiva de terrenos'], cosecha:[], clima:'Vientos · Inicio calentamiento', reco:'Preparación profunda de suelos. Incorporación de materia orgánica. Análisis de semillas para campaña grande.', semanas:[{s:1,act:'Roturación profunda de terrenos'},{s:2,act:'Incorporación de abono orgánico y compost'},{s:3,act:'Selección y tratamiento de semillas'},{s:4,act:'Construcción y reparación de andenes'}] },
  { mes:'Septiembre', num:9,  dias:30, tempMin:2,  tempMax:18, lluvia:28,  luna:[{d:7,fase:'Cuarto Creciente'},{d:14,fase:'Luna Llena'},{d:22,fase:'Cuarto Menguante'},{d:29,fase:'Luna Nueva'}], fest:[{d:8,n:'Día de la Alfabetización'}], siembra:['Papa (campaña grande)','Maíz','Quinua'], cosecha:[], clima:'Primavera · Lluvias esporádicas', reco:'Inicio de siembra principal. Aplicar fertilizante de fondo. Verificar sistema de riego antes de las lluvias.', semanas:[{s:1,act:'Siembra de papa en parcelas grandes'},{s:2,act:'Siembra de maíz en zonas medias'},{s:3,act:'Fertilización de fondo NPK'},{s:4,act:'Instalación y revisión de sistema de riego'}] },
  { mes:'Octubre',    num:10, dias:31, tempMin:4,  tempMax:19, lluvia:55,  luna:[{d:7,fase:'Cuarto Creciente'},{d:14,fase:'Luna Llena'},{d:21,fase:'Cuarto Menguante'},{d:28,fase:'Luna Nueva'}], fest:[{d:8,n:'Combate de Angamos'},{d:31,n:'Canción Criolla'}], siembra:['Habas','Arvejas','Trigo'], cosecha:[], clima:'Lluvias regulares · Temp. agradable', reco:'Continuar siembras planificadas. Control de malezas en cultivos establecidos. Primer aporque de papa.', semanas:[{s:1,act:'Siembra de habas y arvejas'},{s:2,act:'Primer deshierbe en cultivos'},{s:3,act:'Primer aporque de papa recién emergida'},{s:4,act:'Control preventivo de plagas en maíz'}] },
  { mes:'Noviembre',  num:11, dias:30, tempMin:5,  tempMax:18, lluvia:88,  luna:[{d:5,fase:'Cuarto Creciente'},{d:12,fase:'Luna Llena'},{d:20,fase:'Cuarto Menguante'},{d:27,fase:'Luna Nueva'}], fest:[{d:1,n:'Todos los Santos'},{d:2,n:'Día de los Difuntos'}], siembra:['Cebada','Avena forrajera'], cosecha:['Habas verdes','Arvejas verdes'], clima:'Lluvias intensas · Granizadas', reco:'Aporque de cultivos. Fertilización complementaria. Vigilancia fitosanitaria intensiva ante granizadas.', semanas:[{s:1,act:'Segundo aporque de papa y maíz'},{s:2,act:'Aplicación de fertilizante foliar'},{s:3,act:'Cosecha de habas y arvejas verdes'},{s:4,act:'Vigilancia granizadas — coberturas protectoras'}] },
  { mes:'Diciembre',  num:12, dias:31, tempMin:6,  tempMax:17, lluvia:115, luna:[{d:4,fase:'Cuarto Creciente'},{d:12,fase:'Luna Llena'},{d:19,fase:'Cuarto Menguante'},{d:27,fase:'Luna Nueva'}], fest:[{d:8,n:'Inmaculada Concepción'},{d:25,n:'Navidad'}], siembra:['Últimas siembras de maíz'], cosecha:['Papa temprana','Hortalizas'], clima:'Lluvias fuertes · Verano lluvioso', reco:'Control fitosanitario intensivo. Preparar infraestructura para cosecha de verano. Riego no necesario.', semanas:[{s:1,act:'Control de hongos y mildiu en papa'},{s:2,act:'Cosecha de hortalizas tempranas'},{s:3,act:'Navidad — celebración y descanso'},{s:4,act:'Balance de campaña y planificación 2027'}] },
];

const CULTIVOS_ANDINOS = [
  { nombre:'Papa', emoji:'🥔', familia:'Solanaceae', altitud:'3200-4100 msnm', siembraMeses:[8,9,10], cosechaMeses:[2,3,4], duracion:'6-8 meses', riego:'450-600 mm', espaciado:'90×30 cm', profundidad:'12 cm', desc:'Cultivo principal del Altiplano. Más de 3000 variedades en Perú. Tolerante a heladas en variedades nativas.', variedades:['Huayro','Imilla Negra','Ccompis','Única','Canchan','Yungay'] },
  { nombre:'Quinua', emoji:'🌾', familia:'Amaranthaceae', altitud:'3000-4000 msnm', siembraMeses:[8,9,10], cosechaMeses:[2,3,4], duracion:'5-8 meses', riego:'300-500 mm', espaciado:'40×25 cm', profundidad:'2 cm', desc:'Superalimento andino con proteína completa. Tolerante a sequía, heladas y salinidad. Patrimonio de la humanidad.', variedades:['Salcedo INIA','Kancolla','Blanca de Juli','Rosada de Huancané','Negra Collana'] },
  { nombre:'Maíz', emoji:'🌽', familia:'Poaceae', altitud:'2800-3500 msnm', siembraMeses:[9,10], cosechaMeses:[2,3], duracion:'5-7 meses', riego:'500-800 mm', espaciado:'80×40 cm', profundidad:'5 cm', desc:'Cultivo ancestral andino. Variedad maíz morado de alto valor nutricional. Base de la alimentación puneña.', variedades:['Maíz morado','Choclo blanco','Cancha','Kulli'] },
  { nombre:'Cañihua', emoji:'🌿', familia:'Amaranthaceae', altitud:'3800-4500 msnm', siembraMeses:[8,9], cosechaMeses:[3,4,5], duracion:'6-7 meses', riego:'350-400 mm', espaciado:'30×20 cm', profundidad:'1 cm', desc:'Más resistente que la quinua. Altamente nutritiva. Crece hasta los 4500 msnm donde otros cultivos no prosperan.', variedades:['Cupi','Illimani','Ramis'] },
  { nombre:'Habas', emoji:'🫘', familia:'Fabaceae', altitud:'3000-4000 msnm', siembraMeses:[9,10], cosechaMeses:[3,4,11], duracion:'5-7 meses', riego:'350-500 mm', espaciado:'60×30 cm', profundidad:'5 cm', desc:'Leguminosa fijadora de nitrógeno. Mejora la fertilidad del suelo. Se consume verde y seco.', variedades:['IPA Gloriabamba','San Isidro','Copacabana'] },
  { nombre:'Oca', emoji:'🟠', familia:'Oxalidaceae', altitud:'3200-4000 msnm', siembraMeses:[2,3], cosechaMeses:[4,5], duracion:'7-8 meses', riego:'600-700 mm', espaciado:'60×30 cm', profundidad:'8 cm', desc:'Tubérculo nativo andino con alto contenido de oxalatos. Segunda después de la papa en importancia.', variedades:['Huari','Pauccar','Chullpi'] },
  { nombre:'Olluco', emoji:'🟡', familia:'Basellaceae', altitud:'3000-4200 msnm', siembraMeses:[2,3], cosechaMeses:[4,5], duracion:'7-9 meses', riego:'600-800 mm', espaciado:'60×30 cm', profundidad:'8 cm', desc:'Tubérculo andino muy nutritivo. Gran parte de su biomasa es agua. Importante en la dieta altiplánica.', variedades:['Puca shungo','Amarillo','Blanco'] },
  { nombre:'Tarwi', emoji:'🌱', familia:'Fabaceae', altitud:'2800-3800 msnm', siembraMeses:[9,10], cosechaMeses:[4,5], duracion:'6-8 meses', riego:'400-600 mm', espaciado:'50×30 cm', profundidad:'4 cm', desc:'Leguminosa con mayor contenido proteico que la soya. Fija nitrógeno atmosférico. Requiere desamargado.', variedades:['INIA 450','Quillahuaman','Andenes'] },
  { nombre:'Trigo', emoji:'🌾', familia:'Poaceae', altitud:'2800-3800 msnm', siembraMeses:[4,5,9], cosechaMeses:[6,7], duracion:'5-6 meses', riego:'350-500 mm', espaciado:'15×15 cm', profundidad:'3 cm', desc:'Cereal importante para el autoconsumo y comercialización. Requiere suelos bien drenados y pH neutro.', variedades:['Centenario','INIA 414','Andino'] },
  { nombre:'Cebada', emoji:'🌾', familia:'Poaceae', altitud:'3000-4200 msnm', siembraMeses:[1,2,9,10], cosechaMeses:[5,6,7], duracion:'4-6 meses', riego:'300-450 mm', espaciado:'20×15 cm', profundidad:'4 cm', desc:'Cereal más adaptado a las condiciones del Altiplano. Usado en alimentación humana, animal y elaboración de chicha.', variedades:['INIA 416','Quirusillas','UNA 80'] },
];

const getLuna = (mes) => mes.luna.map(l => ({ d: l.d, fase: l.fase }));

const LUNA_INFO = {
  'Luna Nueva':       { txt: 'Siembra de raíces y tubérculos.',          color: 'bg-black/[0.03] dark:bg-white/[0.04]' },
  'Cuarto Creciente': { txt: 'Favorable para frutos y plantas de hoja.', color: 'bg-amber-50/70 dark:bg-amber-900/20' },
  'Luna Llena':       { txt: 'Óptimo para cosecha y recolección.',        color: 'bg-yellow-50/70 dark:bg-yellow-900/20' },
  'Cuarto Menguante': { txt: 'Ideal para control de plagas y poda.',      color: 'bg-indigo-50/70 dark:bg-indigo-900/20' },
};

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const Card = ({ children, className = '' }) => (
  <div className="rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-b from-black/[0.02] to-transparent dark:from-white/[0.04] dark:to-transparent">
    <div className={`rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 overflow-hidden ${className}`}>
      {children}
    </div>
  </div>
);

const SectionTitle = ({ icon, title, sub, action }) => (
  <div className="flex items-center justify-between px-5 pt-5 pb-3">
    <div className="flex items-start gap-3">
      {icon && (
        <span className="mt-0.5 shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] ring-1 ring-black/5 dark:ring-white/10">{icon}</span>
      )}
      <div>
        <h3 className="font-display font-bold text-gray-900 dark:text-white text-sm leading-tight tracking-tight">{title}</h3>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
    {action}
  </div>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#04140d] text-white text-xs rounded-xl px-3 py-2 ring-1 ring-white/15">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.fill }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

const AlmanaqueBristol = () => {
  const [mesIdx, setMesIdx]     = useState(new Date().getMonth());
  const [vista, setVista]       = useState('mensual');
  const [busqueda, setBusqueda] = useState('');
  const [cultivoSel, setCultivoSel] = useState(null);
  const mes = MESES[mesIdx];

  const handleExport = () => {
    const txt = `ALMANAQUE BRISTOL 2026 — ${mes.mes}\n\nSIEMBRA: ${mes.siembra.join(', ')}\nCOSECHA: ${mes.cosecha.join(', ')}\nCLIMA: ${mes.clima}\nRECOMENDACIÓN: ${mes.reco}\n\nACTIVIDADES SEMANALES:\n${mes.semanas.map(s => `  Semana ${s.s}: ${s.act}`).join('\n')}\n\nFASES LUNARES:\n${getLuna(mes).map(f => `  Día ${f.d} — ${f.fase}`).join('\n')}`;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([txt], { type: 'text/plain' })),
      download: `Almanaque_${mes.mes}_2026.txt`,
    });
    a.click();
  };

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return MESES.flatMap(m => {
      const s = m.siembra.filter(c => c.toLowerCase().includes(q));
      const c = m.cosecha.filter(c => c.toLowerCase().includes(q));
      return [
        ...(s.length ? [{ mes: m.mes, tipo: 'Siembra', items: s }] : []),
        ...(c.length ? [{ mes: m.mes, tipo: 'Cosecha', items: c }] : []),
      ];
    });
  }, [busqueda]);

  const diasCalendario = () => {
    const first = new Date(2026, mesIdx, 1).getDay();
    const out = Array(first).fill(null);
    for (let d = 1; d <= mes.dias; d++) out.push(d);
    return out;
  };

  const getDiaInfo = (d) => {
    if (!d) return null;
    const today = new Date();
    return {
      luna:    getLuna(mes).find(f => f.d === d) || null,
      festiv:  mes.fest.find(f => f.d === d) || null,
      isToday: today.getFullYear() === 2026 && today.getMonth() === mesIdx && today.getDate() === d,
    };
  };

  const chartData = MESES.map(m => ({
    mes: MESES_CORTOS[m.num - 1],
    siembra: m.siembra.length,
    cosecha: m.cosecha.length,
    lluvia:  m.lluvia,
  }));

  const VIEWS = [
    { id:'mensual',   label:'Mensual',   icon: Ic.cal   },
    { id:'anual',     label:'Gantt',     icon: Ic.gantt },
    { id:'cultivos',  label:'Cultivos',  icon: Ic.leaf  },
    { id:'stats',     label:'Análisis',  icon: Ic.bar   },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-full">
      <MoonDefs />

      <div className="rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-b from-black/[0.02] to-transparent dark:from-white/[0.04] dark:to-transparent">
        <div className="relative overflow-hidden rounded-[calc(1rem-0.375rem)] bg-[#04140d] px-5 py-6 sm:px-8 sm:py-7 text-white">
          <div aria-hidden className="pointer-events-none absolute -top-28 -left-20 w-[26rem] h-[26rem] rounded-full bg-emerald-500/25 blur-[120px]" />
          <div aria-hidden className="pointer-events-none absolute bottom-[-9rem] right-[-5rem] w-[28rem] h-[28rem] rounded-full bg-teal-400/15 blur-[140px]" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-[1.05] tracking-tight">Almanaque Bristol</h1>
              <p className="mt-1.5 text-sm text-emerald-100/60">Calendario agrícola y lunar del altiplano andino</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-2xl p-1 bg-white/[0.06] ring-1 ring-white/10">
                {VIEWS.map(v => (
                  <button key={v.id} onClick={() => setVista(v.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation ${
                      vista === v.id
                        ? 'bg-emerald-500 text-white ring-1 ring-emerald-300/30'
                        : 'text-emerald-100/70 hover:text-white hover:bg-white/[0.06]'
                    }`}>
                    <span>{v.icon}</span>
                    <span className="hidden sm:inline">{v.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold text-emerald-100/80 bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.1] hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation">
                {Ic.print}<span className="hidden sm:inline">Imprimir</span>
              </button>
              <button onClick={handleExport} className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold text-emerald-100/80 bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.1] hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation">
                {Ic.dl}<span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {(vista === 'mensual' || vista === 'anual') && (
        <Card className="px-4 py-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Ic.search}</span>
            <input
              type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar cultivo en todos los meses… (papa, quinua, maíz)"
              className="w-full pl-9 pr-4 h-10 text-xs rounded-xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            />
          </div>
          {resultados.length > 0 && (
            <div className="mt-3 bg-emerald-50/70 dark:bg-emerald-900/20 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 rounded-2xl p-3">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">{resultados.length} resultado{resultados.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {resultados.map((r, i) => (
                  <button key={i} onClick={() => { const idx = MESES.findIndex(m => m.mes === r.mes); setMesIdx(idx); setVista('mensual'); setBusqueda(''); }}
                    className="bg-white dark:bg-white/[0.04] rounded-xl px-3 py-2 ring-1 ring-emerald-500/10 dark:ring-emerald-400/10 text-left hover:ring-emerald-500/40 dark:hover:ring-emerald-400/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{r.mes}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.tipo === 'Siembra' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>{r.tipo}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{r.items.join(', ')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {busqueda && !resultados.length && <p className="mt-2 text-xs text-gray-400 pl-1">Sin resultados para "{busqueda}"</p>}
        </Card>
      )}

      {vista === 'mensual' && (
        <>
          <Card>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/5 dark:border-white/5">
              <button onClick={() => setMesIdx(i => i === 0 ? 11 : i - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.05] ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:ring-emerald-500/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] touch-manipulation">
                {Ic.prev}
              </button>
              <div className="text-center">
                <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">{mes.mes} 2026</h2>
                <div className="flex items-center justify-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-blue-500 font-semibold"><span>{Ic.drop}</span>{mes.lluvia} mm</span>
                  <span className="flex items-center gap-1 text-[10px] text-orange-500 font-semibold"><span>{Ic.therm}</span>{mes.tempMin}°–{mes.tempMax}°</span>
                </div>
              </div>
              <button onClick={() => setMesIdx(i => i === 11 ? 0 : i + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.05] ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:ring-emerald-500/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] touch-manipulation">
                {Ic.next}
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="grid grid-cols-7 mb-1">
                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-wide py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {diasCalendario().map((d, i) => {
                  const info = getDiaInfo(d);
                  return (
                    <div key={i} className={`relative flex flex-col items-center pt-1.5 h-12 sm:h-14 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      !d ? '' : info?.isToday
                        ? 'bg-emerald-500 ring-1 ring-emerald-300/40'
                        : info?.festiv && info?.luna
                          ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500/20 dark:ring-purple-400/20'
                          : info?.festiv
                            ? 'bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500/20 dark:ring-red-400/20'
                            : info?.luna
                              ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500/20 dark:ring-amber-400/20'
                              : 'ring-1 ring-black/[0.03] dark:ring-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
                    }`}>
                      {d && (
                        <>
                          <span className={`text-xs font-black leading-none ${info?.isToday ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{d}</span>
                          {info?.luna && <div className="mt-0.5"><MoonSVG fase={info.luna.fase} size="w-3.5 h-3.5" /></div>}
                          {info?.festiv && !info?.luna && <div className="w-1 h-1 rounded-full bg-red-400 mt-0.5" />}
                          {info?.festiv && (
                            <div className="absolute bottom-0.5 left-0 right-0 px-0.5">
                              <p className="text-[7px] text-red-500 dark:text-red-400 font-bold truncate leading-tight text-center">{info.festiv.n}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex-wrap">
                {[
                  { cls:'bg-emerald-500 ring-1 ring-emerald-300/40', label:'Hoy' },
                  { cls:'bg-amber-50 ring-1 ring-amber-500/30', label:'Fase lunar' },
                  { cls:'bg-red-50 ring-1 ring-red-500/30', label:'Festividad' },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-md ${l.cls}`} />
                    <span className="text-[10px] text-gray-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-4 mb-4 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl p-4 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-indigo-500">{Ic.moon}</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Fases lunares de {mes.mes}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {getLuna(mes).map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${LUNA_INFO[f.fase]?.color || ''}`}>
                    <MoonSVG fase={f.fase} size="w-6 h-6" />
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">{f.fase}</p>
                      <p className="text-[10px] text-gray-400">Día {f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <SectionTitle icon={<span className="text-emerald-500">{Ic.leaf}</span>} title="Siembra" sub={mes.siembra.length ? `${mes.siembra.length} cultivos recomendados` : 'No es época de siembra'} />
              <div className="px-5 pb-5">
                {mes.siembra.length ? (
                  <div className="space-y-1.5">
                    {mes.siembra.map((c, i) => (
                      <button key={i} onClick={() => { const cult = CULTIVOS_ANDINOS.find(x => x.nombre.toLowerCase() === c.toLowerCase() || c.toLowerCase().includes(x.nombre.toLowerCase())); if (cult) { setCultivoSel(cult); setVista('cultivos'); } }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-emerald-50/70 dark:bg-emerald-900/20 rounded-xl ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 hover:ring-emerald-500/40 dark:hover:ring-emerald-400/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] text-left touch-manipulation group">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">{c}</span>
                        <span className="text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">{Ic.right}</span>
                      </button>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-400 italic">Sin siembras programadas para este mes.</p>}
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<span className="text-amber-500">{Ic.sun}</span>} title="Cosecha" sub={mes.cosecha.length ? `${mes.cosecha.length} cultivos para cosechar` : 'No es época de cosecha'} />
              <div className="px-5 pb-5">
                {mes.cosecha.length ? (
                  <div className="space-y-1.5">
                    {mes.cosecha.map((c, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-amber-50/70 dark:bg-amber-900/20 rounded-xl ring-1 ring-amber-500/15 dark:ring-amber-400/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{c}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-400 italic">Sin cosechas programadas para este mes.</p>}
              </div>
            </Card>
          </div>

          <Card>
            <SectionTitle icon={<span className="text-sky-500">{Ic.cloud}</span>} title="Clima y recomendación" sub={mes.clima} />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { icon: Ic.therm, label: 'Temp. mín.', v: `${mes.tempMin}°C`, cls: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                  { icon: Ic.therm, label: 'Temp. máx.', v: `${mes.tempMax}°C`, cls: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
                  { icon: Ic.drop,  label: 'Lluvia',     v: `${mes.lluvia} mm`, cls: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
                ].map((s, i) => (
                  <div key={i} className={`flex flex-col items-center py-3 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 ${s.cls}`}>
                    <span className="mb-1">{s.icon}</span>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{s.v}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-sky-50/70 dark:bg-sky-900/20 ring-1 ring-sky-500/15 dark:ring-sky-400/15 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                <span className="text-sky-500 shrink-0 mt-0.5">{Ic.info}</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{mes.reco}</p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={<span className="text-violet-500">{Ic.cal}</span>} title="Actividades por semana" sub="Calendario de labores agrícolas" />
            <div className="px-5 pb-5 space-y-2">
              {mes.semanas.map((s, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
                  <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-900/30 ring-1 ring-violet-500/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-violet-700 dark:text-violet-400">{s.s}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Semana {s.s}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-tight mt-0.5">{s.act}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {mes.fest.length > 0 && (
            <Card>
              <SectionTitle icon={<span className="text-red-400">{Ic.star}</span>} title="Festividades" sub={`${mes.fest.length} fechas importantes`} />
              <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mes.fest.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-red-50/70 dark:bg-red-900/20 ring-1 ring-red-500/15 dark:ring-red-400/15 rounded-2xl px-3 py-2.5">
                    <span className="text-lg font-black text-red-500 shrink-0 w-6 text-center">{f.d}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{f.n}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle icon={<span className="text-indigo-400">{Ic.moon}</span>} title="Guía de siembra por fase lunar" sub="Almanaque Bristol — Tradición agrícola andina" />
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(LUNA_INFO).map(([fase, info], i) => (
                <div key={i} className={`flex items-start gap-3 px-3 py-3 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 ${info.color}`}>
                  <MoonSVG fase={fase} size="w-6 h-6" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-0.5">{fase}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{info.txt}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {vista === 'anual' && (
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Gantt — Siembra y cosecha anual 2026" sub="Verde = siembra · Naranja = cosecha · Clic para ver el mes" />
            <div className="px-5 pb-5 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid items-center mb-2" style={{ gridTemplateColumns: '120px repeat(12, 1fr)' }}>
                  <div />
                  {MESES_CORTOS.map(m => (
                    <div key={m} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">{m}</div>
                  ))}
                </div>
                {[...new Set(MESES.flatMap(m => [...m.siembra, ...m.cosecha]))].sort().map((cultivo) => (
                  <div key={cultivo} className="grid items-center mb-1" style={{ gridTemplateColumns: '120px repeat(12, 1fr)' }}>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">{cultivo}</span>
                    {MESES.map((m, mi) => {
                      const esSiembra = m.siembra.some(s => s.toLowerCase().includes(cultivo.toLowerCase()) || cultivo.toLowerCase().includes(s.toLowerCase()));
                      const esCosecha = m.cosecha.some(s => s.toLowerCase().includes(cultivo.toLowerCase()) || cultivo.toLowerCase().includes(s.toLowerCase()));
                      return (
                        <button key={mi} onClick={() => { setMesIdx(mi); setVista('mensual'); }}
                          className={`h-5 mx-0.5 rounded-md transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation ${
                            esSiembra && esCosecha ? 'bg-violet-400 dark:bg-violet-600' :
                            esSiembra ? 'bg-emerald-400 dark:bg-emerald-600 hover:bg-emerald-500' :
                            esCosecha ? 'bg-amber-400 dark:bg-amber-600 hover:bg-amber-500' :
                            'bg-black/[0.04] dark:bg-white/[0.05] ring-1 ring-black/[0.03] dark:ring-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.08]'
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
                <div className="flex items-center gap-5 mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                  {[
                    { cls:'bg-emerald-400', label:'Siembra' },
                    { cls:'bg-amber-400',   label:'Cosecha' },
                    { cls:'bg-violet-400',  label:'Siembra y Cosecha' },
                    { cls:'bg-black/[0.04] ring-1 ring-black/10', label:'Sin actividad' },
                  ].map((l, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`w-4 h-3 rounded-md ${l.cls}`} />
                      <span className="text-[10px] text-gray-500">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MESES.map((m, i) => {
              const isActual = i === new Date().getMonth();
              return (
                <button key={i} onClick={() => { setMesIdx(i); setVista('mensual'); }}
                  className={`text-left bg-white dark:bg-gray-900 rounded-2xl p-4 hover:-translate-y-0.5 hover:ring-emerald-500/40 dark:hover:ring-emerald-400/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group touch-manipulation ${
                    isActual ? 'ring-2 ring-emerald-500/50 dark:ring-emerald-400/50' : 'ring-1 ring-black/5 dark:ring-white/10'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-black ${isActual ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>{m.mes}</h3>
                    <div className="flex gap-0.5">{getLuna(m).slice(0, 4).map((f, j) => <MoonSVG key={j} fase={f.fase} size="w-3.5 h-3.5" />)}</div>
                  </div>
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500 shrink-0">{Ic.leaf}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{m.siembra.length ? m.siembra.slice(0, 2).join(', ') + (m.siembra.length > 2 ? '…' : '') : <span className="text-gray-300 italic">—</span>}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 shrink-0">{Ic.sun}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{m.cosecha.length ? m.cosecha.slice(0, 2).join(', ') + (m.cosecha.length > 2 ? '…' : '') : <span className="text-gray-300 italic">—</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{m.tempMin}°–{m.tempMax}°</span>
                      <span>{m.lluvia} mm</span>
                    </div>
                    <span className="text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">{Ic.right}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {vista === 'cultivos' && (
        <div className="space-y-4">
          {cultivoSel ? (
            <Card>
              <div className="p-5">
                <button onClick={() => setCultivoSel(null)} className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-4 px-3 py-1.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 hover:bg-emerald-500/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Volver a todos los cultivos
                </button>
                <div className="flex items-center gap-4 mb-5">
                  <span className="flex items-center justify-center w-16 h-16 text-4xl rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15">{cultivoSel.emoji}</span>
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white">{cultivoSel.nombre}</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{cultivoSel.familia}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5 bg-black/[0.02] dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl px-4 py-3">{cultivoSel.desc}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { label:'Altitud',    v: cultivoSel.altitud,    cls:'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400' },
                    { label:'Duración',   v: cultivoSel.duracion,   cls:'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' },
                    { label:'Riego',      v: cultivoSel.riego,      cls:'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
                    { label:'Espaciado',  v: cultivoSel.espaciado,  cls:'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
                    { label:'Profundidad',v: cultivoSel.profundidad, cls:'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
                  ].map((d, i) => (
                    <div key={i} className={`rounded-2xl px-3 py-3 ring-1 ring-black/5 dark:ring-white/10 ${d.cls}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">{d.label}</p>
                      <p className="text-sm font-black">{d.v}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Meses de siembra</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cultivoSel.siembraMeses.map(m => (
                        <button key={m} onClick={() => { setMesIdx(m); setVista('mensual'); }}
                          className="px-2.5 py-1 bg-emerald-50/70 dark:bg-emerald-900/20 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold hover:bg-emerald-100/80 hover:ring-emerald-500/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation">
                          {MESES[m].mes}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">Meses de cosecha</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cultivoSel.cosechaMeses.map(m => (
                        <button key={m} onClick={() => { setMesIdx(m); setVista('mensual'); }}
                          className="px-2.5 py-1 bg-amber-50/70 dark:bg-amber-900/20 ring-1 ring-amber-500/15 dark:ring-amber-400/15 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold hover:bg-amber-100/80 hover:ring-amber-500/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation">
                          {MESES[m].mes}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Variedades principales</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cultivoSel.variedades.map((v, i) => (
                      <span key={i} className="px-2.5 py-1 bg-black/[0.03] dark:bg-white/[0.05] ring-1 ring-black/5 dark:ring-white/10 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CULTIVOS_ANDINOS.map((c, i) => (
                <button key={i} onClick={() => setCultivoSel(c)}
                  className="text-left bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-5 hover:-translate-y-0.5 hover:ring-emerald-500/40 dark:hover:ring-emerald-400/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group touch-manipulation">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-12 h-12 text-2xl rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15">{c.emoji}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{c.nombre}</h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{c.altitud}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">{c.desc}</p>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{c.siembraMeses.length} meses siembra</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{c.cosechaMeses.length} meses cosecha</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{c.duracion}</span>
                    <span className="text-gray-300 dark:text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">{Ic.right}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {vista === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Cultivos de siembra', v: [...new Set(MESES.flatMap(m => m.siembra))].length, sub:'variedades únicas',    color:'bg-emerald-500', icon:Ic.leaf },
              { label:'Cultivos de cosecha', v: [...new Set(MESES.flatMap(m => m.cosecha))].length, sub:'variedades únicas',    color:'bg-amber-500',   icon:Ic.sun },
              { label:'Meses con siembra',   v: MESES.filter(m => m.siembra.length).length,         sub:'de 12 meses',         color:'bg-green-500',   icon:Ic.cal },
              { label:'Fases lunares',       v: MESES.reduce((a, m) => a + getLuna(m).length, 0),   sub:'registradas en 2026', color:'bg-indigo-500',  icon:Ic.moon },
            ].map((k, i) => (
              <Card key={i} className="p-5">
                <div className={`${k.color} w-9 h-9 rounded-xl ring-1 ring-white/20 flex items-center justify-center text-white mb-3`}>{k.icon}</div>
                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{k.v}</p>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">{k.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{k.sub}</p>
              </Card>
            ))}
          </div>

          <Card>
            <SectionTitle title="Actividad agrícola mensual" sub="Cantidad de cultivos de siembra y cosecha por mes" />
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }} />
                  <Bar dataKey="siembra" fill="#10b981" radius={[4,4,0,0]} name="Siembra" />
                  <Bar dataKey="cosecha" fill="#f59e0b" radius={[4,4,0,0]} name="Cosecha" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Precipitación mensual 2026" sub="Estimado histórico para la región de Puno · mm" />
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="lluvia" fill="#3b82f6" radius={[4,4,0,0]} name="Lluvia (mm)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <SectionTitle icon={<span className="text-emerald-500">{Ic.leaf}</span>} title="Todos los cultivos de siembra" sub="Variedades del almanaque 2026" />
              <div className="px-5 pb-5 flex flex-wrap gap-1.5">
                {[...new Set(MESES.flatMap(m => m.siembra))].sort().map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50/70 dark:bg-emerald-900/20 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">{c}</span>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle icon={<span className="text-amber-500">{Ic.sun}</span>} title="Todos los cultivos de cosecha" sub="Variedades del almanaque 2026" />
              <div className="px-5 pb-5 flex flex-wrap gap-1.5">
                {[...new Set(MESES.flatMap(m => m.cosecha))].sort().map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-50/70 dark:bg-amber-900/20 ring-1 ring-amber-500/15 dark:ring-amber-400/15 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">{c}</span>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <SectionTitle title="Tabla anual completa de cultivos 2026" sub="Siembra · Cosecha · Fases lunares por mes" />
            <div className="px-5 pb-5 overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    {['Mes','Temp','Lluvia','Siembra','Cosecha','Lunas'].map(h => (
                      <th key={h} className="text-left pb-2 pr-3 font-black text-gray-400 dark:text-gray-600 uppercase tracking-wide text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {MESES.map((m, i) => (
                    <tr key={i} className="hover:bg-emerald-500/[0.04] transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer" onClick={() => { setMesIdx(i); setVista('mensual'); }}>
                      <td className="py-2.5 pr-3 font-black text-gray-800 dark:text-gray-200">{m.mes}</td>
                      <td className="py-2.5 pr-3 text-gray-500 whitespace-nowrap">{m.tempMin}°–{m.tempMax}°</td>
                      <td className="py-2.5 pr-3 text-sky-500 font-semibold">{m.lluvia} mm</td>
                      <td className="py-2.5 pr-3 text-emerald-600 dark:text-emerald-400">{m.siembra.join(', ') || <span className="text-gray-300 italic">—</span>}</td>
                      <td className="py-2.5 pr-3 text-amber-600 dark:text-amber-400">{m.cosecha.join(', ') || <span className="text-gray-300 italic">—</span>}</td>
                      <td className="py-2.5"><div className="flex gap-0.5">{getLuna(m).slice(0,4).map((f,j) => <MoonSVG key={j} fase={f.fase} size="w-3.5 h-3.5" />)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default AlmanaqueBristol;
