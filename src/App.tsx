import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LobbyPage } from './components/lobby/LobbyPage';
import { WaitingRoom } from './components/room/WaitingRoom';
import { GameBoard } from './components/game/GameBoard';
import { GameOverScreen } from './components/game/GameOverScreen';
import { ConnectionStatus } from './components/shared/ConnectionStatus';
import { HostDisconnected } from './components/shared/HostDisconnected';
import { ToastContainer, useToast } from './components/shared/Toast';
import { GameProvider, useGame } from './store/GameContext';
import { usePeer } from './network/hooks/usePeer';
import { useHost } from './network/hooks/useHost';
import { useClient } from './network/hooks/useClient';
import { createMessage } from './network/protocol';
import type { PeerMessage } from './network/protocol';
import type { GameSettings } from './game/types';
import { processWord, processTimerExpired } from './game/engine';
import { Footer } from './components/shared/Footer';
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

  let content;

  if (screen === 'lobby' || !session) {
    content = (
      <LobbyPage onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />
    );
  } else if (session.role === 'host') {
    content = (
      <GameProvider gameId={session.gameId} hostId={session.gameId}>
        <HostSession
          session={session}
          screen={screen}
          setScreen={setScreen}
          onLeave={handleLeave}
        />
      </GameProvider>
    );
  } else {
    content = (
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col">
        {content}
      </div>
      <Footer />
    </div>
  );
}

// ─── Host Session ───────────────────────────────────────────────────────────

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
  const [moveError, setMoveError] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const sendToRef = useRef<(peerId: string, msg: PeerMessage) => void>(() => {});

  const hostCallbacks = useMemo(
    () => ({
      onMessage: (msg: PeerMessage, senderId: string) => {
        switch (msg.type) {
          case 'player_join': {
            const existing = stateRef.current.players.find((p) => p.id === senderId);
            if (existing) {
              dispatch({ type: 'PLAYER_RECONNECTED', payload: { id: senderId } });
              addToast(`${existing.name} reconnected`, 'success');
            } else {
              dispatch({ type: 'ADD_PLAYER', payload: { id: senderId, name: msg.payload.name } });
              addToast(`${msg.payload.name} joined`, 'info');
            }
            break;
          }
          case 'move': {
            const result = processWord(stateRef.current, msg.payload.playerId, msg.payload.word);
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
        dispatch({ type: 'PLAYER_DISCONNECTED', payload: { id: disconnectedId } });
        if (player) addToast(`${player.name} disconnected`, 'error');

        // If it was their turn during gameplay, skip after a short delay
        if (stateRef.current.phase === 'playing') {
          const currentTurnId = stateRef.current.turnOrder[stateRef.current.currentTurnIndex];
          if (currentTurnId === disconnectedId) {
            setTimeout(() => {
              if (stateRef.current.phase !== 'playing') return;
              const currentId = stateRef.current.turnOrder[stateRef.current.currentTurnIndex];
              if (currentId !== disconnectedId) return;

              if (stateRef.current.settings.mode === 'survival') {
                const newState = processTimerExpired(stateRef.current);
                if (newState !== stateRef.current) {
                  dispatch({ type: 'SYNC_STATE', payload: newState });
                }
              } else {
                // Score mode: skip turn
                const activeTurnOrder = stateRef.current.turnOrder.filter(
                  (id) => !stateRef.current.eliminatedPlayers.includes(id) && id !== disconnectedId,
                );
                if (activeTurnOrder.length <= 1) {
                  dispatch({
                    type: 'SYNC_STATE',
                    payload: {
                      ...stateRef.current,
                      phase: 'finished',
                      winner: activeTurnOrder[0] ?? null,
                    },
                  });
                } else {
                  const nextIdx = (stateRef.current.currentTurnIndex + 1) % stateRef.current.turnOrder.length;
                  dispatch({
                    type: 'SYNC_STATE',
                    payload: { ...stateRef.current, currentTurnIndex: nextIdx },
                  });
                }
              }
            }, 3000);
          }
        }
      },
      onPeerReconnected: (reconnectedId: string) => {
        dispatch({ type: 'PLAYER_RECONNECTED', payload: { id: reconnectedId } });
      },
    }),
    [dispatch, addToast],
  );

  const { broadcast, sendTo, setRejectNewConnections } = useHost(peer, hostCallbacks);
  const broadcastRef = useRef(broadcast);
  broadcastRef.current = broadcast;
  sendToRef.current = sendTo;

  // Reject new connections during gameplay
  useEffect(() => {
    setRejectNewConnections(state.phase === 'playing');
  }, [state.phase, setRejectNewConnections]);

  useEffect(() => {
    if (isReady && peerId) {
      dispatch({ type: 'ADD_PLAYER', payload: { id: peerId, name: session.playerName } });
      setScreen('waiting');
    }
  }, [isReady, peerId, session.playerName, dispatch, setScreen]);

  useEffect(() => {
    if (state.phase !== 'lobby') {
      broadcastRef.current(createMessage('state_sync', { state }));
    }
    if (state.phase === 'waiting') setScreen('waiting');
    if (state.phase === 'playing') setScreen('playing');
    if (state.phase === 'finished') setScreen('finished');
  }, [state, setScreen]);

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

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {screen === 'waiting' && (
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
          localPlayerId={peerId}
          isHost={true}
          onBackToLobby={onLeave}
          onBackToWaiting={handleEndGame}
          onRematch={handleStartGame}
        />
      )}
    </>
  );
}

// ─── Client Session ─────────────────────────────────────────────────────────

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
  const [moveError, setMoveError] = useState<string | null>(null);
  const [everConnected, setEverConnected] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

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
    [dispatch, setScreen],
  );

  const { status, send } = useClient(
    isReady ? peer : null,
    session.gameId,
    handleMessage,
  );
  const sendRef = useRef(send);
  sendRef.current = send;

  // Track if we ever successfully connected (to distinguish initial connect failure from host leaving)
  useEffect(() => {
    if (status === 'connected') setEverConnected(true);
  }, [status]);

  const hostLost = status === 'failed' && everConnected;

  // Auto-redirect to lobby when host disconnects
  useEffect(() => {
    if (!hostLost) return;
    const timer = setTimeout(onLeave, 5000);
    return () => clearTimeout(timer);
  }, [hostLost, onLeave]);

  // Send join on connect (and re-send on reconnect)
  useEffect(() => {
    if (status === 'connected' && peerId) {
      if (!sentJoinRef.current) {
        sentJoinRef.current = true;
      }
      send(createMessage('player_join', { playerId: peerId, name: session.playerName }));
    }
  }, [status, peerId, session.playerName, send]);

  // Tab visibility: re-check connection when coming back
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && status === 'disconnected') {
        addToast('Reconnecting...', 'info');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [status, addToast]);

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

  if (screen === 'connecting' || (status !== 'connected' && !hostLost)) {
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

  return (
    <>
      <ConnectionStatus status={status} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {hostLost && <HostDisconnected onLeave={onLeave} />}

      {screen === 'waiting' && (
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
          localPlayerId={peerId}
          isHost={false}
          onBackToLobby={onLeave}
        />
      )}
    </>
  );
}

export default App;
