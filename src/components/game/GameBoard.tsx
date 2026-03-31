import { ScoreBoard } from './ScoreBoard';
import { WordHistory } from './WordHistory';
import { TurnInput } from './TurnInput';
import { TimerDisplay } from './TimerDisplay';
import type { GameState } from '../../game/types';

interface GameBoardProps {
  state: GameState;
  localPlayerId: string;
  isHost: boolean;
  moveError: string | null;
  onSubmitWord: (word: string) => void;
  onEndGame?: () => void;
}

export function GameBoard({
  state,
  localPlayerId,
  isHost,
  moveError,
  onSubmitWord,
  onEndGame,
}: GameBoardProps) {
  const currentTurnPlayerId = state.turnOrder[state.currentTurnIndex] ?? '';
  const isMyTurn = currentTurnPlayerId === localPlayerId;
  const currentPlayerName =
    state.players.find((p) => p.id === currentTurnPlayerId)?.name ?? '...';
  const isSurvival = state.settings.mode === 'survival';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Shiritori</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {isSurvival ? 'Survival Mode' : 'Score Mode'}
            {!isSurvival && <> &middot; Target: {state.settings.targetScore}</>}
          </span>
          {isHost && onEndGame && (
            <button
              onClick={onEndGame}
              className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
            >
              End Game
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-800 p-4 overflow-y-auto">
          <ScoreBoard
            players={state.players}
            settings={state.settings}
            currentTurnPlayerId={currentTurnPlayerId}
            localPlayerId={localPlayerId}
          />
        </aside>

        <main className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-medium ${isMyTurn ? 'text-indigo-400' : 'text-gray-400'}`}>
                {isMyTurn ? "Your turn!" : `${currentPlayerName}'s turn`}
              </p>
              {state.lastWord && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Last word: <span className="text-gray-300 font-mono">{state.lastWord}</span>
                  {' '}&rarr; next word must start with{' '}
                  <span className="text-indigo-400 font-bold">
                    {state.lastWord[state.lastWord.length - 1].toUpperCase()}
                  </span>
                </p>
              )}
            </div>
            {isSurvival && (
              <TimerDisplay
                deadline={state.turnDeadline}
                totalSeconds={state.settings.turnTimerSeconds}
              />
            )}
          </div>

          <WordHistory
            wordHistory={state.wordHistory}
            players={state.players}
          />

          <div className="border-t border-gray-800 pt-4 mt-4">
            <TurnInput
              isMyTurn={isMyTurn}
              lastWord={state.lastWord}
              error={moveError}
              onSubmit={onSubmitWord}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
