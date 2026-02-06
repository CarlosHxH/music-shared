import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { ArtistFacadeService } from './ArtistFacadeService';
import api from '@/utils/api';

vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ArtistFacadeService', () => {
  let service: ArtistFacadeService;

  beforeEach(() => {
    service = new ArtistFacadeService();
    vi.clearAllMocks();
  });

  it('deve expor observables iniciais vazios', async () => {
    const artistas = await firstValueFrom(service.obterArtistas());
    expect(artistas).toEqual([]);
  });

  it('deve carregar artistas e atualizar estado', async () => {
    const mockContent = [
      { id: 1, nome: 'Artista 1', quantidadeAlbuns: 2, createdAt: '2024-01-01' },
    ];
    vi.mocked(api.get).mockResolvedValue({
      data: {
        content: mockContent,
        totalPages: 1,
        totalElements: 1,
      },
    });

    await service.carregarArtistas(0, 10);

    const artistas: unknown[] = [];
    service.obterArtistas().subscribe((a) => artistas.push(a));
    expect(artistas.flat()).toEqual(mockContent);
    expect(api.get).toHaveBeenCalledWith('/artistas', expect.any(Object));
  });

  it('deve expor totalPaginas após carregar', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        content: [],
        totalPages: 5,
        totalElements: 50,
      },
    });

    await service.carregarArtistas(0, 10);

    const totals: number[] = [];
    service.obterTotalPaginas().subscribe((t) => totals.push(t));
    expect(totals).toContain(5);
  });
});
