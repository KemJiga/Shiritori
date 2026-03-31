import { useState, useEffect, useCallback, useRef } from 'react';
import { LobbyPage } from './components/lobby/LobbyPage';
import { WaitingRoom } from './components/room/WaitingRoom';
import { usePeer } from './network/hooks/usePeer';
import { useHost } from './network/hooks/useHost';
import { useClient } from './network/hooks/useClient';
import { createMessage } from './network/protocol';
import type { PeerMessage } from './network/protocol';
import type { Player } from './game/types';
import { generateGameId, buildInviteUrl } from './utils/id';

type AppScreen = 'lobby' | 'connecting' | 'waiting' | 'playing' | 'finished';
type Role = 'host' | 'client';

interface SessionInfo {
  role: Role;
  playerName: string;
  gameId: string;
}

function App() {
  const [screen, setScreen] = useState<AppScreen>('lobby');
  const [session, setSession] = useState<SessionInfo | null>(null);

  const handleCreateGame = useCallback((playerName: string) => {
    const gameId = generateGameId();
    setSession({ role: 'host', playerName, gameId });
    setScreen('connecting');
  }, []);

  const handleJoinGame = useCallback((playerName: string, gameId: string) => {
    setSession({ role: 'client', playerName, gameId });
    setScreen('connecting');
  }, []);

  const handleLeave = useCallback(() => {
    setSession(null);
    setScreen('lobby');
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  if (screen === 'lobby' || !session) {
    return (
      <LobbyPage onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />
    );
  }

  if (session.role === 'host') {
    return (
      <HostSession
        session={session}
        screen={screen}
        setScreen={setScreen}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <ClientSession
      session={session}
      screen={screen}
      setScreen={setScreen}
      onLeave={handleLeave}
    />
  );
}

function HostSession({
  session,
  screen,
  setScreen,
  onLeave,
}: {
  session: SessionInfo;
  screen: AppScreen;
  setScreen: (s: AppScreen) => void;
  onLeave: () => void;
}) {
  const { peer, peerId, error, isReady } = usePeer(session.gameId);
  const [players, setPlayers] = useState<Player[]>([]);
  const playersRef = useRef<Player[]>([]);

  const addPlayer = useCallback((id: string, name: string) => {
    setPlayers((prev) => {
      if (prev.some((p) => p.id === id)) return prev;
      const updated = [
        ...prev,
        { id, name, score: 0, lives: 0, status: 'connected' as const },
      ];
      playersRef.current = updated;
      return updated;
    });
  }, []);

  const handleMessage = useCallback(
    (msg: PeerMessage, senderId: string) => {
      if (msg.type === 'player_join') {
        addPlayer(senderId, msg.payload.name);
      }
    },
    [addPlayer],
  );

  const { broadcast } = useHost(peer, handleMessage);
  const broadcastRef = useRef(broadcast);
  broadcastRef.current = broadcast;

  useEffect(() => {
    if (isReady && peerId) {
      addPlayer(peerId, session.playerName);
      setScreen('waiting');
    }
  }, [isReady, peerId, session.playerName, addPlayer, setScreen]);

  useEffect(() => {
    broadcastRef.current(
      createMessage('state_sync', {
        state: {
          gameId: session.gameId,
          hostId: session.gameId,
          phase: 'waiting',
          settings: {
            mode: 'score',
            initialScore: 100,
            minWordLength: 2,
            maxWordLength: 0,
            initialLives: 3,
            turnTimerSeconds: 15,
          },
          players: playersRef.current,
          turnOrder: [],
          currentTurnIndex: 0,
          wordHistory: [],
          lastWord: null,
          turnDeadline: null,
          eliminatedPlayers: [],
          winner: null,
        },
      }),
    );
  }, [players, session.gameId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">Failed to create game: {error}</p>
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'connecting' || !peerId) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-yellow-400 text-lg animate-pulse">Creating game...</p>
      </div>
    );
  }

  if (screen === 'waiting') {
    return (
      <WaitingRoom
        gameId={session.gameId}
        inviteUrl={buildInviteUrl(session.gameId)}
        players={players}
        localPlayerId={peerId}
        isHost={true}
        onStartGame={() => {
          // Phase 5 will implement this
        }}
        onLeave={onLeave}
      />
    );
  }

  return null;
}

function ClientSession({
  session,
  screen,
  setScreen,
  onLeave,
}: {
  session: SessionInfo;
  screen: AppScreen;
  setScreen: (s: AppScreen) => void;
  onLeave: () => void;
}) {
  const { peer, peerId, error: peerError, isReady } = usePeer();
  const [players, setPlayers] = useState<Player[]>([]);
  const sentJoinRef = useRef(false);

  const handleMessage = useCallback(
    (msg: PeerMessage) => {
      if (msg.type === 'state_sync') {
        setPlayers(msg.payload.state.players);
        if (msg.payload.state.phase === 'waiting') {
          setScreen('waiting');
        }
      } else if (msg.type === 'error') {
        console.error('Host error:', msg.payload.message);
      }
    },
    [setScreen],
  );

  const { status, send } = useClient(
    isReady ? peer : null,
    session.gameId,
    handleMessage,
  );

  useEffect(() => {
    if (status === 'connected' && peerId && !sentJoinRef.current) {
      sentJoinRef.current = true;
      send(createMessage('player_join', { playerId: peerId, name: session.playerName }));
    }
  }, [status, peerId, session.playerName, send]);

  if (peerError) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">Connection error: {peerError}</p>
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'connecting' || status !== 'connected') {
    const label =
      status === 'failed'
        ? 'Could not connect to game. The game may not exist.'
        : 'Connecting to game...';

    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p
            className={`text-lg ${status === 'failed' ? 'text-red-400' : 'text-yellow-400 animate-pulse'}`}
          >
            {label}
          </p>
          {status === 'failed' && (
            <button
              onClick={onLeave}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Back to Lobby
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'waiting' && peerId) {
    return (
      <WaitingRoom
        gameId={session.gameId}
        inviteUrl={buildInviteUrl(session.gameId)}
        players={players}
        localPlayerId={peerId}
        isHost={false}
        onStartGame={() => {}}
        onLeave={onLeave}
      />
    );
  }

  return null;
}

export default App;
