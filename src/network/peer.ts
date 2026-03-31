import Peer from 'peerjs';

const PEER_OPEN_TIMEOUT_MS = 10_000;

export function createPeer(id?: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    const peer = id ? new Peer(id) : new Peer();

    const timeout = setTimeout(() => {
      peer.destroy();
      reject(new Error('PeerJS connection timed out'));
    }, PEER_OPEN_TIMEOUT_MS);

    peer.on('open', () => {
      clearTimeout(timeout);
      resolve(peer);
    });

    peer.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export function destroyPeer(peer: Peer | null): void {
  if (peer && !peer.destroyed) {
    peer.destroy();
  }
}
