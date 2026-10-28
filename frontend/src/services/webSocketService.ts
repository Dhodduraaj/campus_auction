import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAuthToken } from './apiClient';

type MessageCallback<T> = (data: T) => void;

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private subscriptions = new Map<string, StompSubscription>();
  private pendingSubscriptions = new Map<string, MessageCallback<any>>();

  connect(onConnected?: () => void) {
    if (this.client && (this.connected || this.client.active)) {
      return;
    }

    const socketFactory = () => new SockJS('/ws');

    this.client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: `Bearer ${getAuthToken() || ''}`,
      },
      onConnect: () => {
        this.connected = true;
        // Resubscribe to pending topics
        this.pendingSubscriptions.forEach((callback, destination) => {
          this.doSubscribe(destination, callback);
        });
        if (onConnected) onConnected();
      },
      onDisconnect: () => {
        this.connected = false;
        this.subscriptions.clear();
      },
      onStompError: (frame) => {
        console.warn('STOMP protocol error:', frame.headers['message']);
      },
    });

    this.client.activate();
  }

  subscribe<T>(destination: string, callback: MessageCallback<T>): () => void {
    this.pendingSubscriptions.set(destination, callback);

    if (this.connected && this.client) {
      this.doSubscribe(destination, callback);
    }

    return () => {
      this.pendingSubscriptions.delete(destination);
      const sub = this.subscriptions.get(destination);
      if (sub) {
        sub.unsubscribe();
        this.subscriptions.delete(destination);
      }
    };
  }

  private doSubscribe<T>(destination: string, callback: MessageCallback<T>) {
    if (!this.client || !this.connected) return;

    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination)?.unsubscribe();
    }

    const sub = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const payload: T = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        console.warn('Failed to parse STOMP message payload', err);
      }
    });

    this.subscriptions.set(destination, sub);
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.clear();
      this.pendingSubscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const webSocketService = new WebSocketService();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    webSocketService.disconnect();
  });
}
