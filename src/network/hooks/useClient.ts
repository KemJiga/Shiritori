import { useEffect, useRef, useState, useCallback } from 'react';
import type Peer from 'peerjs';
import { ClientManager } from '../client';
import type { ClientStatus } from '../client';
import type { PeerMessage } from '../protocol';

interface UseClientResult {
  status: ClientStatus;
  send: (message: PeerMessage) => void;
  lastMessage: PeerMessage | null;
}

export function useClient(
  peer: Peer | null,
  hostId: string | null,
  onMessage?: (message: PeerMessage) => void,
): UseClientResult {
  const [status, setStatus] = useState<ClientStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<PeerMessage | null>(null);
  const managerRef = useRef<ClientManager | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!peer || !hostId) return;

    const manager = new ClientManager(peer, hostId);
    managerRef.current = manager;

    manager.setOnStatusChange(setStatus);
    manager.setOnMessage((msg) => {
      setLastMessage(msg);
      onMessageRef.current?.(msg);
    });

    manager.connect();

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [peer, hostId]);

  const send = useCallback((message: PeerMessage) => {
    managerRef.current?.send(message);
  }, []);

  return { status, send, lastMessage };
}
