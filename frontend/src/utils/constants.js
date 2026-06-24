export const CULTIVOS_PUNO = {
  'Papa': {
    nombre: 'Papa',
    descripcion: 'Principal cultivo de la región',
    variedades: [
      { nombre: 'Canchan', rendimiento: '25-30 t/ha', ciclo: '150-180 días' },
      { nombre: 'Perricholi', rendimiento: '28-32 t/ha', ciclo: '140-170 días' },
      { nombre: 'Yungay', rendimiento: '30-35 t/ha', ciclo: '150-180 días' },
      { nombre: 'Única', rendimiento: '22-28 t/ha', ciclo: '140-160 días' },
      { nombre: 'Amarilla', rendimiento: '20-25 t/ha', ciclo: '150-170 días' },
      { nombre: 'Huayro', rendimiento: '18-22 t/ha', ciclo: '160-180 días' },
      { nombre: 'Peruanita', rendimiento: '25-30 t/ha', ciclo: '150-175 días' }
    ],
    icon: '🥔',
    altitud: '3800-4200 msnm'
  },
  'Quinua': {
    nombre: 'Quinua',
    descripcion: 'Superalimento andino de alto valor',
    variedades: [
      { nombre: 'Blanca de Juli', rendimiento: '1.5-2.5 t/ha', ciclo: '150-180 días' },
      { nombre: 'Pasankalla', rendimiento: '1.2-1.8 t/ha', ciclo: '160-190 días' },
      { nombre: 'Kancolla', rendimiento: '1.8-2.5 t/ha', ciclo: '150-170 días' },
      { nombre: 'Salcedo INIA', rendimiento: '2.0-3.0 t/ha', ciclo: '160-180 días' },
      { nombre: 'Illpa INIA', rendimiento: '2.5-3.5 t/ha', ciclo: '150-170 días' }
    ],
    icon: '🌾',
    altitud: '3800-4000 msnm'
  },
  'Cañihua': {
    nombre: 'Cañihua',
    descripcion: 'Grano andino resistente a heladas',
    variedades: [
      { nombre: 'Cupi', rendimiento: '0.8-1.2 t/ha', ciclo: '140-160 días' },
      { nombre: 'Illpa INIA', rendimiento: '1.0-1.5 t/ha', ciclo: '150-170 días' },
      { nombre: 'Ramis', rendimiento: '0.9-1.3 t/ha', ciclo: '145-165 días' }
    ],
    icon: '🌱',
    altitud: '3800-4500 msnm'
  },
  'Habas': {
    nombre: 'Habas',
    descripcion: 'Leguminosa de grano',
    variedades: [
      { nombre: 'Blanca grande', rendimiento: '2.5-3.5 t/ha', ciclo: '180-210 días' },
      { nombre: 'Verde criolla', rendimiento: '2.0-3.0 t/ha', ciclo: '170-200 días' },
      { nombre: 'Morada', rendimiento: '2.2-3.2 t/ha', ciclo: '175-205 días' }
    ],
    icon: '🫘',
    altitud: '3200-3800 msnm'
  },
  'Cebada': {
    nombre: 'Cebada',
    descripcion: 'Cereal para grano y forraje',
    variedades: [
      { nombre: 'Centenario', rendimiento: '2.0-3.0 t/ha', ciclo: '150-180 días' },
      { nombre: 'INIA 420', rendimiento: '2.5-3.5 t/ha', ciclo: '140-170 días' },
      { nombre: 'Zapata', rendimiento: '2.2-3.2 t/ha', ciclo: '145-175 días' }
    ],
    icon: '🌾',
    altitud: '3500-4000 msnm'
  },
  'Avena Forrajera': {
    nombre: 'Avena Forrajera',
    descripcion: 'Forraje para ganado',
    variedades: [
      { nombre: 'Mantaro 15', rendimiento: '25-35 t/ha', ciclo: '120-150 días' },
      { nombre: 'Tayko', rendimiento: '30-40 t/ha', ciclo: '130-160 días' },
      { nombre: 'Vilcanota', rendimiento: '28-38 t/ha', ciclo: '125-155 días' }
    ],
    icon: '🌾',
    altitud: '3200-4000 msnm'
  },
  'Tarwi': {
    nombre: 'Tarwi (Chocho)',
    descripcion: 'Leguminosa de alto valor proteico',
    variedades: [
      { nombre: 'Altagracia', rendimiento: '1.5-2.5 t/ha', ciclo: '180-210 días' },
      { nombre: 'Yunguyo', rendimiento: '1.8-2.8 t/ha', ciclo: '170-200 días' }
    ],
    icon: '🫛',
    altitud: '3200-3800 msnm'
  },
  'Oca': {
    nombre: 'Oca',
    descripcion: 'Tubérculo andino tradicional',
    variedades: [
      { nombre: 'Amarilla', rendimiento: '8-12 t/ha', ciclo: '180-210 días' },
      { nombre: 'Rosada', rendimiento: '7-11 t/ha', ciclo: '185-215 días' },
      { nombre: 'Blanca', rendimiento: '9-13 t/ha', ciclo: '175-205 días' }
    ],
    icon: '🥔',
    altitud: '3500-4200 msnm'
  }
};

export const CULTIVO_TIPOS = Object.keys(CULTIVOS_PUNO);

export const CULTIVO_ESTADOS = [
  'Planificado',
  'Sembrado',
  'Crecimiento',
  'Floración',
  'Maduración',
  'Cosechado'
];

export const TIPOS_ACTIVIDAD = [
  'Riego',
  'Fertilización',
  'Control de Plagas',
  'Cosecha',
  'Otro'
];

export const TIPOS_INSUMO = [
  'Fertilizante NPK',
  'Agua',
  'Pesticida',
  'Herbicida',
  'Semillas',
  'Otro'
];

export const TIPOS_ASESORIA = [
  'Nutrición Vegetal',
  'Manejo Hídrico',
  'Manejo de Suelos',
  'Control Fitosanitario',
  'Análisis de Productividad',
  'Agricultura Sostenible'
];

export const REGIONES_PERU = [
  'Amazonas',
  'Áncash',
  'Apurímac',
  'Arequipa',
  'Ayacucho',
  'Cajamarca',
  'Callao',
  'Cusco',
  'Huancavelica',
  'Huánuco',
  'Ica',
  'Junín',
  'La Libertad',
  'Lambayeque',
  'Lima',
  'Loreto',
  'Madre de Dios',
  'Moquegua',
  'Pasco',
  'Piura',
  'Puno',
  'San Martín',
  'Tacna',
  'Tumbes',
  'Ucayali'
];

export const WEATHER_ICONS = {
  '01d': '☀️',
  '01n': '🌙',
  '02d': '⛅',
  '02n': '☁️',
  '03d': '☁️',
  '03n': '☁️',
  '04d': '☁️',
  '04n': '☁️',
  '09d': '🌧️',
  '09n': '🌧️',
  '10d': '🌦️',
  '10n': '🌧️',
  '11d': '⛈️',
  '11n': '⛈️',
  '13d': '❄️',
  '13n': '❄️',
  '50d': '🌫️',
  '50n': '🌫️'
};
