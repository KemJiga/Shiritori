import { useEffect, useRef, useState, useCallback } from 'react';
import type Peer from 'peerjs';
import { HostManager } from '../host';
import type { PeerMessage } from '../protocol';

interface UseHostCallbacks {
  onMessage?: (message: PeerMessage, senderId: string) => void;
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string) => void;
  onPeerReconnected?: (peerId: string) => void;
}

interface UseHostResult {
  hostManager: HostManager | null;
  connectedPeers: string[];
  broadcast: (message: PeerMessage) => void;
  sendTo: (peerId: string, message: PeerMessage) => void;
  setRejectNewConnections: (reject: boolean) => void;
}

export function useHost(
  peer: Peer | null,
  callbacks?: UseHostCallbacks,
): UseHostResult {
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const managerRef = useRef<HostManager | null>(null);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (!peer) return;

    const manager = new HostManager(peer);
    managerRef.current = manager;

    manager.setOnPeerConnected((peerId) => {
      setConnectedPeers(manager.getConnectedPeerIds());
      cbRef.current?.onPeerConnected?.(peerId);
    });

    manager.setOnPeerDisconnected((peerId) => {
      setConnectedPeers(manager.getConnectedPeerIds());
      cbRef.current?.onPeerDisconnected?.(peerId);
    });

    manager.setOnPeerReconnected((peerId) => {
      setConnectedPeers(manager.getConnectedPeerIds());
      cbRef.current?.onPeerReconnected?.(peerId);
    });

    manager.setOnMessage((msg, senderId) => {
      cbRef.current?.onMessage?.(msg, senderId);
    });

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [peer]);

  const broadcast = useCallback((message: PeerMessage) => {
    managerRef.current?.broadcast(message);
  }, []);

  const sendTo = useCallback((peerId: string, message: PeerMessage) => {
    managerRef.current?.sendTo(peerId, message);
  }, []);

  const setRejectNewConnections = useCallback((reject: boolean) => {
    managerRef.current?.setRejectNewConnections(reject);
  }, []);

  return {
    hostManager: managerRef.current,
    connectedPeers,
    broadcast,
    sendTo,
    setRejectNewConnections,
  };
}
