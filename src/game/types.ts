export type GameMode = 'score' | 'survival';
export type GamePhase = 'lobby' | 'waiting' | 'playing' | 'finished';
export type PlayerStatus = 'connected' | 'disconnected' | 'eliminated';

export interface Player {
  id: string;
  name: string;
  score: number;
  lives: number;
  status: PlayerStatus;
}

export interface GameSettings {
  mode: GameMode;
  targetScore: number;
  maxWordLength: number;
  initialLives: number;
  turnTimerSeconds: number;
}

export interface GameState {
  gameId: string;
  hostId: string;
  phase: GamePhase;
  settings: GameSettings;
  players: Player[];
  turnOrder: string[];
  currentTurnIndex: number;
  wordHistory: WordEntry[];
  lastWord: string | null;
  turnDeadline: number | null;
  eliminatedPlayers: string[];
  winner: string | null;
}

export interface WordEntry {
  word: string;
  playerId: string;
  timestamp: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'score',
  targetScore: 100,
  maxWordLength: 0,
  initialLives: 3,
  turnTimerSeconds: 15,
};

export function createInitialGameState(
  gameId: string,
  hostId: string,
): GameState {
  return {
    gameId,
    hostId,
    phase: 'waiting',
    settings: { ...DEFAULT_SETTINGS },
    players: [],
    turnOrder: [],
    currentTurnIndex: 0,
    wordHistory: [],
    lastWord: null,
    turnDeadline: null,
    eliminatedPlayers: [],
    winner: null,
  };
}
