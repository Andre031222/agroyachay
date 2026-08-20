import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '../../context/LanguageContext';

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
  { num:1, dias:31, tempMin:4, tempMax:16, lluvia:125, luna:[{d:6,fase:'Luna Nueva'},{d:13,fase:'Cuarto Creciente'},{d:21,fase:'Luna Llena'},{d:28,fase:'Cuarto Menguante'}], festDias:[1,6] },
  { num:2, dias:28, tempMin:5, tempMax:15, lluvia:140, luna:[{d:5,fase:'Luna Nueva'},{d:12,fase:'Cuarto Creciente'},{d:19,fase:'Luna Llena'},{d:27,fase:'Cuarto Menguante'}], festDias:[2,14] },
  { num:3, dias:31, tempMin:4, tempMax:17, lluvia:80, luna:[{d:7,fase:'Luna Nueva'},{d:14,fase:'Cuarto Creciente'},{d:21,fase:'Luna Llena'},{d:28,fase:'Cuarto Menguante'}], festDias:[8,19] },
  { num:4, dias:30, tempMin:2, tempMax:16, lluvia:35, luna:[{d:5,fase:'Luna Nueva'},{d:13,fase:'Cuarto Creciente'},{d:20,fase:'Luna Llena'},{d:27,fase:'Cuarto Menguante'}], festDias:[1] },
  { num:5, dias:31, tempMin:-2, tempMax:14, lluvia:12, luna:[{d:5,fase:'Luna Nueva'},{d:12,fase:'Cuarto Creciente'},{d:19,fase:'Luna Llena'},{d:27,fase:'Cuarto Menguante'}], festDias:[1,11] },
  { num:6, dias:30, tempMin:-5, tempMax:13, lluvia:5, luna:[{d:3,fase:'Luna Nueva'},{d:11,fase:'Cuarto Creciente'},{d:18,fase:'Luna Llena'},{d:25,fase:'Cuarto Menguante'}], festDias:[20,24,29] },
  { num:7, dias:31, tempMin:-6, tempMax:14, lluvia:4, luna:[{d:2,fase:'Luna Nueva'},{d:10,fase:'Cuarto Creciente'},{d:17,fase:'Luna Llena'},{d:25,fase:'Cuarto Menguante'}], festDias:[28] },
  { num:8, dias:31, tempMin:-4, tempMax:16, lluvia:8, luna:[{d:1,fase:'Luna Nueva'},{d:9,fase:'Cuarto Creciente'},{d:16,fase:'Luna Llena'},{d:23,fase:'Cuarto Menguante'},{d:30,fase:'Luna Nueva'}], festDias:[15] },
  { num:9, dias:30, tempMin:2, tempMax:18, lluvia:28, luna:[{d:7,fase:'Cuarto Creciente'},{d:14,fase:'Luna Llena'},{d:22,fase:'Cuarto Menguante'},{d:29,fase:'Luna Nueva'}], festDias:[8] },
  { num:10, dias:31, tempMin:4, tempMax:19, lluvia:55, luna:[{d:7,fase:'Cuarto Creciente'},{d:14,fase:'Luna Llena'},{d:21,fase:'Cuarto Menguante'},{d:28,fase:'Luna Nueva'}], festDias:[8,31] },
  { num:11, dias:30, tempMin:5, tempMax:18, lluvia:88, luna:[{d:5,fase:'Cuarto Creciente'},{d:12,fase:'Luna Llena'},{d:20,fase:'Cuarto Menguante'},{d:27,fase:'Luna Nueva'}], festDias:[1,2] },
  { num:12, dias:31, tempMin:6, tempMax:17, lluvia:115, luna:[{d:4,fase:'Cuarto Creciente'},{d:12,fase:'Luna Llena'},{d:19,fase:'Cuarto Menguante'},{d:27,fase:'Luna Nueva'}], festDias:[8,25] },
];

