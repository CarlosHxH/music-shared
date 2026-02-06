import { BehaviorSubject, Observable } from 'rxjs';
import api, { cachedGet } from '@/utils/api';
import type { Artista, PaginatedResponse, TipoArtista } from '@/types/types';

const CACHE_TTL_MS = 60_000; // 1 minuto

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Facade Service para Artistas
 * Centraliza toda a lógica de estado e comunicação com API para artistas
 * Usa cache para reduzir requisições duplicadas (ex: AlbunsPage + HomePage)
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

  private cacheArtistas = new Map<string, CacheEntry<{ content: Artista[]; totalPages: number }>>();
  private cacheArtistaById = new Map<number, CacheEntry<Artista>>();

  private buildCacheKey(
    pagina: number,
    tamanho: number,
    nome?: string,
    ordenacao?: string,
    sort?: string,
    tipo?: TipoArtista
  ): string {
    return `${pagina}_${tamanho}_${nome ?? ''}_${ordenacao ?? 'ASC'}_${sort ?? 'nome'}_${tipo ?? ''}`;
  }

  /** Invalida o cache (ex: ao receber notificação WebSocket de alteração) */
  invalidarCache(): void {
    this.cacheArtistas.clear();
    this.cacheArtistaById.clear();
  }

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
   * Usa cache para evitar requisições duplicadas (ex: AlbunsPage carregando dropdown)
   */
  async carregarArtistas(
    pagina: number = 0,
    tamanho: number = 10,
    nome?: string,
    ordenacao?: 'ASC' | 'DESC',
    sort: string = 'nome',
    tipo?: TipoArtista
  ): Promise<void> {
    const key = this.buildCacheKey(pagina, tamanho, nome, ordenacao ?? 'ASC', sort, tipo);
    const cached = this.cacheArtistas.get(key);
    if (isCacheValid(cached)) {
      this.artistas$.next(cached.data.content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(cached.data.totalPages);
      if (nome) this.nome$.next(nome);
      if (ordenacao) this.ordenacao$.next(ordenacao);
      return;
    }

    this.carregando$.next(true);
    try {
      const response = await cachedGet<PaginatedResponse<Artista>>('/artistas', {
        params: {
          page: pagina,
          size: tamanho,
          nome: nome || undefined,
          tipo: tipo || undefined,
          sort,
          direction: ordenacao || 'ASC',
        },
      });

      const { content, totalPages } = response;
      this.cacheArtistas.set(key, { data: { content, totalPages }, timestamp: Date.now() });
      this.artistas$.next(content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(totalPages);
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
   * Usa cache para evitar requisições ao navegar de volta para o mesmo artista
   */
  async carregarArtistaById(id: number): Promise<Artista> {
    const cached = this.cacheArtistaById.get(id);
    if (isCacheValid(cached)) {
      this.selecionado$.next(cached.data);
      return cached.data;
    }

    this.carregando$.next(true);
    try {
      const artista = await cachedGet<Artista>(`/artistas/${id}`);
      this.cacheArtistaById.set(id, { data: artista, timestamp: Date.now() });
      this.selecionado$.next(artista);
      return artista;
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
      this.invalidarCache();
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
      this.invalidarCache();
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
      this.invalidarCache();
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
      this.invalidarCache();
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
   * Remove a foto do artista
   */
  async deletarFotoArtista(id: number): Promise<void> {
    try {
      this.invalidarCache();
      await api.delete(`/artistas/${id}/foto`);
      const atual = this.selecionado$.value;
      if (atual?.id === id && atual) {
        this.selecionado$.next({ ...atual, fotoUrl: undefined, fotoNomeArquivo: undefined });
      }
    } catch (error) {
      console.error('Erro ao remover foto do artista:', error);
      throw error;
    }
  }

  /**
   * Obtém URL pré-assinada da foto do artista
   */
  async obterUrlFotoArtista(id: number): Promise<string | null> {
    try {
      const response = await cachedGet<{ url: string }>(`/artistas/${id}/foto/presigned-url`);
      return response.url;
    } catch {
      console.debug('Artista sem foto');
      return null;
    }
  }
}

// Singleton instance
export const artistFacadeService = new ArtistFacadeService();
