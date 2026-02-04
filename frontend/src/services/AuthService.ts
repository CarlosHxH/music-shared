import { BehaviorSubject, Observable } from 'rxjs';
import api from '../utils/api';
import type { AuthResponse, LoginRequest, RegisterRequest, Usuario } from '@/models/types';

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
      const response = await api.post<AuthResponse>('/auth/login', credenciais);
      const { accessToken, refreshToken, usuario } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      this.usuario$.next(usuario);
      this.autenticado$.next(true);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Registra um novo usuário
   */
  async registrar(dados: RegisterRequest): Promise<void> {
    this.carregando$.next(true);
    try {
      const response = await api.post<AuthResponse>('/auth/register', dados);
      const { accessToken, refreshToken, usuario } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      this.usuario$.next(usuario);
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
}

// Singleton instance
export const authService = new AuthService();
