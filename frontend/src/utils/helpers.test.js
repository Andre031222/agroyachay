import { describe, it, expect } from 'vitest';
import {
  truncateText,
  getEstadoColor,
  getPrioridadColor,
  formatCurrency,
} from './helpers';

describe('truncateText', () => {
  it('no trunca textos cortos', () => {
    expect(truncateText('hola', 10)).toBe('hola');
  });

  it('trunca y agrega puntos suspensivos', () => {
    expect(truncateText('abcdefghij', 5)).toBe('abcde...');
  });
});

describe('getEstadoColor', () => {
  it('devuelve la clase del estado conocido', () => {
    expect(getEstadoColor('Sembrado')).toContain('blue');
  });

  it('devuelve un color por defecto para estados desconocidos', () => {
    expect(getEstadoColor('Inexistente')).toContain('gray');
  });
});

describe('getPrioridadColor', () => {
  it('mapea Urgente a rojo', () => {
    expect(getPrioridadColor('Urgente')).toContain('red');
  });

  it('usa el color por defecto si no coincide', () => {
    expect(getPrioridadColor('???')).toContain('gray');
  });
});

describe('formatCurrency', () => {
  it('formatea importes en soles', () => {
    const result = formatCurrency(1500);
    expect(result).toMatch(/S\/|1.?500/);
  });
});
