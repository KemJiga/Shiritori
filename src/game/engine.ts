import type { GameState } from './types';
import type { GameAction } from '../store/actions';

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

    case 'SUBMIT_WORD':
    case 'TIMER_EXPIRED':
      // Phase 5/6 will implement these
      return state;

    case 'SET_PLAYERS':
      return { ...state, players: action.payload };

    default:
      return state;
  }
}
