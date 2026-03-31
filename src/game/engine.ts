import type { GameState } from './types';
import type { GameAction } from '../store/actions';
import { validateWord } from './validation';

export interface SubmitWordResult {
  newState: GameState;
  error?: string;
}

export function processWord(state: GameState, playerId: string, word: string): SubmitWordResult {
  const trimmed = word.trim().toLowerCase();

  const validation = validateWord(
    trimmed,
    state.lastWord,
    state.wordHistory.map((w) => w.word),
    state.settings.maxWordLength,
  );

  if (!validation.valid) {
    return { newState: state, error: validation.error };
  }

  const currentTurnPlayerId = state.turnOrder[state.currentTurnIndex];
  if (playerId !== currentTurnPlayerId) {
    return { newState: state, error: 'Not your turn' };
  }

  const newWordEntry = { word: trimmed, playerId, timestamp: Date.now() };
  const newPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, score: p.score + trimmed.length } : p,
  );

  const winner = newPlayers.find(
    (p) => state.settings.mode === 'score' && p.score >= state.settings.targetScore,
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

  const activePlayers = state.turnOrder.filter(
    (id) => !state.eliminatedPlayers.includes(id),
  );
  const nextIndex = (state.currentTurnIndex + 1) % activePlayers.length;

  return {
    newState: {
      ...state,
      players: newPlayers,
      wordHistory: [...state.wordHistory, newWordEntry],
      lastWord: trimmed,
      currentTurnIndex: nextIndex,
      turnDeadline: null,
    },
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
      return {
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
    }

    case 'SUBMIT_WORD': {
      const result = processWord(state, action.payload.playerId, action.payload.word);
      return result.newState;
    }

    case 'TIMER_EXPIRED':
      return state;

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
