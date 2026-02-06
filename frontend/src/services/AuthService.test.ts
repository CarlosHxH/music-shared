import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './AuthService';
import api from '@/utils/api';

vi.mock('@/utils/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({}),
    get: vi.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    service = new AuthService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve expor autenticado como false inicialmente', async () => {
    const autenticado = await firstValueFrom(service.obterAutenticado());
    expect(autenticado).toBe(false);
  });

  it('deve fazer login e atualizar estado', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { accessToken: 'token', refreshToken: 'refresh' },
    });
    vi.mocked(api.get).mockResolvedValue({
      data: { id: 1, username: 'admin', email: 'a@b.com', ativo: true, createdAt: '2024-01-01' },
    });

    await service.login({ username: 'admin', password: '123' });

    expect(localStorage.getItem('accessToken')).toBe('token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh');
    const autenticados: boolean[] = [];
    service.obterAutenticado().subscribe((a) => autenticados.push(a));
    expect(autenticados).toContain(true);
  });

  it('deve fazer logout e limpar tokens', async () => {
    localStorage.setItem('accessToken', 'token');
    localStorage.setItem('refreshToken', 'refresh');
    service = new AuthService();

    await service.logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
