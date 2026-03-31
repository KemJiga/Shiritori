import type Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { PeerMessage } from './protocol';

const MAX_RECONNECT_ATTEMPTS = 3;
const BASE_RECONNECT_DELAY_MS = 1000;

export type ClientMessageHandler = (message: PeerMessage) => void;
export type ClientStatusHandler = (status: ClientStatus) => void;

export type ClientStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export class ClientManager {
  private connection: DataConnection | null = null;
  private onMessage: ClientMessageHandler | null = null;
  private onStatusChange: ClientStatusHandler | null = null;
  private reconnectAttempts = 0;
  private status: ClientStatus = 'disconnected';
  private peer: Peer;
  private hostId: string;

  constructor(peer: Peer, hostId: string) {
    this.peer = peer;
    this.hostId = hostId;
  }

  connect(): void {
    this.setStatus('connecting');
    const conn = this.peer.connect(this.hostId, { reliable: true });
    this.setupConnection(conn);
  }

  private setupConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connection = conn;
      this.reconnectAttempts = 0;
      this.setStatus('connected');

      conn.on('data', (data) => {
        this.onMessage?.(data as PeerMessage);
      });

      conn.on('close', () => {
        this.connection = null;
        this.setStatus('disconnected');
        this.attemptReconnect();
      });

      conn.on('error', () => {
        this.connection = null;
        this.setStatus('disconnected');
        this.attemptReconnect();
      });
    });

    conn.on('error', () => {
      this.setStatus('disconnected');
      this.attemptReconnect();
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.setStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.status === 'disconnected') {
        this.connect();
      }
    }, delay);
  }

  private setStatus(status: ClientStatus): void {
    this.status = status;
    this.onStatusChange?.(status);
  }

  setOnMessage(handler: ClientMessageHandler): void {
    this.onMessage = handler;
  }

  setOnStatusChange(handler: ClientStatusHandler): void {
    this.onStatusChange = handler;
  }

  send(message: PeerMessage): void {
    if (this.connection?.open) {
      this.connection.send(message);
    }
  }

  getStatus(): ClientStatus {
    return this.status;
  }

  destroy(): void {
    this.connection?.close();
    this.connection = null;
    this.setStatus('disconnected');
  }
}
