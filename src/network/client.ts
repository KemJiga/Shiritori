import type Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { PeerMessage } from './protocol';

export type ClientMessageHandler = (message: PeerMessage) => void;
export type ClientStatusHandler = (status: ClientStatus) => void;

export type ClientStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export class ClientManager {
  private connection: DataConnection | null = null;
  private onMessage: ClientMessageHandler | null = null;
  private onStatusChange: ClientStatusHandler | null = null;
  private status: ClientStatus = 'disconnected';
  private peer: Peer;
  private hostId: string;

  constructor(peer: Peer, hostId: string) {
    this.peer = peer;
    this.hostId = hostId;
  }

  connect(): void {
    this.setStatus('connecting');
    try {
      const conn = this.peer.connect(this.hostId, { reliable: true });
      if (!conn) {
        this.setStatus('failed');
        return;
      }
      this.setupConnection(conn);
    } catch {
      this.setStatus('failed');
    }
  }

  private setupConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connection = conn;
      this.setStatus('connected');

      conn.on('data', (data) => {
        this.onMessage?.(data as PeerMessage);
      });

      conn.on('close', () => {
        this.connection = null;
        this.setStatus('disconnected');
      });

      conn.on('error', () => {
        this.connection = null;
        this.setStatus('disconnected');
      });
    });

    conn.on('error', () => {
      this.setStatus('failed');
    });
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
  }
}
