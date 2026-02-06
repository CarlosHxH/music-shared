import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Album, Artista } from '@/types/types';

export interface NotificationMessage {
  type: string;
  message: string;
  timestamp?: string;
  data?: { payload?: Album | Artista | Record<string, unknown> };
}

/**
 * Serviço WebSocket para notificações em tempo real via STOMP
 * Conecta ao endpoint /ws/albuns e subscreve em /topic/albuns e /topic/artistas
 */
export class WebSocketService {
  private client: Client | null = null;
  private novasNotificacoes$ = new BehaviorSubject<NotificationMessage | null>(null);
  private conectado$ = new BehaviorSubject<boolean>(false);
  private baseUrl: string;

  constructor() {
    const wsUrl = import.meta.env.VITE_WS_URL || '/ws';
    this.baseUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}${wsUrl}`
      : '';
  }

  obterNotificacoes(): Observable<NotificationMessage | null> {
    return this.novasNotificacoes$.asObservable();
  }

  obterConectado(): Observable<boolean> {
    return this.conectado$.asObservable();
  }

  conectar(): void {
    if (!this.baseUrl || this.client?.active) return;

    const brokerURL = `${this.baseUrl}/albuns`;
    this.client = new Client({
      webSocketFactory: () => new SockJS(brokerURL) as unknown as WebSocket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.conectado$.next(true);
        const handleMessage = (message: { body: string }) => {
          try {
            const body = JSON.parse(message.body) as NotificationMessage;
            this.novasNotificacoes$.next(body);
          } catch (e) {
            console.error('Erro ao processar mensagem STOMP:', e);
          }
        };
        this.client?.subscribe('/topic/albuns', handleMessage);
        this.client?.subscribe('/topic/artistas', handleMessage);
      },
      onStompError: (frame) => {
        console.error('Erro STOMP:', frame);
        this.conectado$.next(false);
      },
      onWebSocketClose: () => {
        this.conectado$.next(false);
      },
    });

    this.client.activate();
  }

  desconectar(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.conectado$.next(false);
    }
  }

  estaConectado(): boolean {
    return this.conectado$.value;
  }
}

export const webSocketService = new WebSocketService();
