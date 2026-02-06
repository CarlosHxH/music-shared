import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArtistCard from './ArtistCard';
import type { Artista } from '@/types/types';

const artistaMock: Artista = {
  id: 1,
  nome: 'Serj Tankian',
  quantidadeAlbuns: 3,
  createdAt: '2024-01-01',
};

describe('ArtistCard', () => {
  it('deve renderizar nome do artista', () => {
    render(<ArtistCard artist={artistaMock} />);
    expect(screen.getByText('Serj Tankian')).toBeInTheDocument();
  });

  it('deve exibir quantidade de álbuns', () => {
    render(<ArtistCard artist={artistaMock} />);
    expect(screen.getByText(/3 álbuns/)).toBeInTheDocument();
  });

  it('deve chamar onClick ao clicar no card', () => {
    const onClick = vi.fn();
    const { container } = render(<ArtistCard artist={artistaMock} onClick={onClick} />);
    const card = container.querySelector('[class*="cursor-pointer"]') ?? container.firstChild;
    if (card) fireEvent.click(card as Element);
    expect(onClick).toHaveBeenCalledWith(1);
  });
});
