import { useEffect, useRef, useState, useCallback } from 'react';
import type Peer from 'peerjs';
import { HostManager } from '../host';
import type { PeerMessage } from '../protocol';

interface UseHostResult {
  hostManager: HostManager | null;
  connectedPeers: string[];
  broadcast: (message: PeerMessage) => void;
  sendTo: (peerId: string, message: PeerMessage) => void;
}

export function useHost(
  peer: Peer | null,
  onMessage?: (message: PeerMessage, senderId: string) => void,
): UseHostResult {
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const managerRef = useRef<HostManager | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!peer) return;

    const manager = new HostManager(peer);
    managerRef.current = manager;

    manager.setOnPeerConnected(() => {
      setConnectedPeers(manager.getConnectedPeerIds());
    });

    manager.setOnPeerDisconnected(() => {
      setConnectedPeers(manager.getConnectedPeerIds());
    });

    manager.setOnMessage((msg, senderId) => {
      onMessageRef.current?.(msg, senderId);
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

  return {
    hostManager: managerRef.current,
    connectedPeers,
    broadcast,
    sendTo,
  };
}
