export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount);
};

export const calculateDaysSince = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getEstadoColor = (estado) => {
  const colors = {
    'Planificado': 'bg-gray-100 text-gray-800',
    'Sembrado': 'bg-blue-100 text-blue-800',
    'Crecimiento': 'bg-green-100 text-green-800',
    'Floración': 'bg-purple-100 text-purple-800',
    'Maduración': 'bg-yellow-100 text-yellow-800',
    'Cosechado': 'bg-red-100 text-red-800'
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
};

export const getPrioridadColor = (prioridad) => {
  const colors = {
    'Baja': 'bg-green-100 text-green-800',
    'Media': 'bg-yellow-100 text-yellow-800',
    'Alta': 'bg-orange-100 text-orange-800',
    'Urgente': 'bg-red-100 text-red-800'
  };
  return colors[prioridad] || 'bg-gray-100 text-gray-800';
};
