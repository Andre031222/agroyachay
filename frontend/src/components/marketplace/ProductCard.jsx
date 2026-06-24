import React from 'react';

const PLAT_BADGE = {
  MercadoLibre: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  Amazon:       'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
  AliExpress:   'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
};

const IcCart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IcLink = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const IcTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const ProductCard = ({ producto }) => {
  const descPct = producto.precioOriginal
    ? Math.round(((producto.precioOriginal - producto.precio) / producto.precioOriginal) * 100)
    : 0;

  return (
    <div className="group rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-b from-gray-100/80 to-gray-50/40 dark:from-white/[0.06] dark:to-white/[0.02] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:scale-[1.01]">
      <div className="rounded-[calc(1rem-0.375rem)] overflow-hidden bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 flex flex-col h-full">
        <div className="relative h-44 bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden rounded-[calc(1rem-0.375rem)] rounded-b-none">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
            onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="176" viewBox="0 0 400 176"><rect width="400" height="176" fill="%23f3f4f6"/><text x="200" y="96" text-anchor="middle" font-size="14" fill="%239ca3af">Sin imagen</text></svg>'; }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
          <div className="absolute top-2.5 left-2.5">
            <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full ring-1 ring-black/5 dark:ring-white/10 ${PLAT_BADGE[producto.plataforma] || 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}>
              {producto.plataforma}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
            {descPct > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-white/20">
                -{descPct}%
              </span>
            )}
            {producto.envioGratis && (
              <span className="bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ring-1 ring-white/20">
                <IcTruck /> Gratis
              </span>
            )}
          </div>
          {!producto.stock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-white/10 ring-1 ring-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">Agotado</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <span className="self-start inline-flex items-center text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200/60 dark:ring-emerald-400/20 px-2.5 py-1 rounded-full mb-2.5">{producto.categoria} · {producto.subcategoria}</span>
          <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white mb-1.5 line-clamp-2 leading-snug flex-shrink-0">{producto.nombre}</h3>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 flex-1">{producto.descripcion}</p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" className="w-3.5 h-3.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{producto.rating}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">({producto.vendidos.toLocaleString()})</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-3.5">
            {producto.precioOriginal && (
              <span className="text-xs text-gray-400 line-through">S/ {producto.precioOriginal}</span>
            )}
            <span className="font-display text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">S/ {producto.precio}</span>
          </div>

          <button
            onClick={() => window.open(producto.url, '_blank', 'noopener,noreferrer')}
            disabled={!producto.stock}
            className={`group/btn w-full h-10 rounded-full font-semibold text-xs transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] ${
              producto.stock
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {producto.stock ? (
              <>
                <IcCart /> Ver en {producto.plataforma}
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-0.5">
                  <IcLink />
                </span>
              </>
            ) : 'No disponible'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
