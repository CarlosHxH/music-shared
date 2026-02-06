import { BehaviorSubject, Observable } from 'rxjs';
import api from '@/utils/api';
import type { Artista, PaginatedResponse, TipoArtista } from '@/types/types';

/**
 * Facade Service para Artistas
 * Centraliza toda a lógica de estado e comunicação com API para artistas
 */
export class ArtistFacadeService {
  private artistas$ = new BehaviorSubject<Artista[]>([]);
  private selecionado$ = new BehaviorSubject<Artista | null>(null);
  private carregando$ = new BehaviorSubject<boolean>(false);
  private pagina$ = new BehaviorSubject<number>(0);
  private tamanho$ = new BehaviorSubject<number>(10);
  private nome$ = new BehaviorSubject<string>('');
  private ordenacao$ = new BehaviorSubject<'ASC' | 'DESC'>('ASC');
  private totalPaginas$ = new BehaviorSubject<number>(0);

  // Observables públicos
  obterArtistas(): Observable<Artista[]> {
    return this.artistas$.asObservable();
  }

  obterSelecionado(): Observable<Artista | null> {
    return this.selecionado$.asObservable();
  }

  obterCarregando(): Observable<boolean> {
    return this.carregando$.asObservable();
  }

  obterPagina(): Observable<number> {
    return this.pagina$.asObservable();
  }

  obterTotalPaginas(): Observable<number> {
    return this.totalPaginas$.asObservable();
  }

  /**
   * Carrega lista de artistas com paginação e filtros
   */
  async carregarArtistas(
    pagina: number = 0,
    tamanho: number = 10,
    nome?: string,
    ordenacao?: 'ASC' | 'DESC',
    sort: string = 'nome'
  ): Promise<void> {
    this.carregando$.next(true);
    try {
      const response = await api.get<PaginatedResponse<Artista>>('/artistas', {
        params: {
          page: pagina,
          size: tamanho,
          nome: nome || undefined,
          sort,
          direction: ordenacao || 'ASC',
        },
      });

      this.artistas$.next(response.data.content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(response.data.totalPages);
      if (nome) this.nome$.next(nome);
      if (ordenacao) this.ordenacao$.next(ordenacao);
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Carrega um artista por ID
   */
  async carregarArtistaById(id: number): Promise<Artista> {
    this.carregando$.next(true);
    try {
      const response = await api.get<Artista>(`/artistas/${id}`);
      this.selecionado$.next(response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar artista:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Cria um novo artista
   */
  async criarArtista(nome: string, descricao?: string, tipoArtista?: TipoArtista): Promise<Artista> {
    try {
      const response = await api.post<Artista>('/artistas', {
        nome,
        biografia: descricao,
        tipoArtista: tipoArtista ?? 'CANTOR',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar artista:', error);
      throw error;
    }
  }

  /**
   * Atualiza um artista
   */
  async atualizarArtista(
    id: number,
    nome: string,
    descricao?: string,
    tipoArtista?: TipoArtista
  ): Promise<Artista> {
    try {
      const response = await api.put<Artista>(`/artistas/${id}`, {
        nome,
        biografia: descricao,
        tipoArtista,
      });
      const atualizado = response.data;
      this.selecionado$.next(atualizado);
      return atualizado;
    } catch (error) {
      console.error('Erro ao atualizar artista:', error);
      throw error;
    }
  }

  /**
   * Deleta um artista
   */
  async deletarArtista(id: number): Promise<void> {
    try {
      await api.delete(`/artistas/${id}`);
      if (this.selecionado$.value?.id === id) {
        this.selecionado$.next(null);
      }
    } catch (error) {
      console.error('Erro ao deletar artista:', error);
      throw error;
    }
  }

  /**
   * Faz upload da foto do artista
   */
  async uploadFotoArtista(id: number, file: File): Promise<Artista> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<Artista>(`/artistas/${id}/foto`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const atualizado = response.data;
      this.selecionado$.next(atualizado);
      return atualizado;
    } catch (error) {
      console.error('Erro ao fazer upload de foto:', error);
      throw error;
    }
  }

  /**
   * Obtém URL pré-assinada da foto do artista
   */
  async obterUrlFotoArtista(id: number): Promise<string | null> {
    try {
      const response = await api.get<{ url: string }>(`/artistas/${id}/foto/presigned-url`);
      return response.data.url;
    } catch (error) {
      console.debug('Artista sem foto');
      return null;
    }
  }
}

// Singleton instance
export const artistFacadeService = new ArtistFacadeService();
