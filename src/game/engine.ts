import type { GameState } from './types';
import type { GameAction } from '../store/actions';
import { validateWord } from './validation';

export interface SubmitWordResult {
  newState: GameState;
  error?: string;
}

function getNextTurnIndex(state: GameState): number {
  const activeTurnOrder = state.turnOrder.filter(
    (id) => !state.eliminatedPlayers.includes(id),
  );
  if (activeTurnOrder.length === 0) return 0;

  const currentId = state.turnOrder[state.currentTurnIndex];
  const currentActiveIdx = activeTurnOrder.indexOf(currentId);
  const nextActiveIdx = (currentActiveIdx + 1) % activeTurnOrder.length;
  const nextId = activeTurnOrder[nextActiveIdx];

  return state.turnOrder.indexOf(nextId);
}

function computeDeadline(state: GameState): number | null {
  if (state.settings.mode === 'survival') {
    return Date.now() + state.settings.turnTimerSeconds * 1000;
  }
  return null;
}

function checkSurvivalWinner(state: GameState): string | null {
  const alive = state.players.filter(
    (p) => !state.eliminatedPlayers.includes(p.id) && p.status !== 'eliminated',
  );
  if (alive.length === 1) return alive[0].id;
  return null;
}

export function processWord(state: GameState, playerId: string, word: string): SubmitWordResult {
  const trimmed = word.trim().toLowerCase();

  const validation = validateWord(
    trimmed,
    state.lastWord,
    state.wordHistory.map((w) => w.word),
    state.settings.maxWordLength,
    state.settings.language,
  );

  if (!validation.valid) {
    return { newState: state, error: validation.error };
  }

  const currentTurnPlayerId = state.turnOrder[state.currentTurnIndex];
  if (playerId !== currentTurnPlayerId) {
    return { newState: state, error: 'Not your turn' };
  }

  const newWordEntry = { word: trimmed, playerId, timestamp: Date.now() };

  if (state.settings.mode === 'score') {
    const newPlayers = state.players.map((p) =>
      p.id === playerId ? { ...p, score: p.score + trimmed.length } : p,
    );

    const winner = newPlayers.find(
      (p) => p.score >= state.settings.targetScore,
    );

    if (winner) {
      return {
        newState: {
          ...state,
          players: newPlayers,
          wordHistory: [...state.wordHistory, newWordEntry],
          lastWord: trimmed,
          phase: 'finished',
          winner: winner.id,
        },
      };
    }

    const nextState = {
      ...state,
      players: newPlayers,
      wordHistory: [...state.wordHistory, newWordEntry],
      lastWord: trimmed,
    };
    const nextIndex = getNextTurnIndex(nextState);

    return {
      newState: {
        ...nextState,
        currentTurnIndex: nextIndex,
        turnDeadline: null,
      },
    };
  }

  // Survival mode: valid word just advances the turn and resets timer
  const nextState = {
    ...state,
    wordHistory: [...state.wordHistory, newWordEntry],
    lastWord: trimmed,
  };
  const nextIndex = getNextTurnIndex(nextState);

  return {
    newState: {
      ...nextState,
      currentTurnIndex: nextIndex,
      turnDeadline: computeDeadline(nextState),
    },
  };
}

export function processTimerExpired(state: GameState): GameState {
  if (state.phase !== 'playing' || state.settings.mode !== 'survival') return state;

  const currentPlayerId = state.turnOrder[state.currentTurnIndex];
  if (!currentPlayerId) return state;

  const newPlayers = state.players.map((p) =>
    p.id === currentPlayerId ? { ...p, lives: p.lives - 1 } : p,
  );

  const eliminatedPlayer = newPlayers.find((p) => p.id === currentPlayerId && p.lives <= 0);
  const newEliminated = eliminatedPlayer
    ? [...state.eliminatedPlayers, currentPlayerId]
    : state.eliminatedPlayers;

  const newPlayersWithStatus = newPlayers.map((p) =>
    newEliminated.includes(p.id) ? { ...p, status: 'eliminated' as const } : p,
  );

  const intermediateState: GameState = {
    ...state,
    players: newPlayersWithStatus,
    eliminatedPlayers: newEliminated,
  };

  const winner = checkSurvivalWinner(intermediateState);
  if (winner) {
    return {
      ...intermediateState,
      phase: 'finished',
      winner,
      turnDeadline: null,
    };
  }

  const nextIndex = getNextTurnIndex(intermediateState);

  return {
    ...intermediateState,
    currentTurnIndex: nextIndex,
    turnDeadline: computeDeadline(intermediateState),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_STATE':
      return action.payload;

    case 'SYNC_STATE':
      return action.payload;

    case 'ADD_PLAYER': {
      if (state.players.some((p) => p.id === action.payload.id)) return state;
      return {
        ...state,
        players: [
          ...state.players,
          {
            id: action.payload.id,
            name: action.payload.name,
            score: 0,
            lives: state.settings.initialLives,
            status: 'connected',
          },
        ],
      };
    }

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.payload.id),
      };

    case 'PLAYER_DISCONNECTED':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.id ? { ...p, status: 'disconnected' as const } : p,
        ),
      };

    case 'PLAYER_RECONNECTED':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.id ? { ...p, status: 'connected' as const } : p,
        ),
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'START_GAME': {
      const activePlayers = state.players.filter((p) => p.status === 'connected');
      const newState: GameState = {
        ...state,
        phase: 'playing',
        turnOrder: activePlayers.map((p) => p.id),
        currentTurnIndex: 0,
        wordHistory: [],
        lastWord: null,
        eliminatedPlayers: [],
        winner: null,
        players: state.players.map((p) => ({
          ...p,
          score: 0,
          lives: state.settings.initialLives,
        })),
      };
      return {
        ...newState,
        turnDeadline: state.settings.mode === 'survival'
          ? Date.now() + state.settings.turnTimerSeconds * 1000
          : null,
      };
    }

    case 'SUBMIT_WORD': {
      const result = processWord(state, action.payload.playerId, action.payload.word);
      return result.newState;
    }

    case 'TIMER_EXPIRED':
      return processTimerExpired(state);

    case 'RESET_TO_WAITING':
      return {
        ...state,
        phase: 'waiting',
        turnOrder: [],
        currentTurnIndex: 0,
        wordHistory: [],
        lastWord: null,
        turnDeadline: null,
        eliminatedPlayers: [],
        winner: null,
        players: state.players.map((p) => ({
          ...p,
          score: 0,
          lives: state.settings.initialLives,
          status: p.status === 'eliminated' ? 'connected' as const : p.status,
        })),
      };

    case 'SET_PLAYERS':
      return { ...state, players: action.payload };

    default:
      return state;
  }
}
