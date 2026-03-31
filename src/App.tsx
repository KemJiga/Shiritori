import { useState, useRef, useEffect } from 'react';
import { usePeer } from './network/hooks/usePeer';
import { useHost } from './network/hooks/useHost';
import { useClient } from './network/hooks/useClient';
import type { PeerMessage } from './network/protocol';
import { createMessage } from './network/protocol';

type Role = 'none' | 'host' | 'client';

interface LogEntry {
  timestamp: string;
  sender: string;
  text: string;
  isSelf: boolean;
}

function App() {
  const [role, setRole] = useState<Role>('none');
  const [playerName, setPlayerName] = useState('');
  const [hostIdInput, setHostIdInput] = useState('');
  const [messageLog, setMessageLog] = useState<LogEntry[]>([]);

  const appendLog = (sender: string, text: string, isSelf = false) => {
    setMessageLog((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), sender, text, isSelf },
    ]);
  };

  const handleReset = () => {
    setRole('none');
    setMessageLog([]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Shiritori - Connection Test</h1>

      {role === 'none' && (
        <RoleSelector
          playerName={playerName}
          setPlayerName={setPlayerName}
          hostIdInput={hostIdInput}
          setHostIdInput={setHostIdInput}
          onHost={() => {
            if (playerName.trim()) setRole('host');
          }}
          onJoin={() => {
            if (playerName.trim() && hostIdInput.trim()) setRole('client');
          }}
        />
      )}

      {role === 'host' && (
        <HostPanel playerName={playerName.trim()} appendLog={appendLog} />
      )}
      {role === 'client' && (
        <ClientPanel
          playerName={playerName.trim()}
          hostId={hostIdInput.trim()}
          appendLog={appendLog}
        />
      )}

      {role !== 'none' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Message Log</h2>
          <MessageLog entries={messageLog} />
          <button
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
            onClick={handleReset}
          >
            Disconnect &amp; Reset
          </button>
        </div>
      )}
    </div>
  );
}

function MessageLog({ entries }: { entries: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto text-sm space-y-1">
      {entries.length === 0 ? (
        <p className="text-gray-500">No messages yet...</p>
      ) : (
        entries.map((entry, i) => (
          <p key={i}>
            <span className="text-gray-500">[{entry.timestamp}]</span>{' '}
            <span className={entry.isSelf ? 'text-indigo-400' : 'text-emerald-400'}>
              {entry.sender}:
            </span>{' '}
            <span className="text-gray-200">{entry.text}</span>
          </p>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function RoleSelector({
  playerName,
  setPlayerName,
  hostIdInput,
  setHostIdInput,
  onHost,
  onJoin,
}: {
  playerName: string;
  setPlayerName: (v: string) => void;
  hostIdInput: string;
  setHostIdInput: (v: string) => void;
  onHost: () => void;
  onJoin: () => void;
}) {
  return (
    <div className="space-y-6 max-w-md">
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Name</h2>
        <input
          type="text"
          placeholder="Enter your display name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={20}
        />
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Create a Game (Host)</h2>
        <button
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-40"
          disabled={!playerName.trim()}
          onClick={onHost}
        >
          Start as Host
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
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
          disabled={!playerName.trim() || !hostIdInput.trim()}
          onClick={onJoin}
        >
          Connect to Host
        </button>
      </div>
    </div>
  );
}

function HostPanel({
  playerName,
  appendLog,
}: {
  playerName: string;
  appendLog: (sender: string, text: string, isSelf?: boolean) => void;
}) {
  const { peer, peerId, error, isReady } = usePeer();
  const [testMsg, setTestMsg] = useState('');
  const [peerNames, setPeerNames] = useState<Map<string, string>>(new Map());

  const handleMessage = (msg: PeerMessage, senderId: string) => {
    if (msg.type === 'chat') {
      appendLog(msg.payload.senderName, msg.payload.text);
      const fwd = createMessage('chat', msg.payload);
      hostManagerRef.current?.broadcast(fwd);
    } else if (msg.type === 'player_join') {
      setPeerNames((prev) => new Map(prev).set(senderId, msg.payload.name));
      appendLog('System', `${msg.payload.name} joined`);
    }
  };

  const { connectedPeers, broadcast, hostManager } = useHost(peer, handleMessage);
  const hostManagerRef = useRef(hostManager);
  hostManagerRef.current = hostManager;

  if (error) {
    return <p className="text-red-400">Error: {error}</p>;
  }

  if (!isReady) {
    return <p className="text-yellow-400">Connecting to PeerJS server...</p>;
  }

  const handleSend = () => {
    if (!testMsg.trim()) return;
    const msg = createMessage('chat', {
      senderId: peerId!,
      senderName: playerName,
      text: testMsg,
    });
    broadcast(msg);
    appendLog(playerName, testMsg, true);
    setTestMsg('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-400">
          Playing as: <span className="text-indigo-400 font-medium">{playerName}</span>
        </p>
        <p className="text-sm text-gray-400 mt-1">Your Peer ID (share with clients):</p>
        <p className="text-lg font-mono text-indigo-400 select-all">{peerId}</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">
          Connected players: {connectedPeers.length}
        </p>
        {connectedPeers.length === 0 ? (
          <p className="text-gray-500 text-sm">Waiting for players to join...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {connectedPeers.map((id) => (
              <span
                key={id}
                className="inline-block bg-gray-800 rounded px-3 py-1 text-sm"
              >
                {peerNames.get(id) ?? id.slice(0, 8)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          placeholder="Type a message..."
          value={testMsg}
          onChange={(e) => setTestMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-40"
          disabled={!testMsg.trim() || connectedPeers.length === 0}
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ClientPanel({
  playerName,
  hostId,
  appendLog,
}: {
  playerName: string;
  hostId: string;
  appendLog: (sender: string, text: string, isSelf?: boolean) => void;
}) {
  const { peer, peerId, error: peerError, isReady } = usePeer();
  const [testMsg, setTestMsg] = useState('');
  const sentJoinRef = useRef(false);

  const handleMessage = (msg: PeerMessage) => {
    if (msg.type === 'chat') {
      if (msg.payload.senderId === peerId) return;
      appendLog(msg.payload.senderName, msg.payload.text);
    }
  };

  const { status, send } = useClient(isReady ? peer : null, hostId, handleMessage);

  useEffect(() => {
    if (status === 'connected' && peerId && !sentJoinRef.current) {
      sentJoinRef.current = true;
      send(createMessage('player_join', { playerId: peerId, name: playerName }));
    }
  }, [status, peerId, playerName, send]);

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

  const handleSend = () => {
    if (!testMsg.trim()) return;
    const msg = createMessage('chat', {
      senderId: peerId!,
      senderName: playerName,
      text: testMsg,
    });
    send(msg);
    appendLog(playerName, testMsg, true);
    setTestMsg('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-400">
          Playing as: <span className="text-emerald-400 font-medium">{playerName}</span>
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Connection to host:{' '}
          <span className={statusColors[status] ?? 'text-gray-400'}>{status}</span>
        </p>
      </div>

      {status === 'connected' && (
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Type a message..."
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-40"
            disabled={!testMsg.trim()}
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
