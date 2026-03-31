import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameState } from '../game/types';
import { createInitialGameState } from '../game/types';
import type { GameAction } from './actions';
import { gameReducer } from '../game/engine';

interface GameContextValue {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  gameId: string;
  hostId: string;
  children: ReactNode;
}

export function GameProvider({ gameId, hostId, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { gameId, hostId },
    ({ gameId, hostId }) => createInitialGameState(gameId, hostId),
  );

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be used within GameProvider');
  return ctx.state;
}

export function useGameDispatch(): (action: GameAction) => void {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider');
  return ctx.dispatch;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
