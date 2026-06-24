import { describe, it, expect } from 'vitest';
import { resolveAvatar } from './avatar';

describe('resolveAvatar', () => {
  it('devuelve null cuando no hay avatar', () => {
    expect(resolveAvatar(null)).toBeNull();
    expect(resolveAvatar('')).toBeNull();
  });

  it('devuelve la URL tal cual si ya es absoluta', () => {
    const url = 'https://cdn.ejemplo.com/foto.png';
    expect(resolveAvatar(url)).toBe(url);
  });

  it('construye la ruta del backend para nombres de archivo', () => {
    const result = resolveAvatar('foto123.png');
    expect(result).toContain('/auth/avatar/foto123.png');
  });
});