const CULTIVOS_ANDINOS = [
  { key:'Papa', emoji:'🥔', siembraMeses:[8,9,10], cosechaMeses:[2,3,4] },
  { key:'Quinua', emoji:'🌾', siembraMeses:[8,9,10], cosechaMeses:[2,3,4] },
  { key:'Maíz', emoji:'🌽', siembraMeses:[9,10], cosechaMeses:[2,3] },
  { key:'Cañihua', emoji:'🌿', siembraMeses:[8,9], cosechaMeses:[3,4,5] },
  { key:'Habas', emoji:'🫘', siembraMeses:[9,10], cosechaMeses:[3,4,11] },
  { key:'Oca', emoji:'🟠', siembraMeses:[2,3], cosechaMeses:[4,5] },
  { key:'Olluco', emoji:'🟡', siembraMeses:[2,3], cosechaMeses:[4,5] },
  { key:'Tarwi', emoji:'🌱', siembraMeses:[9,10], cosechaMeses:[4,5] },
  { key:'Trigo', emoji:'🌾', siembraMeses:[4,5,9], cosechaMeses:[6,7] },
  { key:'Cebada', emoji:'🌾', siembraMeses:[1,2,9,10], cosechaMeses:[5,6,7] },
];

const getLuna = (mes) => mes.luna.map(l => ({ d: l.d, fase: l.fase }));

