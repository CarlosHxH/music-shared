import { BehaviorSubject, Observable } from 'rxjs';
import api from '@/utils/api';
import type { Regional } from '@/types/types';

/**
 * Facade Service para Regionais
 * Centraliza toda a lógica de estado e comunicação com API para regionais
 */
export class RegionalFacadeService {
  private regionais$ = new BehaviorSubject<Regional[]>([]);
  private carregando$ = new BehaviorSubject<boolean>(false);
  private ultimaSincronizacao$ = new BehaviorSubject<Date | null>(null);

  // Observables públicos
  obterRegionais(): Observable<Regional[]> {
    return this.regionais$.asObservable();
  }

  obterCarregando(): Observable<boolean> {
    return this.carregando$.asObservable();
  }

  obterUltimaSincronizacao(): Observable<Date | null> {
    return this.ultimaSincronizacao$.asObservable();
  }

  /**
   * Carrega lista de regionais
   */
  async carregarRegionais(): Promise<void> {
    this.carregando$.next(true);
    try {
      const response = await api.get<Regional[]>('/regionais');
      this.regionais$.next(response.data);
      this.ultimaSincronizacao$.next(new Date());
    } catch (error) {
      console.error('Erro ao carregar regionais:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Sincroniza regionais com a API externa
   */
  async sincronizar(): Promise<void> {
    this.carregando$.next(true);
    try {
      const response = await api.post<Regional[]>('/regionais/sincronizar', {});
      // Garante que response.data é um array antes de atualizar o estado
      if (Array.isArray(response.data)) {
        this.regionais$.next(response.data);
        this.ultimaSincronizacao$.next(new Date());
      } else {
        // Se não for array, recarrega a lista
        console.warn('Resposta de sincronização não é um array, recarregando lista...');
        await this.carregarRegionais();
      }
    } catch (error) {
      console.error('Erro ao sincronizar regionais:', error);
      throw error;
    } finally {
      this.carregando$.next(false);
    }
  }

  /**
   * Filtra regionais por status ativo
   */
  obterAtivas(): Regional[] {
    return this.regionais$.value.filter((r) => r.ativo);
  }

  /**
   * Filtra regionais por status inativo
   */
  obterInativas(): Regional[] {
    return this.regionais$.value.filter((r) => !r.ativo);
  }
}

// Singleton instance
export const regionalFacadeService = new RegionalFacadeService();
