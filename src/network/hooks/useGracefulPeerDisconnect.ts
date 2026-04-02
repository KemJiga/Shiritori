import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type Peer from 'peerjs';
import { destroyPeer } from '../peer';
import { createMessage } from '../protocol';
import type { PeerMessage } from '../protocol';

/**
 * Sends player_leave before tab close / navigation so the host can remove the player
 * immediately instead of waiting for a flaky connection close.
 */
export function useClientPlayerLeaveOnUnload(
  peer: Peer | null,
  peerId: string | null,
  sendRef: MutableRefObject<(msg: PeerMessage) => void>,
) {
  const peerRef = useRef(peer);
  peerRef.current = peer;

  useEffect(() => {
    if (!peerId) return;

    const run = () => {
      const p = peerRef.current;
      if (!p || p.destroyed) return;
      try {
        sendRef.current(createMessage('player_leave', { playerId: peerId }));
      } catch {
        /* ignore */
      }
      destroyPeer(p);
    };

    window.addEventListener('pagehide', run);
    return () => window.removeEventListener('pagehide', run);
  }, [peerId, sendRef]);
}
