import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LobbyPage } from './components/lobby/LobbyPage';
import { WaitingRoom } from './components/room/WaitingRoom';
import { GameProvider, useGame } from './store/GameContext';
import { usePeer } from './network/hooks/usePeer';
import { useHost } from './network/hooks/useHost';
import { useClient } from './network/hooks/useClient';
import { createMessage } from './network/protocol';
import type { PeerMessage } from './network/protocol';
import type { GameSettings } from './game/types';
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
      <GameProvider gameId={session.gameId} hostId={session.gameId}>
        <HostSession
          session={session}
          screen={screen}
          setScreen={setScreen}
          onLeave={handleLeave}
        />
      </GameProvider>
    );
  }

  return (
    <GameProvider gameId={session.gameId} hostId={session.gameId}>
      <ClientSession
        session={session}
        screen={screen}
        setScreen={setScreen}
        onLeave={handleLeave}
      />
    </GameProvider>
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
  const { state, dispatch } = useGame();
  const stateRef = useRef(state);
  stateRef.current = state;

  const hostCallbacks = useMemo(
    () => ({
      onMessage: (msg: PeerMessage, senderId: string) => {
        switch (msg.type) {
          case 'player_join':
            dispatch({ type: 'ADD_PLAYER', payload: { id: senderId, name: msg.payload.name } });
            break;
          case 'settings_update':
            break;
          default:
            break;
        }
      },
      onPeerDisconnected: (peerId: string) => {
        dispatch({ type: 'PLAYER_DISCONNECTED', payload: { id: peerId } });
      },
    }),
    [dispatch],
  );

  const { broadcast } = useHost(peer, hostCallbacks);
  const broadcastRef = useRef(broadcast);
  broadcastRef.current = broadcast;

  useEffect(() => {
    if (isReady && peerId) {
      dispatch({ type: 'ADD_PLAYER', payload: { id: peerId, name: session.playerName } });
      setScreen('waiting');
    }
  }, [isReady, peerId, session.playerName, dispatch, setScreen]);

  // Broadcast full state to all clients whenever state changes
  useEffect(() => {
    if (state.phase !== 'lobby') {
      broadcastRef.current(createMessage('state_sync', { state }));
    }
  }, [state]);

  const handleUpdateSettings = useCallback(
    (patch: Partial<GameSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: patch });
    },
    [dispatch],
  );

  const handleStartGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, [dispatch]);

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
        players={state.players}
        settings={state.settings}
        localPlayerId={peerId}
        isHost={true}
        onStartGame={handleStartGame}
        onLeave={onLeave}
        onUpdateSettings={handleUpdateSettings}
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
  const { state, dispatch } = useGame();
  const sentJoinRef = useRef(false);

  const handleMessage = useCallback(
    (msg: PeerMessage) => {
      switch (msg.type) {
        case 'state_sync':
          dispatch({ type: 'SYNC_STATE', payload: msg.payload.state });
          if (msg.payload.state.phase === 'waiting') {
            setScreen('waiting');
          } else if (msg.payload.state.phase === 'playing') {
            setScreen('playing');
          } else if (msg.payload.state.phase === 'finished') {
            setScreen('finished');
          }
          break;
        case 'error':
          console.error('Host error:', msg.payload.message);
          break;
        default:
          break;
      }
    },
    [dispatch, setScreen],
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
        players={state.players}
        settings={state.settings}
        localPlayerId={peerId}
        isHost={false}
        onStartGame={() => {}}
        onLeave={onLeave}
        onUpdateSettings={() => {}}
      />
    );
  }

  return null;
}

export default App;
