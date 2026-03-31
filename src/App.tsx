import { useState } from 'react';
import { usePeer } from './network/hooks/usePeer';
import { useHost } from './network/hooks/useHost';
import { useClient } from './network/hooks/useClient';
import type { PeerMessage } from './network/protocol';
import { createMessage } from './network/protocol';

type Role = 'none' | 'host' | 'client';

function App() {
  const [role, setRole] = useState<Role>('none');
  const [hostIdInput, setHostIdInput] = useState('');
  const [messageLog, setMessageLog] = useState<string[]>([]);

  const appendLog = (entry: string) => {
    setMessageLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${entry}`]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Shiritori - Connection Test</h1>

      {role === 'none' && (
        <RoleSelector
          hostIdInput={hostIdInput}
          setHostIdInput={setHostIdInput}
          onHost={() => setRole('host')}
          onJoin={() => {
            if (hostIdInput.trim()) setRole('client');
          }}
        />
      )}

      {role === 'host' && <HostPanel appendLog={appendLog} />}
      {role === 'client' && (
        <ClientPanel hostId={hostIdInput.trim()} appendLog={appendLog} />
      )}

      {role !== 'none' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Message Log</h2>
          <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {messageLog.length === 0 ? (
              <p className="text-gray-500">No messages yet...</p>
            ) : (
              messageLog.map((msg, i) => (
                <p key={i} className="text-green-400">
                  {msg}
                </p>
              ))
            )}
          </div>
          <button
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
            onClick={() => {
              setRole('none');
              setMessageLog([]);
            }}
          >
            Disconnect & Reset
          </button>
        </div>
      )}
    </div>
  );
}

function RoleSelector({
  hostIdInput,
  setHostIdInput,
  onHost,
  onJoin,
}: {
  hostIdInput: string;
  setHostIdInput: (v: string) => void;
  onHost: () => void;
  onJoin: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create a Game (Host)</h2>
        <button
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
          onClick={onHost}
        >
          Start as Host
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Join a Game (Client)</h2>
        <input
          type="text"
          placeholder="Enter Host Peer ID"
          value={hostIdInput}
          onChange={(e) => setHostIdInput(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg mb-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-40"
          disabled={!hostIdInput.trim()}
          onClick={onJoin}
        >
          Connect to Host
        </button>
      </div>
    </div>
  );
}

function HostPanel({ appendLog }: { appendLog: (s: string) => void }) {
  const { peer, peerId, error, isReady } = usePeer();
  const [testMsg, setTestMsg] = useState('');

  const handleMessage = (msg: PeerMessage, senderId: string) => {
    appendLog(`From ${senderId}: ${JSON.stringify(msg)}`);
  };

  const { connectedPeers, broadcast } = useHost(peer, handleMessage);

  if (error) {
    return <p className="text-red-400">Error: {error}</p>;
  }

  if (!isReady) {
    return <p className="text-yellow-400">Connecting to PeerJS server...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-400">Your Peer ID (share with clients):</p>
        <p className="text-lg font-mono text-indigo-400 select-all">{peerId}</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-1">
          Connected peers: {connectedPeers.length}
        </p>
        {connectedPeers.map((id) => (
          <span
            key={id}
            className="inline-block bg-gray-800 rounded px-2 py-1 text-sm font-mono mr-2 mb-1"
          >
            {id}
          </span>
        ))}
      </div>

      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          placeholder="Test message to broadcast"
          value={testMsg}
          onChange={(e) => setTestMsg(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-40"
          disabled={!testMsg.trim() || connectedPeers.length === 0}
          onClick={() => {
            const msg = createMessage('error', { message: testMsg });
            broadcast(msg);
            appendLog(`Broadcast: ${testMsg}`);
            setTestMsg('');
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ClientPanel({
  hostId,
  appendLog,
}: {
  hostId: string;
  appendLog: (s: string) => void;
}) {
  const { peer, peerId, error: peerError, isReady } = usePeer();
  const [testMsg, setTestMsg] = useState('');

  const handleMessage = (msg: PeerMessage) => {
    appendLog(`From host: ${JSON.stringify(msg)}`);
  };

  const { status, send } = useClient(isReady ? peer : null, hostId, handleMessage);

  if (peerError) {
    return <p className="text-red-400">Peer error: {peerError}</p>;
  }

  if (!isReady) {
    return <p className="text-yellow-400">Initializing peer...</p>;
  }

  const statusColors: Record<string, string> = {
    connecting: 'text-yellow-400',
    connected: 'text-green-400',
    disconnected: 'text-gray-400',
    failed: 'text-red-400',
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-400">Your Peer ID:</p>
        <p className="text-lg font-mono text-emerald-400">{peerId}</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-400">
          Connection to host:{' '}
          <span className={statusColors[status] ?? 'text-gray-400'}>{status}</span>
        </p>
      </div>

      {status === 'connected' && (
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Test message to host"
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-40"
            disabled={!testMsg.trim()}
            onClick={() => {
              const msg = createMessage('error', { message: testMsg });
              send(msg);
              appendLog(`Sent to host: ${testMsg}`);
              setTestMsg('');
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