const LUNA_INFO = {
  'Luna Nueva':       { color: 'bg-black/[0.03] dark:bg-white/[0.04]' },
  'Cuarto Creciente': { color: 'bg-amber-50/70 dark:bg-amber-900/20' },
  'Luna Llena':       { color: 'bg-yellow-50/70 dark:bg-yellow-900/20' },
  'Cuarto Menguante': { color: 'bg-indigo-50/70 dark:bg-indigo-900/20' },
};

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
  const { t, tList } = useLanguage();
  const [mesIdx, setMesIdx]     = useState(new Date().getMonth());
  const [vista, setVista]       = useState('mensual');
  const [busqueda, setBusqueda] = useState('');
  const [cultivoSel, setCultivoSel] = useState(null);
  const monthTexts = tList('almanac.months');
  const shortMonths = tList('almanac.shortMonths');
  const mes = { ...MESES[mesIdx], ...monthTexts[mesIdx] };
  const monthOf = (index) => ({ ...MESES[index], ...monthTexts[index] });
  const cropOf = (crop) => ({
    ...crop,
    name: t(`almanac.crops.${crop.key}.name`),
    family: t(`almanac.crops.${crop.key}.family`),
    altitude: t(`almanac.crops.${crop.key}.altitude`),
    duration: t(`almanac.crops.${crop.key}.duration`),
    irrigation: t(`almanac.crops.${crop.key}.irrigation`),
    spacing: t(`almanac.crops.${crop.key}.spacing`),
    depth: t(`almanac.crops.${crop.key}.depth`),
    desc: t(`almanac.crops.${crop.key}.desc`),
    varieties: tList(`almanac.crops.${crop.key}.varieties`),
  });

  const handleExport = () => {
    const txt = [
      `${t('almanac.exportTitle')} — ${mes.name}`,
      '',
      `${t('almanac.exportSowing')}: ${mes.sowing.join(', ')}`,
      `${t('almanac.exportHarvest')}: ${mes.harvest.join(', ')}`,
      `${t('almanac.exportWeather')}: ${mes.weather}`,
      `${t('almanac.exportAdvice')}: ${mes.advice}`,
      '',
      `${t('almanac.exportWeekly')}:`,
      ...mes.weeks.map((act, i) => `  ${t('almanac.week')} ${i + 1}: ${act}`),
      '',
      `${t('almanac.exportMoon')}:`,
      ...getLuna(mes).map(f => `  ${t('almanac.exportDay')} ${f.d} — ${t(`almanac.moonPhases.${f.fase}`)}`),
    ].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([txt], { type: 'text/plain' })),
      download: `${t('almanac.title').replace(/ /g, '_')}_${mes.name}_2026.txt`,
    });
    a.click();
  };

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return monthTexts.flatMap(m => {
      const sowing = (m.sowing || []).filter(c => c.toLowerCase().includes(q));
      const harvest = (m.harvest || []).filter(c => c.toLowerCase().includes(q));
      return [
        ...(sowing.length ? [{ mes: m.name, tipo: t('almanac.sowing'), items: sowing }] : []),
        ...(harvest.length ? [{ mes: m.name, tipo: t('almanac.harvest'), items: harvest }] : []),
      ];
    });
  }, [busqueda, monthTexts, t]);

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
      festiv:  (() => { const i = mes.festDias.indexOf(d); return i === -1 ? null : { d, n: mes.holidays[i] }; })(),
      isToday: today.getFullYear() === 2026 && today.getMonth() === mesIdx && today.getDate() === d,
    };
  };

  const chartData = MESES.map((m, i) => ({
    mes: shortMonths[i],
    siembra: (monthTexts[i]?.sowing || []).length,
    cosecha: (monthTexts[i]?.harvest || []).length,
    lluvia:  m.lluvia,
  }));

  const VIEWS = [
    { id:'mensual',   label:t('almanac.viewMonthly'), icon: Ic.cal },
    { id:'anual',     label:t('almanac.viewGantt'), icon: Ic.gantt },
    { id:'cultivos',  label:t('almanac.viewCrops'), icon: Ic.leaf },
    { id:'stats',     label:t('almanac.viewStats'), icon: Ic.bar },
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
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-[1.05] tracking-tight">{t('almanac.title')}</h1>
              <p className="mt-1.5 text-sm text-emerald-100/60">{t('almanac.subtitle')}</p>
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
                {Ic.print}<span className="hidden sm:inline">{t('almanac.print')}</span>
              </button>
              <button onClick={handleExport} className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold text-emerald-100/80 bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.1] hover:text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation">
                {Ic.dl}<span className="hidden sm:inline">{t('almanac.export')}</span>
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
              placeholder={t('almanac.searchPlaceholder')}
              className="w-full pl-9 pr-4 h-10 text-xs rounded-xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            />
          </div>
          {resultados.length > 0 && (
            <div className="mt-3 bg-emerald-50/70 dark:bg-emerald-900/20 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 rounded-2xl p-3">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">{resultados.length} resultado{resultados.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {resultados.map((r, i) => (
                  <button key={i} onClick={() => { const idx = monthTexts.findIndex(m => m.name === r.mes); setMesIdx(idx); setVista('mensual'); setBusqueda(''); }}
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
                <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">{mes.name} 2026</h2>
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
                {tList('almanac.weekdays').map(d => (
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
                  { cls:'bg-emerald-500 ring-1 ring-emerald-300/40', label:t('almanac.today') },
                  { cls:'bg-amber-50 ring-1 ring-amber-500/30', label:t('almanac.moonPhase') },
                  { cls:'bg-red-50 ring-1 ring-red-500/30', label:t('almanac.holiday') },
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
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('almanac.moonPhasesOf', { month: mes.name })}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {getLuna(mes).map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${LUNA_INFO[f.fase]?.color || ''}`}>
                    <MoonSVG fase={f.fase} size="w-6 h-6" />
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">{t(`almanac.moonPhases.${f.fase}`)}</p>
                      <p className="text-[10px] text-gray-400">{t(`almanac.exportDay`)} {f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <SectionTitle icon={<span className="text-emerald-500">{Ic.leaf}</span>} title={t('almanac.sowing')} sub={mes.sowing.length ? t('almanac.sowingCount', { count: mes.sowing.length }) : t('almanac.noSowing')} />
              <div className="px-5 pb-5">
                {mes.sowing.length ? (
                  <div className="space-y-1.5">
                    {mes.sowing.map((c, i) => (
                      <button key={i} onClick={() => { const cult = CULTIVOS_ANDINOS.map(cropOf).find(x => x.name.toLowerCase() === c.toLowerCase() || c.toLowerCase().includes(x.name.toLowerCase())); if (cult) { setCultivoSel(cult); setVista('cultivos'); } }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-emerald-50/70 dark:bg-emerald-900/20 rounded-xl ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 hover:ring-emerald-500/40 dark:hover:ring-emerald-400/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] text-left touch-manipulation group">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">{c}</span>
                        <span className="text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">{Ic.right}</span>
                      </button>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-400 italic">{t('almanac.noSowingScheduled')}</p>}
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<span className="text-amber-500">{Ic.sun}</span>} title={t('almanac.harvest')} sub={mes.harvest.length ? t('almanac.harvestCount', { count: mes.harvest.length }) : t('almanac.noHarvest')} />
              <div className="px-5 pb-5">
                {mes.harvest.length ? (
                  <div className="space-y-1.5">
                    {mes.harvest.map((c, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-amber-50/70 dark:bg-amber-900/20 rounded-xl ring-1 ring-amber-500/15 dark:ring-amber-400/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{c}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-400 italic">{t('almanac.noHarvestScheduled')}</p>}
              </div>
            </Card>
          </div>

          <Card>
            <SectionTitle icon={<span className="text-sky-500">{Ic.cloud}</span>} title={t('almanac.weatherAndAdvice')} sub={mes.weather} />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { icon: Ic.therm, label: t('almanac.tempMin'), v: `${mes.tempMin}°C`, cls: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                  { icon: Ic.therm, label: t('almanac.tempMax'), v: `${mes.tempMax}°C`, cls: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
                  { icon: Ic.drop,  label: t('almanac.rain'), v: `${mes.lluvia} mm`, cls: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
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
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{mes.advice}</p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={<span className="text-violet-500">{Ic.cal}</span>} title={t('almanac.weeklyActivities')} sub={t('almanac.weeklyActivitiesSub')} />
            <div className="px-5 pb-5 space-y-2">
              {mes.weeks.map((act, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
                  <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-900/30 ring-1 ring-violet-500/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-violet-700 dark:text-violet-400">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">{t('almanac.week')} {i + 1}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-tight mt-0.5">{act}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {mes.festDias.length > 0 && (
            <Card>
              <SectionTitle icon={<span className="text-red-400">{Ic.star}</span>} title={t('almanac.holidays')} sub={t('almanac.holidaysCount', { count: mes.holidays.length })} />
              <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mes.festDias.map((dia, i) => (
                  <div key={dia} className="flex items-center gap-3 bg-red-50/70 dark:bg-red-900/20 ring-1 ring-red-500/15 dark:ring-red-400/15 rounded-2xl px-3 py-2.5">
                    <span className="text-lg font-black text-red-500 shrink-0 w-6 text-center">{dia}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{mes.holidays[i]}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle icon={<span className="text-indigo-400">{Ic.moon}</span>} title={t('almanac.lunarGuide')} sub={t('almanac.lunarGuideSub')} />
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.keys(LUNA_INFO).map((fase, i) => (
                <div key={i} className={`flex items-start gap-3 px-3 py-3 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 ${LUNA_INFO[fase].color}`}>
                  <MoonSVG fase={fase} size="w-6 h-6" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-0.5">{t(`almanac.moonPhases.${fase}`)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t(`almanac.lunarTips.${fase}`)}</p>
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
            <SectionTitle title={t('almanac.ganttTitle')} sub={t('almanac.ganttSub')} />
            <div className="px-5 pb-5 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid items-center mb-2" style={{ gridTemplateColumns: '120px repeat(12, 1fr)' }}>
                  <div />
                  {shortMonths.map(m => (
                    <div key={m} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">{m}</div>
                  ))}
                </div>
                {[...new Set(monthTexts.flatMap(m => [...(m.sowing || []), ...(m.harvest || [])]))].sort().map((cultivo) => (
                  <div key={cultivo} className="grid items-center mb-1" style={{ gridTemplateColumns: '120px repeat(12, 1fr)' }}>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">{cultivo}</span>
                    {monthTexts.map((m, mi) => {
                      const esSiembra = (m.sowing || []).some(x => x.toLowerCase().includes(cultivo.toLowerCase()) || cultivo.toLowerCase().includes(x.toLowerCase()));
                      const esCosecha = (m.harvest || []).some(x => x.toLowerCase().includes(cultivo.toLowerCase()) || cultivo.toLowerCase().includes(x.toLowerCase()));
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
                    { cls:'bg-emerald-400', label:t('almanac.legendSowing') },
                    { cls:'bg-amber-400', label:t('almanac.legendHarvest') },
                    { cls:'bg-violet-400', label:t('almanac.legendBoth') },
                    { cls:'bg-black/[0.04] ring-1 ring-black/10', label:t('almanac.legendNone') },
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
            {MESES.map((base, i) => {
              const m = monthOf(i);
              const isActual = i === new Date().getMonth();
              return (
                <button key={i} onClick={() => { setMesIdx(i); setVista('mensual'); }}
                  className={`text-left bg-white dark:bg-gray-900 rounded-2xl p-4 hover:-translate-y-0.5 hover:ring-emerald-500/40 dark:hover:ring-emerald-400/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group touch-manipulation ${
                    isActual ? 'ring-2 ring-emerald-500/50 dark:ring-emerald-400/50' : 'ring-1 ring-black/5 dark:ring-white/10'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-black ${isActual ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>{m.name}</h3>
                    <div className="flex gap-0.5">{getLuna(m).slice(0, 4).map((f, j) => <MoonSVG key={j} fase={f.fase} size="w-3.5 h-3.5" />)}</div>
                  </div>
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-500 shrink-0">{Ic.leaf}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{m.sowing.length ? m.sowing.slice(0, 2).join(', ') + (m.sowing.length > 2 ? '…' : '') : <span className="text-gray-300 italic">—</span>}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 shrink-0">{Ic.sun}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{m.harvest.length ? m.harvest.slice(0, 2).join(', ') + (m.harvest.length > 2 ? '…' : '') : <span className="text-gray-300 italic">—</span>}</p>
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
                  {t('almanac.backToCrops')}
                </button>
                <div className="flex items-center gap-4 mb-5">
                  <span className="flex items-center justify-center w-16 h-16 text-4xl rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15">{cultivoSel.emoji}</span>
                  <div>
                    <h2 className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white">{cultivoSel.name}</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{cultivoSel.family}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5 bg-black/[0.02] dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl px-4 py-3">{cultivoSel.desc}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { label:t('almanac.altitude'), v: cultivoSel.altitude, cls:'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400' },
                    { label:t('almanac.duration'), v: cultivoSel.duration, cls:'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400' },
                    { label:t('almanac.irrigation'), v: cultivoSel.irrigation, cls:'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
                    { label:t('almanac.spacing'), v: cultivoSel.spacing, cls:'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
                    { label:t('almanac.depth'), v: cultivoSel.depth, cls:'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
                  ].map((d, i) => (
                    <div key={i} className={`rounded-2xl px-3 py-3 ring-1 ring-black/5 dark:ring-white/10 ${d.cls}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-0.5">{d.label}</p>
                      <p className="text-sm font-black">{d.v}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">{t('almanac.sowingMonths')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cultivoSel.siembraMeses.map(m => (
                        <button key={m} onClick={() => { setMesIdx(m); setVista('mensual'); }}
                          className="px-2.5 py-1 bg-emerald-50/70 dark:bg-emerald-900/20 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold hover:bg-emerald-100/80 hover:ring-emerald-500/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation">
                          {monthTexts[m]?.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">{t('almanac.harvestMonths')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cultivoSel.cosechaMeses.map(m => (
                        <button key={m} onClick={() => { setMesIdx(m); setVista('mensual'); }}
                          className="px-2.5 py-1 bg-amber-50/70 dark:bg-amber-900/20 ring-1 ring-amber-500/15 dark:ring-amber-400/15 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold hover:bg-amber-100/80 hover:ring-amber-500/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation">
                          {monthTexts[m]?.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('almanac.mainVarieties')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cultivoSel.varieties.map((v, i) => (
                      <span key={i} className="px-2.5 py-1 bg-black/[0.03] dark:bg-white/[0.05] ring-1 ring-black/5 dark:ring-white/10 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CULTIVOS_ANDINOS.map(cropOf).map((c, i) => (
                <button key={i} onClick={() => setCultivoSel(c)}
                  className="text-left bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-5 hover:-translate-y-0.5 hover:ring-emerald-500/40 dark:hover:ring-emerald-400/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group touch-manipulation">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-12 h-12 text-2xl rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15">{c.emoji}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{c.altitude}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">{c.desc}</p>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('almanac.sowingMonthsCount', { count: c.siembraMeses.length })}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{t('almanac.harvestMonthsCount', { count: c.cosechaMeses.length })}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{c.duration}</span>
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
              { label:t('almanac.statSowingCrops'), v: [...new Set(monthTexts.flatMap(m => m.sowing || []))].length, sub:t('almanac.uniqueVarieties'), color:'bg-emerald-500', icon:Ic.leaf },
              { label:t('almanac.statHarvestCrops'), v: [...new Set(monthTexts.flatMap(m => m.harvest || []))].length, sub:t('almanac.uniqueVarieties'), color:'bg-amber-500', icon:Ic.sun },
              { label:t('almanac.statMonthsWithSowing'), v: monthTexts.filter(m => (m.sowing || []).length).length, sub:t('almanac.of12Months'), color:'bg-green-500', icon:Ic.cal },
              { label:t('almanac.statMoonPhases'), v: MESES.reduce((a, m) => a + getLuna(m).length, 0), sub:t('almanac.recordedIn2026'), color:'bg-indigo-500', icon:Ic.moon },
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
            <SectionTitle title={t('almanac.monthlyActivity')} sub={t('almanac.monthlyActivitySub')} />
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 8 }} />
                  <Bar dataKey="siembra" fill="#10b981" radius={[4,4,0,0]} name={t('almanac.sowing')} />
                  <Bar dataKey="cosecha" fill="#f59e0b" radius={[4,4,0,0]} name={t('almanac.harvest')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle title={t('almanac.rainfall')} sub={t('almanac.rainfallSub')} />
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="lluvia" fill="#3b82f6" radius={[4,4,0,0]} name={t('almanac.rainLegend')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <SectionTitle icon={<span className="text-emerald-500">{Ic.leaf}</span>} title={t('almanac.allSowingCrops')} sub={t('almanac.almanacVarieties')} />
              <div className="px-5 pb-5 flex flex-wrap gap-1.5">
                {[...new Set(monthTexts.flatMap(m => m.sowing || []))].sort().map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50/70 dark:bg-emerald-900/20 ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">{c}</span>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle icon={<span className="text-amber-500">{Ic.sun}</span>} title={t('almanac.allHarvestCrops')} sub={t('almanac.almanacVarieties')} />
              <div className="px-5 pb-5 flex flex-wrap gap-1.5">
                {[...new Set(monthTexts.flatMap(m => m.harvest || []))].sort().map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-50/70 dark:bg-amber-900/20 ring-1 ring-amber-500/15 dark:ring-amber-400/15 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">{c}</span>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <SectionTitle title={t('almanac.fullTable')} sub={t('almanac.fullTableSub')} />
            <div className="px-5 pb-5 overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    {tList('almanac.tableHeaders').map(h => (
                      <th key={h} className="text-left pb-2 pr-3 font-black text-gray-400 dark:text-gray-600 uppercase tracking-wide text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {MESES.map((base, i) => {
                    const m = monthOf(i);
                    return (
                    <tr key={i} className="hover:bg-emerald-500/[0.04] transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer" onClick={() => { setMesIdx(i); setVista('mensual'); }}>
                      <td className="py-2.5 pr-3 font-black text-gray-800 dark:text-gray-200">{m.name}</td>
                      <td className="py-2.5 pr-3 text-gray-500 whitespace-nowrap">{m.tempMin}°–{m.tempMax}°</td>
                      <td className="py-2.5 pr-3 text-sky-500 font-semibold">{m.lluvia} mm</td>
                      <td className="py-2.5 pr-3 text-emerald-600 dark:text-emerald-400">{m.sowing.join(', ') || <span className="text-gray-300 italic">—</span>}</td>
                      <td className="py-2.5 pr-3 text-amber-600 dark:text-amber-400">{m.harvest.join(', ') || <span className="text-gray-300 italic">—</span>}</td>
                      <td className="py-2.5"><div className="flex gap-0.5">{getLuna(m).slice(0,4).map((f,j) => <MoonSVG key={j} fase={f.fase} size="w-3.5 h-3.5" />)}</div></td>
                    </tr>
                    );
                  })}
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
