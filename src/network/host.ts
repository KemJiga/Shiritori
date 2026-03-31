import type Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { PeerMessage } from './protocol';

export type MessageHandler = (
  message: PeerMessage,
  senderId: string,
) => void;

export type ConnectionHandler = (peerId: string) => void;

export class HostManager {
  private connections = new Map<string, DataConnection>();
  private onMessage: MessageHandler | null = null;
  private onPeerConnected: ConnectionHandler | null = null;
  private onPeerDisconnected: ConnectionHandler | null = null;
  private knownPeerIds = new Set<string>();
  private peer: Peer;

  constructor(peer: Peer) {
    this.peer = peer;
    this.peer.on('connection', (conn) => this.handleConnection(conn));
  }

  private handleConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.knownPeerIds.add(conn.peer);

      this.onPeerConnected?.(conn.peer);

      conn.on('data', (data) => {
        this.onMessage?.(data as PeerMessage, conn.peer);
      });

      conn.on('close', () => {
        this.connections.delete(conn.peer);
        this.onPeerDisconnected?.(conn.peer);
      });

      conn.on('error', () => {
        this.connections.delete(conn.peer);
        this.onPeerDisconnected?.(conn.peer);
      });
    });
  }

  setOnMessage(handler: MessageHandler): void {
    this.onMessage = handler;
  }

  setOnPeerConnected(handler: ConnectionHandler): void {
    this.onPeerConnected = handler;
  }

  setOnPeerDisconnected(handler: ConnectionHandler): void {
    this.onPeerDisconnected = handler;
  }

  broadcast(message: PeerMessage): void {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(message);
      }
    }
  }

  sendTo(peerId: string, message: PeerMessage): void {
    const conn = this.connections.get(peerId);
    if (conn?.open) {
      conn.send(message);
    }
  }

  getConnectedPeerIds(): string[] {
    return Array.from(this.connections.keys());
  }

  disconnectPeer(peerId: string): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.close();
      this.connections.delete(peerId);
    }
  }

  destroy(): void {
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
  }
}
