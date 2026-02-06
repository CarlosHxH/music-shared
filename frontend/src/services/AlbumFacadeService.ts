import { BehaviorSubject, Observable } from 'rxjs';
import api, { cachedGet } from '../utils/api';
import type { Album, CapaAlbum, BackendPageResponse } from '../types/types';

const CACHE_TTL_MS = 60_000; // 1 minuto

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Facade Service para Álbuns
 * Centraliza toda a lógica de estado e comunicação com API para álbuns
 * Usa cache para reduzir requisições duplicadas
 */
export class AlbumFacadeService {
  private albuns$ = new BehaviorSubject<Album[]>([]);
  private selecionado$ = new BehaviorSubject<Album | null>(null);
  private carregando$ = new BehaviorSubject<boolean>(false);
  private pagina$ = new BehaviorSubject<number>(0);
  private tamanho$ = new BehaviorSubject<number>(10);
  private totalPaginas$ = new BehaviorSubject<number>(0);

  private cacheAlbuns = new Map<string, CacheEntry<{ content: Album[]; totalPages: number }>>();
  private cacheAlbumById = new Map<number, CacheEntry<Album>>();

  private buildCacheKey(
    pagina: number,
    tamanho: number,
    sort: string,
    direction: string,
    artistaId?: number
  ): string {
    return artistaId != null
      ? `artista_${artistaId}_${pagina}_${tamanho}_${sort}_${direction}`
      : `all_${pagina}_${tamanho}_${sort}_${direction}`;
  }

  /** Invalida o cache (ex: ao receber notificação WebSocket de alteração) */
  invalidarCache(): void {
    this.cacheAlbuns.clear();
    this.cacheAlbumById.clear();
  }

  // Observables públicos
  obterAlbuns(): Observable<Album[]> {
    return this.albuns$.asObservable();
  }

  obterSelecionado(): Observable<Album | null> {
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
   * Carrega todos os álbuns com paginação e ordenação
   */
  async carregarAlbuns(
    pagina: number = 0,
    tamanho: number = 12,
    sort: string = 'id',
    direction: 'ASC' | 'DESC' = 'ASC'
  ): Promise<void> {
    const key = this.buildCacheKey(pagina, tamanho, sort, direction);
    const cached = this.cacheAlbuns.get(key);
    if (isCacheValid(cached)) {
      this.albuns$.next(cached.data.content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(cached.data.totalPages);
      return;
    }

    this.carregando$.next(true);
    try {
      const response = await cachedGet<BackendPageResponse<Album>>('/albuns', {
        params: {
          page: pagina,
          size: tamanho,
          sort,
          direction,
        },
      });

      const { content, totalPages } = response;
      this.cacheAlbuns.set(key, { data: { content, totalPages }, timestamp: Date.now() });
      this.albuns$.next(content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(totalPages);
    } catch (error) {
      console.error('Erro ao carregar álbuns:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Carrega álbuns de um artista com paginação e ordenação
   */
  async carregarAlbunsPorArtista(
    artistaId: number,
    pagina: number = 0,
    tamanho: number = 10,
    sort: string = 'id',
    direction: 'ASC' | 'DESC' = 'ASC'
  ): Promise<void> {
    const key = this.buildCacheKey(pagina, tamanho, sort, direction, artistaId);
    const cached = this.cacheAlbuns.get(key);
    if (isCacheValid(cached)) {
      this.albuns$.next(cached.data.content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(cached.data.totalPages);
      return;
    }

    this.carregando$.next(true);
    try {
      const response = await cachedGet<BackendPageResponse<Album>>(
        `/albuns/artista/${artistaId}`,
        {
          params: {
            page: pagina,
            size: tamanho,
            sort,
            direction,
          },
        }
      );

      const { content, totalPages } = response;
      this.cacheAlbuns.set(key, { data: { content, totalPages }, timestamp: Date.now() });
      this.albuns$.next(content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(totalPages);
    } catch (error) {
      console.error('Erro ao carregar álbuns:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Carrega um álbum por ID
   */
  async carregarAlbumById(id: number): Promise<Album> {
    const cached = this.cacheAlbumById.get(id);
    if (isCacheValid(cached)) {
      this.selecionado$.next(cached.data);
      return cached.data;
    }

    this.carregando$.next(true);
    try {
      const album = await cachedGet<Album>(`/albuns/${id}`);
      this.cacheAlbumById.set(id, { data: album, timestamp: Date.now() });
      this.selecionado$.next(album);
      return album;
    } catch (error) {
      console.error('Erro ao carregar álbum:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Cria um novo álbum
   */
  async criarAlbum(
    titulo: string,
    artistaId: number,
    dataLancamento?: string
  ): Promise<Album> {
    try {
      this.invalidarCache();
      const response = await api.post<Album>('/albuns', {
        titulo,
        artistaId,
        dataLancamento,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar álbum:', error);
      throw error;
    }
  }

  /**
   * Atualiza um álbum
   */
  async atualizarAlbum(
    id: number,
    titulo: string,
    artistaId: number,
    dataLancamento?: string
  ): Promise<Album> {
    try {
      this.invalidarCache();
      const response = await api.put<Album>(`/albuns/${id}`, {
        titulo,
        artistaId,
        dataLancamento,
      });
      const atualizado = response.data;
      this.selecionado$.next(atualizado);
      return atualizado;
    } catch (error) {
      console.error('Erro ao atualizar álbum:', error);
      throw error;
    }
  }

  /**
   * Deleta um álbum
   */
  async deletarAlbum(id: number): Promise<void> {
    try {
      this.invalidarCache();
      await api.delete(`/albuns/${id}`);
      if (this.selecionado$.value?.id === id) {
        this.selecionado$.next(null);
      }
    } catch (error) {
      console.error('Erro ao deletar álbum:', error);
      throw error;
    }
  }

  /**
   * Faz upload de capas do álbum
   */
  async uploadCapas(albumId: number, files: File[]): Promise<CapaAlbum[]> {
    try {
      this.invalidarCache();
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post<CapaAlbum[]>(
        `/albuns/${albumId}/capa`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload de capas:', error);
      throw error;
    }
  }

  /**
   * Remove uma capa do álbum
   */
  async deletarCapa(albumId: number, capaId: number): Promise<void> {
    try {
      this.invalidarCache();
      await api.delete(`/albuns/${albumId}/capa/${capaId}`);
    } catch (error) {
      console.error('Erro ao remover capa:', error);
      throw error;
    }
  }

  /**
   * Obtém URL pré-assinada para exibir capa
   */
  async obterUrlCapa(albumId: number, capaId: number): Promise<string> {
    try {
      const response = await cachedGet<{ url: string }>(
        `/albuns/${albumId}/capa/${capaId}/presigned-url`
      );
      return response.url;
    } catch (error) {
      console.error('Erro ao obter URL da capa:', error);
      throw error;
    }
  }

  /**
   * Limpa o estado de álbuns
   */
  limpar(): void {
    this.invalidarCache();
    this.albuns$.next([]);
    this.selecionado$.next(null);
    this.pagina$.next(0);
  }
}

// Singleton instance
export const albumFacadeService = new AlbumFacadeService();
