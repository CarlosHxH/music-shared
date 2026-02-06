import { BehaviorSubject, Observable } from 'rxjs';
import api from '../utils/api';
import type { Album, CapaAlbum, BackendPageResponse } from '../types/types';

/**
 * Facade Service para Álbuns
 * Centraliza toda a lógica de estado e comunicação com API para álbuns
 */
export class AlbumFacadeService {
  private albuns$ = new BehaviorSubject<Album[]>([]);
  private selecionado$ = new BehaviorSubject<Album | null>(null);
  private carregando$ = new BehaviorSubject<boolean>(false);
  private pagina$ = new BehaviorSubject<number>(0);
  private tamanho$ = new BehaviorSubject<number>(10);
  private totalPaginas$ = new BehaviorSubject<number>(0);

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
    this.carregando$.next(true);
    try {
      const response = await api.get<BackendPageResponse<Album>>('/albuns', {
        params: {
          page: pagina,
          size: tamanho,
          sort,
          direction,
        },
      });

      this.albuns$.next(response.data.content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(response.data.totalPages);
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
    this.carregando$.next(true);
    try {
      const response = await api.get<BackendPageResponse<Album>>(
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

      this.albuns$.next(response.data.content);
      this.pagina$.next(pagina);
      this.tamanho$.next(tamanho);
      this.totalPaginas$.next(response.data.totalPages);
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
    this.carregando$.next(true);
    try {
      const response = await api.get<Album>(`/albuns/${id}`);
      this.selecionado$.next(response.data);
      return response.data;
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
   * Obtém URL pré-assinada para exibir capa
   */
  async obterUrlCapa(albumId: number, capaId: number): Promise<string> {
    try {
      const response = await api.get<{ url: string }>(
        `/albuns/${albumId}/capa/${capaId}/presigned-url`
      );
      return response.data.url;
    } catch (error) {
      console.error('Erro ao obter URL da capa:', error);
      throw error;
    }
  }

  /**
   * Limpa o estado de álbuns
   */
  limpar(): void {
    this.albuns$.next([]);
    this.selecionado$.next(null);
    this.pagina$.next(0);
  }
}

// Singleton instance
export const albumFacadeService = new AlbumFacadeService();
