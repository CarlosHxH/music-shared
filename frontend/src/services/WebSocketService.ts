import { BehaviorSubject, Observable } from 'rxjs';
import type { Album } from '@/models/types';

/**
 * Serviço WebSocket para notificações em tempo real
 * Conecta ao endpoint /ws/albuns para receber atualizações de novos álbuns
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private novasNotificacoes$ = new BehaviorSubject<Album | null>(null);
  private conectado$ = new BehaviorSubject<boolean>(false);
  private wsUrl: string;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`;
    this.wsUrl = `${host}/ws/albuns`;
  }

  // Observables públicos
  obterNotificacoes(): Observable<Album | null> {
    return this.novasNotificacoes$.asObservable();
  }

  obterConectado(): Observable<boolean> {
    return this.conectado$.asObservable();
  }

  /**
   * Conecta ao WebSocket
   */
  conectar(): void {
    if (this.ws) return; // Já conectado

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket conectado');
        this.conectado$.next(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const notificacao = JSON.parse(event.data);
          console.log('Notificação recebida:', notificacao);
          this.novasNotificacoes$.next(notificacao);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        this.conectado$.next(false);
      };

      this.ws.onclose = () => {
        console.log('WebSocket desconectado');
        this.conectado$.next(false);
        this.ws = null;
        // Reconectar após 5 segundos
        setTimeout(() => this.conectar(), 5000);
      };
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      this.conectado$.next(false);
    }
  }

  /**
   * Desconecta do WebSocket
   */
  desconectar(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.conectado$.next(false);
    }
  }

  /**
   * Verifica se está conectado
   */
  estaConectado(): boolean {
    return this.conectado$.value;
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
