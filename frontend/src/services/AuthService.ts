import { BehaviorSubject, Observable } from 'rxjs';
import api, { cachedGet } from '../utils/api';
import type { LoginRequest, RegisterRequest, Usuario } from '@/types/types';

/**
 * Serviço de Autenticação
 * Gerencia login, registro, tokens JWT e estado de autenticação
 */
export class AuthService {
  private usuario$ = new BehaviorSubject<Usuario | null>(null);
  private autenticado$ = new BehaviorSubject<boolean>(false);
  private carregando$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.verificarTokenLocal();
  }

  // Observables públicos
  obterUsuario(): Observable<Usuario | null> {
    return this.usuario$.asObservable();
  }

  obterAutenticado(): Observable<boolean> {
    return this.autenticado$.asObservable();
  }

  obterCarregando(): Observable<boolean> {
    return this.carregando$.asObservable();
  }

  /**
   * Verifica se há token válido no localStorage
   */
  private verificarTokenLocal(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.autenticado$.next(true);
      const usuarioJson = localStorage.getItem('usuario');
      if (usuarioJson) {
        try {
          const usuario = JSON.parse(usuarioJson) as Usuario;
          this.usuario$.next(usuario);
        } catch (e) {
          console.warn('Falha ao parsear usuario do localStorage', e);
        }
      }
    }
  }

  /**
   * Verifica se usuário possui um papel (role)
   */
  hasRole(role: string): boolean {
    const u = this.usuario$.value;
    if (!u || !u.roles) return false;
    return u.roles.includes(role);
  }

  /**
   * Faz login do usuário
   */
  async login(credenciais: LoginRequest): Promise<void> {
    this.carregando$.next(true);
    try {
      const response = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', credenciais);
      const { accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const usuario = await this.buscarUsuarioAtual();
      if (usuario) {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuario$.next(usuario);
      }
      this.autenticado$.next(true);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Busca dados do usuário atual na API
   */
  private async buscarUsuarioAtual(): Promise<Usuario | null> {
    try {
      const response = await cachedGet<Usuario>('/usuarios/me');
      return response;
    } catch {
      return null;
    }
  }

  /**
   * Registra um novo usuário
   */
  async registrar(dados: RegisterRequest): Promise<void> {
    this.carregando$.next(true);
    try {
      const response = await api.post<{ accessToken: string; refreshToken: string }>('/auth/register', dados);
      const { accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const usuario = await this.buscarUsuarioAtual();
      if (usuario) {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuario$.next(usuario);
      }
      this.autenticado$.next(true);
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Faz logout do usuário
   */
  async logout(): Promise<void> {
    try {
      // Chamar endpoint de logout para invalidar token no backend
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar dados locais independentemente
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('usuario');
      this.usuario$.next(null);
      this.autenticado$.next(false);
    }
  }

  /**
   * Obtém o token de acesso atual
   */
  obterAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Verifica se usuário está autenticado
   */
  estaAutenticado(): boolean {
    return this.autenticado$.value;
  }

  /**
   * Obtém usuário atual
   */
  obterUsuarioAtual(): Usuario | null {
    return this.usuario$.value;
  }

  /**
   * Atualiza perfil do usuário (username e email)
   */
  async atualizarPerfil(username: string, email: string): Promise<Usuario> {
    const response = await api.put<Usuario>('/usuarios/me', { username, email });
    const usuario = response.data;
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.usuario$.next(usuario);
    return usuario;
  }

  /**
   * Altera a senha do usuário logado
   */
  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    await api.put('/usuarios/me/senha', { senhaAtual, novaSenha });
  }
}

// Singleton instance
export const authService = new AuthService();
