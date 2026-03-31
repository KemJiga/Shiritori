import type { GameSettings, GameState, Player } from '../game/types';

export type GameAction =
  | { type: 'INIT_STATE'; payload: GameState }
  | { type: 'ADD_PLAYER'; payload: { id: string; name: string } }
  | { type: 'REMOVE_PLAYER'; payload: { id: string } }
  | { type: 'PLAYER_DISCONNECTED'; payload: { id: string } }
  | { type: 'PLAYER_RECONNECTED'; payload: { id: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'START_GAME' }
  | { type: 'SUBMIT_WORD'; payload: { playerId: string; word: string } }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'SYNC_STATE'; payload: GameState }
  | { type: 'SET_PLAYERS'; payload: Player[] };
