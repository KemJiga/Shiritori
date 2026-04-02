import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { LobbyPage } from './components/lobby/LobbyPage';
import { WaitingRoom } from './components/room/WaitingRoom';
import { GameBoard } from './components/game/GameBoard';
import { GameOverScreen } from './components/game/GameOverScreen';
import { ToastContainer, useToast } from './components/shared/Toast';
import { GameProvider, useGame } from './store/GameContext';
import { usePeer } from './network/hooks/usePeer';
import { useHost } from './network/hooks/useHost';
import { useClient } from './network/hooks/useClient';
import { createMessage } from './network/protocol';
import type { PeerMessage } from './network/protocol';
import type { GameSettings } from './game/types';
import { processWord, processTimerExpired, gameReducer } from './game/engine';
import { destroyPeer } from './network/peer';
import { useClientPlayerLeaveOnUnload } from './network/hooks/useGracefulPeerDisconnect';
import { Footer } from './components/shared/Footer';
import { buildInviteUrl } from './utils/id';
import type { GameSessionLocationState } from './navigation';

type AppScreen = 'lobby' | 'connecting' | 'waiting' | 'playing' | 'finished';

function LobbyLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function GameSessionLayout() {
  return (
    <div className="h-screen min-h-0 bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function HostSessionRoute() {
  const { gameId } = useParams();
  const location = useLocation();
  const state = location.state as GameSessionLocationState | null;

  if (!gameId || !state?.playerName) {
    return <Navigate to="/" replace />;
  }

  return (
    <GameProvider gameId={gameId} hostId={gameId}>
      <HostSession gameId={gameId} playerName={state.playerName} />
    </GameProvider>
  );
}

function ClientSessionRoute() {
  const { gameId } = useParams();
  const location = useLocation();
  const state = location.state as GameSessionLocationState | null;

  if (!gameId || !state?.playerName) {
    return <Navigate to="/" replace />;
  }

  return (
    <GameProvider gameId={gameId} hostId={gameId}>
      <ClientSession gameId={gameId} playerName={state.playerName} />
    </GameProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LobbyLayout />}>
        <Route index element={<LobbyPage />} />
      </Route>
      <Route path="/game/:gameId" element={<GameSessionLayout />}>
        <Route path="host" element={<HostSessionRoute />} />
        <Route path="join" element={<ClientSessionRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Host Session ───────────────────────────────────────────────────────────

function HostSession({ gameId, playerName }: { gameId: string; playerName: string }) {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<AppScreen>('connecting');
  const { peer, peerId, error, isReady } = usePeer(gameId);
  const { state, dispatch } = useGame();
  const stateRef = useRef(state);
  stateRef.current = state;
  const [moveError, setMoveError] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const sendToRef = useRef<(peerId: string, msg: PeerMessage) => void>(() => {});

  const hostCallbacks = useMemo(
    () => ({
      onMessage: (msg: PeerMessage, senderId: string) => {
        switch (msg.type) {
          case 'player_join': {
            if (stateRef.current.phase === 'playing') {
              sendToRef.current(senderId, createMessage('error', { message: 'Game already in progress' }));
              break;
            }
            dispatch({ type: 'ADD_PLAYER', payload: { id: senderId, name: msg.payload.name } });
            addToast(`${msg.payload.name} joined`, 'info');
            break;
          }
          case 'player_leave': {
            dispatch({ type: 'PLAYER_LEFT', payload: { id: senderId } });
            break;
          }
          case 'move': {
            const result = processWord(stateRef.current, senderId, msg.payload.word);
            if (result.error) {
              sendToRef.current(senderId, createMessage('error', { message: result.error }));
            } else {
              dispatch({ type: 'SYNC_STATE', payload: result.newState });
            }
            break;
          }
          default:
            break;
        }
      },
      onPeerDisconnected: (disconnectedId: string) => {
        const player = stateRef.current.players.find((p) => p.id === disconnectedId);
        if (player) addToast(`${player.name} left`, 'error');

        dispatch({ type: 'PLAYER_LEFT', payload: { id: disconnectedId } });
      },
    }),
    [dispatch, addToast],
  );

  const { broadcast, sendTo } = useHost(peer, hostCallbacks);
  const broadcastRef = useRef(broadcast);
  broadcastRef.current = broadcast;
  sendToRef.current = sendTo;

  const hostLeaveAndBroadcast = useCallback(() => {
    if (!peerId) return;
    const next = gameReducer(stateRef.current, {
      type: 'PLAYER_LEFT',
      payload: { id: peerId },
    });
    dispatch({ type: 'SYNC_STATE', payload: next });
    broadcastRef.current(createMessage('state_sync', { state: next }));
  }, [peerId, dispatch]);

  const onLeave = useCallback(() => {
    hostLeaveAndBroadcast();
    navigate('/', { replace: true });
  }, [hostLeaveAndBroadcast, navigate]);

  useEffect(() => {
    if (!peer || !peerId) return;

    const run = () => {
      if (peer.destroyed) return;
      hostLeaveAndBroadcast();
      destroyPeer(peer);
    };

    window.addEventListener('pagehide', run);
    return () => window.removeEventListener('pagehide', run);
  }, [peer, peerId, hostLeaveAndBroadcast]);

  useEffect(() => {
    if (isReady && peerId) {
      dispatch({ type: 'ADD_PLAYER', payload: { id: peerId, name: playerName } });
      setScreen('waiting');
    }
  }, [isReady, peerId, playerName, dispatch]);

  useEffect(() => {
    if (state.phase !== 'lobby') {
      broadcastRef.current(createMessage('state_sync', { state }));
    }
    if (state.phase === 'waiting') setScreen('waiting');
    if (state.phase === 'playing') setScreen('playing');
    if (state.phase === 'finished') setScreen('finished');
  }, [state]);

  useEffect(() => {
    if (
      state.phase !== 'playing' ||
      state.settings.mode !== 'survival' ||
      !state.turnDeadline
    ) {
      return;
    }

    const check = () => {
      if (Date.now() >= (stateRef.current.turnDeadline ?? Infinity)) {
        const newState = processTimerExpired(stateRef.current);
        if (newState !== stateRef.current) {
          dispatch({ type: 'SYNC_STATE', payload: newState });
        }
      }
    };

    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, [state.phase, state.settings.mode, state.turnDeadline, dispatch]);

  const handleUpdateSettings = useCallback(
    (patch: Partial<GameSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: patch });
    },
    [dispatch],
  );

  const handleStartGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, [dispatch]);

  const handleEndGame = useCallback(() => {
    dispatch({ type: 'RESET_TO_WAITING' });
  }, [dispatch]);

  const handleHostSubmitWord = useCallback(
    (word: string) => {
      if (!peerId) return;
      const result = processWord(stateRef.current, peerId, word);
      if (result.error) {
        setMoveError(result.error);
      } else {
        setMoveError(null);
        dispatch({ type: 'SYNC_STATE', payload: result.newState });
      }
    },
    [peerId, dispatch],
  );

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
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
      <div className="flex-1 flex items-center justify-center">
        <p className="text-yellow-400 text-lg animate-pulse">Creating game...</p>
      </div>
    );
  }

  const sessionScrollClass =
    screen === 'playing' ? 'overflow-hidden' : 'overflow-y-auto';

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${sessionScrollClass}`}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {screen === 'waiting' && (
        <WaitingRoom
          gameId={gameId}
          inviteUrl={buildInviteUrl(gameId)}
          players={state.players}
          settings={state.settings}
          localPlayerId={peerId}
          isHost={true}
          onStartGame={handleStartGame}
          onLeave={onLeave}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {screen === 'playing' && (
        <GameBoard
          state={state}
          localPlayerId={peerId}
          isHost={true}
          moveError={moveError}
          onSubmitWord={handleHostSubmitWord}
          onEndGame={handleEndGame}
        />
      )}

      {screen === 'finished' && (
        <GameOverScreen
          players={state.players}
          settings={state.settings}
          winnerId={state.winner}
          lastWord={state.lastWord}
          localPlayerId={peerId}
          isHost={true}
          onBackToLobby={onLeave}
          onBackToWaiting={handleEndGame}
          onRematch={handleStartGame}
        />
      )}
    </div>
  );
}

// ─── Client Session ─────────────────────────────────────────────────────────

function ClientSession({ gameId, playerName }: { gameId: string; playerName: string }) {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<AppScreen>('connecting');
  const { peer, peerId, error: peerError, isReady } = usePeer();
  const { state, dispatch } = useGame();
  const sentJoinRef = useRef(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const { toasts, removeToast } = useToast();

  const handleMessage = useCallback(
    (msg: PeerMessage) => {
      switch (msg.type) {
        case 'state_sync':
          dispatch({ type: 'SYNC_STATE', payload: msg.payload.state });
          if (msg.payload.state.phase === 'waiting') setScreen('waiting');
          else if (msg.payload.state.phase === 'playing') setScreen('playing');
          else if (msg.payload.state.phase === 'finished') setScreen('finished');
          break;
        case 'error':
          setMoveError(msg.payload.message);
          break;
        default:
          break;
      }
    },
    [dispatch],
  );

  const { status, send } = useClient(
    isReady ? peer : null,
    gameId,
    handleMessage,
  );
  const sendRef = useRef(send);
  sendRef.current = send;

  useClientPlayerLeaveOnUnload(peer, peerId, sendRef);

  const notifyLeave = useCallback(() => {
    if (!peerId) return;
    try {
      sendRef.current(createMessage('player_leave', { playerId: peerId }));
    } catch {
      /* ignore */
    }
  }, [peerId]);

  const onLeave = useCallback(() => {
    notifyLeave();
    navigate('/', { replace: true });
  }, [notifyLeave, navigate]);

  useEffect(() => {
    if (status === 'disconnected' || status === 'failed') {
      if (sentJoinRef.current) {
        onLeave();
      }
    }
  }, [status, onLeave]);

  useEffect(() => {
    if (status === 'connected' && peerId && !sentJoinRef.current) {
      sentJoinRef.current = true;
      send(createMessage('player_join', { playerId: peerId, name: playerName }));
    }
  }, [status, peerId, playerName, send]);

  const handleClientSubmitWord = useCallback(
    (word: string) => {
      if (!peerId) return;
      setMoveError(null);
      sendRef.current(createMessage('move', { playerId: peerId, word }));
    },
    [peerId],
  );

  if (peerError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
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
      <div className="flex-1 flex items-center justify-center p-6">
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

  if (!peerId) return null;

  const clientSessionScrollClass =
    screen === 'playing' ? 'overflow-hidden' : 'overflow-y-auto';

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${clientSessionScrollClass}`}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {screen === 'waiting' && (
        <WaitingRoom
          gameId={gameId}
          inviteUrl={buildInviteUrl(gameId)}
          players={state.players}
          settings={state.settings}
          localPlayerId={peerId}
          isHost={false}
          onStartGame={() => {}}
          onLeave={onLeave}
          onUpdateSettings={() => {}}
        />
      )}

      {screen === 'playing' && (
        <GameBoard
          state={state}
          localPlayerId={peerId}
          isHost={false}
          moveError={moveError}
          onSubmitWord={handleClientSubmitWord}
        />
      )}

      {screen === 'finished' && (
        <GameOverScreen
          players={state.players}
          settings={state.settings}
          winnerId={state.winner}
          lastWord={state.lastWord}
          localPlayerId={peerId}
          isHost={false}
          onBackToLobby={onLeave}
        />
      )}
    </div>
  );
}

export default App;
