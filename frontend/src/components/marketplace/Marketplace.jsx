import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

const Ic = {
  search:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  filter:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  truck:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  pkg:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  star:    <svg viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" className="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  shield:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const PRODUCTOS = [
  { id:1,  nombre:'Semilla Papa Canchán Certificada 25kg',      categoria:'Semillas',      subcategoria:'Papa',         precio:180,  precioOriginal:220, imagen:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/semillas-papa/',                            envioGratis:true,  rating:4.8, vendidos:450,  stock:true, vendedor:'AgroSemillas Peru',    descripcion:'Semilla certificada variedad Canchan, ideal para altiplano puneno. Alto rendimiento y resistente a heladas.' },
  { id:2,  nombre:'Semilla Papa Yungay Certificada 50kg',       categoria:'Semillas',      subcategoria:'Papa',         precio:340,  precioOriginal:400, imagen:'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400', plataforma:'Amazon',       url:'https://www.amazon.com/-/es/s?k=semilla+papa',                             envioGratis:false, rating:4.6, vendidos:320,  stock:true, vendedor:'Semillas Premium',     descripcion:'Semilla certificada variedad Yungay, resistente a enfermedades foliares.' },
  { id:3,  nombre:'Kit Papa Nativa 5 Variedades 10kg',          categoria:'Semillas',      subcategoria:'Papa',         precio:150,  precioOriginal:null,imagen:'https://images.unsplash.com/photo-1587049352846-4a222e784422?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/semillas/',                                 envioGratis:true,  rating:5.0, vendidos:180,  stock:true, vendedor:'Papas del Altiplano', descripcion:'Incluye Huayro, Peruanita, Negra, Amarilis y Unica. 10kg total.' },
  { id:4,  nombre:'Semilla Quinua Blanca Certificada 20kg',     categoria:'Semillas',      subcategoria:'Quinua',       precio:280,  precioOriginal:320, imagen:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', plataforma:'Amazon',       url:'https://www.amazon.com/-/es/s?k=semilla+quinua',                           envioGratis:true,  rating:4.7, vendidos:290,  stock:true, vendedor:'Quinua Premium Puno', descripcion:'Quinua blanca certificada variedad Illpa INIA. Excelente rendimiento en el altiplano.' },
  { id:5,  nombre:'Semilla Quinua Roja Organica 10kg',          categoria:'Semillas',      subcategoria:'Quinua',       precio:200,  precioOriginal:null,imagen:'https://images.unsplash.com/photo-1599909991854-c6c8f6d90f99?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/quinua/',                                  envioGratis:false, rating:4.9, vendidos:150,  stock:true, vendedor:'Andean Seeds',         descripcion:'Semilla organica de quinua roja con certificacion internacional.' },
  { id:6,  nombre:'Semilla Canihua Cupi Certificada 10kg',      categoria:'Semillas',      subcategoria:'Canihua',      precio:160,  precioOriginal:190, imagen:'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/granos-andinos/',                          envioGratis:true,  rating:4.8, vendidos:95,   stock:true, vendedor:'Altiplano Semillas',   descripcion:'Canihua variedad Cupi, resistente hasta 4500 msnm. Muy nutritiva y tolerante a heladas.' },
  { id:7,  nombre:'Fertilizante NPK 20-20-20 Saco 50kg',        categoria:'Fertilizantes', subcategoria:'NPK',          precio:120,  precioOriginal:150, imagen:'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400', plataforma:'AliExpress',   url:'https://es.aliexpress.com/w/wholesale-fertilizante-agricola.html',         envioGratis:false, rating:4.5, vendidos:680,  stock:true, vendedor:'AgroSupply',           descripcion:'Fertilizante completo NPK ideal para todo tipo de cultivos. Rinde hasta 2 hectareas.' },
  { id:8,  nombre:'Abono Organico Compost Premium 50kg',        categoria:'Fertilizantes', subcategoria:'Organicos',    precio:85,   precioOriginal:null,imagen:'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/fertilizantes/',                           envioGratis:true,  rating:4.8, vendidos:420,  stock:true, vendedor:'EcoFertil Peru',       descripcion:'Compost 100% organico certificado, ideal para agricultura ecologica.' },
  { id:9,  nombre:'Guano de Isla Premium Saco 25kg',            categoria:'Fertilizantes', subcategoria:'Organicos',    precio:95,   precioOriginal:110, imagen:'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=400', plataforma:'Amazon',       url:'https://www.amazon.com/-/es/s?k=guano+fertilizante',                       envioGratis:false, rating:4.9, vendidos:350,  stock:true, vendedor:'Fertilizantes Premium',descripcion:'Guano de isla 100% natural, rico en nitrogeno y fosforo. Certificado SERFOR.' },
  { id:10, nombre:'Fertilizante Foliar Completo 1 Litro',       categoria:'Fertilizantes', subcategoria:'Foliar',       precio:45,   precioOriginal:60,  imagen:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/fertilizante-foliar/',                     envioGratis:true,  rating:4.6, vendidos:540,  stock:true, vendedor:'AgroNutrition',        descripcion:'Fertilizante foliar con micronutrientes, ideal para crecimiento y floracion.' },
  { id:11, nombre:'Pala Agricola Profesional Fibra de Vidrio',  categoria:'Herramientas',  subcategoria:'Manuales',     precio:45,   precioOriginal:null,imagen:'https://images.unsplash.com/photo-1617343267742-20155f90efb5?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/herramientas-agricolas/',                  envioGratis:true,  rating:4.6, vendidos:890,  stock:true, vendedor:'Herramientas Pro',     descripcion:'Pala de acero forjado con mango ergonomico de fibra de vidrio. Ideal para altiplano.' },
  { id:12, nombre:'Kit Herramientas Agricolas 10 Piezas',       categoria:'Herramientas',  subcategoria:'Manuales',     precio:180,  precioOriginal:230, imagen:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', plataforma:'Amazon',       url:'https://www.amazon.com/-/es/s?k=herramientas+agricolas',                  envioGratis:true,  rating:4.7, vendidos:520,  stock:true, vendedor:'AgroTools',            descripcion:'Incluye pala, rastrillo, azada, tijeras de podar y mas. Acero inoxidable.' },
  { id:13, nombre:'Motoguadana 52cc Gasolina 2 Tiempos',        categoria:'Herramientas',  subcategoria:'Motorizadas',  precio:650,  precioOriginal:850, imagen:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/motoguadana/',                             envioGratis:false, rating:4.5, vendidos:210,  stock:true, vendedor:'Maquinaria Agricola',  descripcion:'Motoguadana profesional 52cc, incluye disco y cabezal de nylon.' },
  { id:14, nombre:'Sistema Riego por Goteo 1 Hectarea',         categoria:'Riego',         subcategoria:'Goteo',        precio:1200, precioOriginal:1500,imagen:'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400', plataforma:'Amazon',       url:'https://www.amazon.com/-/es/s?k=sistema+riego+goteo',                      envioGratis:true,  rating:4.8, vendidos:180,  stock:true, vendedor:'RiegoTech',            descripcion:'Sistema completo de riego por goteo con cintas, conectores y filtros para 1 ha.' },
  { id:15, nombre:'Aspersor de Impacto Largo Alcance 25m',      categoria:'Riego',         subcategoria:'Aspersion',    precio:75,   precioOriginal:null,imagen:'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400', plataforma:'AliExpress',   url:'https://es.aliexpress.com/w/wholesale-aspersor-riego.html',                envioGratis:false, rating:4.4, vendidos:450,  stock:true, vendedor:'Irrigation Pro',       descripcion:'Aspersor metalico profesional, alcance de 25 metros. Resistente a presion.' },
  { id:16, nombre:'Bomba de Agua Centrifuga 1.5HP',             categoria:'Riego',         subcategoria:'Bombas',       precio:380,  precioOriginal:450, imagen:'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/bombas-agua/',                             envioGratis:false, rating:4.6, vendidos:280,  stock:true, vendedor:'Bombas Industrial',    descripcion:'Bomba centrifuga para riego, caudal 30L/min, altura 40m.' },
  { id:17, nombre:'Sensor Humedad de Suelo Capacitivo',         categoria:'Sensores IoT',  subcategoria:'Humedad',      precio:25,   precioOriginal:null,imagen:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', plataforma:'AliExpress',   url:'https://es.aliexpress.com/w/wholesale-soil-moisture-sensor.html',          envioGratis:true,  rating:4.7, vendidos:1200, stock:true, vendedor:'Electronics Shop',     descripcion:'Sensor capacitivo resistente al agua, compatible con ESP32/Arduino. Precision 98%.' },
  { id:18, nombre:'ESP32 + DHT11 + FC-28 Kit Completo',         categoria:'Sensores IoT',  subcategoria:'Temperatura',  precio:55,   precioOriginal:70,  imagen:'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400', plataforma:'Amazon',       url:'https://www.amazon.com/-/es/s?k=esp32+sensor',                             envioGratis:true,  rating:4.9, vendidos:850,  stock:true, vendedor:'IoT Solutions',        descripcion:'Kit completo con ESP32, sensor DHT11 de temperatura/humedad y sensor de suelo FC-28.' },
  { id:19, nombre:'Medidor pH y Humedad de Suelo 3 en 1',       categoria:'Sensores IoT',  subcategoria:'pH',           precio:35,   precioOriginal:null,imagen:'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/medidor-ph-suelo/',                        envioGratis:true,  rating:4.3, vendidos:620,  stock:true, vendedor:'AgroTech Peru',        descripcion:'Medidor analogico de pH, humedad y luz. No requiere baterias. Facil lectura.' },
  { id:20, nombre:'Malla Anti-Helada Agricola 100m2',           categoria:'Proteccion',    subcategoria:'Heladas',      precio:180,  precioOriginal:null,imagen:'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/malla-antihelada/',                        envioGratis:false, rating:4.6, vendidos:340,  stock:true, vendedor:'Proteccion Agricola',  descripcion:'Malla termica contra heladas, transpirable y resistente a UV. Esencial en Puno.' },
  { id:21, nombre:'Plastico Invernadero UV Rollo 100m',         categoria:'Proteccion',    subcategoria:'Invernaderos', precio:420,  precioOriginal:500, imagen:'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400', plataforma:'Amazon',       url:'https://www.amazon.com/-/es/s?k=plastico+invernadero',                     envioGratis:false, rating:4.7, vendidos:190,  stock:true, vendedor:'InvernaderosPro',      descripcion:'Pelicula plastica anti-UV de 200 micrones, 6m de ancho. Duracion 5 anos.' },
  { id:22, nombre:'Insecticida Organico Neem 5 Litros',         categoria:'Proteccion',    subcategoria:'Plagas',       precio:95,   precioOriginal:null,imagen:'https://images.unsplash.com/photo-1581578017093-cd30ed3bbeef?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/insecticida-organico/',                    envioGratis:true,  rating:4.8, vendidos:480,  stock:true, vendedor:'EcoAgro Natural',      descripcion:'Insecticida organico a base de neem, seguro para cultivos alimentarios.' },
  { id:23, nombre:'Fungicida Mancozeb 80% 1kg',                 categoria:'Proteccion',    subcategoria:'Enfermedades', precio:28,   precioOriginal:35,  imagen:'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400', plataforma:'MercadoLibre', url:'https://www.mercadolibre.com.pe/fungicida-mancozeb/',                      envioGratis:true,  rating:4.7, vendidos:920,  stock:true, vendedor:'Agroquimica Andina',   descripcion:'Mancozeb 80% PM contra rancha de papa y enfermedades foliares. 200g por 100L agua.' },
];

const CATEGORIAS = ['Todos', ...new Set(PRODUCTOS.map(p => p.categoria))];
const PLATAFORMAS = ['Todas', ...new Set(PRODUCTOS.map(p => p.plataforma))];

const INP = 'h-10 px-3.5 text-sm rounded-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';

const Marketplace = () => {
  const [search, setSearch]           = useState('');
  const [cat, setCat]                 = useState('Todos');
  const [plat, setPlat]               = useState('Todas');
  const [orden, setOrden]             = useState('relevancia');
  const [showFiltros, setShowFiltros] = useState(false);
  const [precioMin, setPrecioMin]     = useState('');
  const [precioMax, setPrecioMax]     = useState('');
  const [soloGratis, setSoloGratis]   = useState(false);

  const filtrados = useMemo(() => {
    const q = search.toLowerCase();
    let r = PRODUCTOS.filter(p => {
      if (q && !`${p.nombre} ${p.descripcion} ${p.categoria} ${p.subcategoria} ${p.vendedor}`.toLowerCase().includes(q)) return false;
      if (cat  !== 'Todos' && p.categoria !== cat)   return false;
      if (plat !== 'Todas' && p.plataforma !== plat) return false;
      if (precioMin && p.precio < parseFloat(precioMin)) return false;
      if (precioMax && p.precio > parseFloat(precioMax)) return false;
      if (soloGratis && !p.envioGratis) return false;
      return true;
    });
    if (orden === 'precio_asc')      r.sort((a,b) => a.precio - b.precio);
    if (orden === 'precio_desc')     r.sort((a,b) => b.precio - a.precio);
    if (orden === 'mas_vendidos')    r.sort((a,b) => b.vendidos - a.vendidos);
    if (orden === 'mejor_valorados') r.sort((a,b) => b.rating - a.rating);
    return r;
  }, [search, cat, plat, orden, precioMin, precioMax, soloGratis]);

  const limpiar = () => {
    setSearch(''); setCat('Todos'); setPlat('Todas');
    setPrecioMin(''); setPrecioMax(''); setSoloGratis(false); setOrden('relevancia');
  };

  const hayFiltros = !!(search || cat !== 'Todos' || plat !== 'Todas' || precioMin || precioMax || soloGratis);

  const stats = useMemo(() => ({
    total:  PRODUCTOS.length,
    gratis: PRODUCTOS.filter(p => p.envioGratis).length,
    rating: (PRODUCTOS.reduce((s,p) => s + p.rating, 0) / PRODUCTOS.length).toFixed(1),
  }), []);

  return (
    <div className="px-4 py-4 sm:p-6 space-y-5 bg-gray-50 dark:bg-gray-950 min-h-full">

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Marketplace Agricola</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            Productos para tu campo · MercadoLibre · Amazon · AliExpress
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200/60 dark:ring-emerald-400/20 px-3.5 py-2 rounded-full">
          {Ic.shield}
          <span className="font-semibold">Compra protegida</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Ic.pkg,   val: stats.total,        lbl:'Productos',      color:'bg-emerald-500' },
          { icon: Ic.truck, val: stats.gratis,        lbl:'Envio gratis',   color:'bg-sky-500'     },
          { icon: Ic.star,  val: `${stats.rating}*`, lbl:'Rating promedio',color:'bg-amber-500'   },
        ].map(({ icon, val, lbl, color }) => (
          <div key={lbl} className="rounded-[1.5rem] p-1 ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-b from-gray-100/70 to-gray-50/30 dark:from-white/[0.06] dark:to-white/[0.02]">
            <div className="rounded-[calc(1.5rem-0.25rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 p-3.5 flex items-center gap-3">
              <div className={`${color} w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0`}>{icon}</div>
              <div>
                <p className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">{val}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{lbl}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-b from-gray-100/70 to-gray-50/30 dark:from-white/[0.06] dark:to-white/[0.02]">
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{Ic.search}</span>
              <input
                type="text"
                placeholder="Semillas, fertilizantes, herramientas, sensores..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={INP + ' w-full pl-10'}
              />
            </div>
            <button
              onClick={() => setShowFiltros(f => !f)}
              className={`flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation ${
                showFiltros || hayFiltros
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/[0.06]'
              }`}>
              {Ic.filter}
              Filtros
              {hayFiltros && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>
            {hayFiltros && (
              <button onClick={limpiar}
                className="flex items-center gap-1 h-10 px-4 rounded-full ring-1 ring-rose-200/70 dark:ring-rose-400/20 text-rose-500 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
                {Ic.x} Limpiar
              </button>
            )}
          </div>

          {showFiltros && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-black/5 dark:border-white/10">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-[0.14em] mb-1.5">Plataforma</label>
                <select value={plat} onChange={e => setPlat(e.target.value)} className={INP + ' w-full'}>
                  {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-[0.14em] mb-1.5">Precio min (S/)</label>
                <input type="number" value={precioMin} onChange={e => setPrecioMin(e.target.value)} placeholder="0" className={INP + ' w-full'} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-[0.14em] mb-1.5">Precio max (S/)</label>
                <input type="number" value={precioMax} onChange={e => setPrecioMax(e.target.value)} placeholder="9999" className={INP + ' w-full'} />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer h-10 bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-xl px-3.5 hover:bg-white dark:hover:bg-white/[0.06] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation">
                  <input type="checkbox" checked={soloGratis} onChange={e => setSoloGratis(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Solo envio gratis</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIAS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation whitespace-nowrap ${
                cat === c
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-300 hover:ring-emerald-300/70 dark:hover:ring-emerald-400/30'
              }`}>
              {c}
              {c !== 'Todos' && (
                <span className="ml-1 opacity-60 text-[10px]">
                  ({PRODUCTOS.filter(p => p.categoria === c).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 sm:ml-auto shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{filtrados.length} productos</span>
          <select value={orden} onChange={e => setOrden(e.target.value)} className={INP + ' text-xs'}>
            <option value="relevancia">Relevancia</option>
            <option value="precio_asc">Precio: menor</option>
            <option value="precio_desc">Precio: mayor</option>
            <option value="mas_vendidos">Mas vendidos</option>
            <option value="mejor_valorados">Mejor valorados</option>
          </select>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-[1.75rem] p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-b from-gray-100/70 to-gray-50/30 dark:from-white/[0.06] dark:to-white/[0.02]">
          <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 py-14 px-4 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-gray-50 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl flex items-center justify-center text-gray-400">{Ic.pkg}</div>
            <p className="font-display text-base font-semibold tracking-tight text-gray-700 dark:text-gray-200">Sin resultados para "{search}"</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Intenta con otros terminos o limpia los filtros</p>
            <button onClick={limpiar}
              className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map(p => <ProductCard key={p.id} producto={p} />)}
        </div>
      )}

      <div className="rounded-[1.75rem] p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-b from-gray-100/70 to-gray-50/30 dark:from-white/[0.06] dark:to-white/[0.02]">
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">{Ic.shield}</div>
            <div>
              <p className="font-display text-base font-semibold tracking-tight text-gray-900 dark:text-white">Compra 100% segura</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Redirige a plataformas verificadas</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Compra protegida','Envios a todo Peru','Vendedores verificados','Devolucion garantizada'].map(b => (
              <span key={b} className="text-[10px] font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200/60 dark:ring-emerald-400/20 text-emerald-700 dark:text-emerald-300 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Marketplace;
