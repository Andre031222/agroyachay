import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renderiza el contenido hijo', () => {
    render(<Card>Contenido</Card>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('muestra título y subtítulo cuando se proveen', () => {
    render(
      <Card title="Mi título" subtitle="Mi subtítulo">
        cuerpo
      </Card>
    );
    expect(screen.getByText('Mi título')).toBeInTheDocument();
    expect(screen.getByText('Mi subtítulo')).toBeInTheDocument();
  });

  it('invoca onClick al hacer clic', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>clic</Card>);
    fireEvent.click(screen.getByText('clic'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
