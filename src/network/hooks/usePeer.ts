import { useEffect, useState } from 'react';
import type Peer from 'peerjs';
import { createPeer, destroyPeer } from '../peer';

interface UsePeerResult {
  peer: Peer | null;
  peerId: string | null;
  error: string | null;
  isReady: boolean;
}

export function usePeer(requestedId?: string): UsePeerResult {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let destroyed = false;
    let peerInstance: Peer | null = null;

    createPeer(requestedId)
      .then((p) => {
        if (destroyed) {
          destroyPeer(p);
          return;
        }
        peerInstance = p;
        setPeer(p);
        setPeerId(p.id);
        setIsReady(true);

        p.on('disconnected', () => {
          if (!destroyed) setIsReady(false);
        });

        p.on('close', () => {
          if (!destroyed) {
            setPeer(null);
            setPeerId(null);
            setIsReady(false);
          }
        });
      })
      .catch((err) => {
        if (!destroyed) {
          setError(err instanceof Error ? err.message : 'Failed to connect');
        }
      });

    return () => {
      destroyed = true;
      destroyPeer(peerInstance);
      setPeer(null);
      setPeerId(null);
      setIsReady(false);
    };
  }, [requestedId]);

  return { peer, peerId, error, isReady };
}
