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
    <div className="min-h-screen bg-gray-950 flex flex-col animate-fade-in">
      <header className="border-b border-gray-800/60 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold tracking-tight">Shiritori</h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs sm:text-sm text-gray-500">
            {isSurvival ? 'Survival' : 'Score'}
            {!isSurvival && <span className="hidden sm:inline"> &middot; Target: {state.settings.targetScore}</span>}
          </span>
          {isHost && onEndGame && (
            <button
              onClick={onEndGame}
              className="px-3 py-1.5 text-xs sm:text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all duration-150 active:scale-[0.97]"
            >
              End Game
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <aside className="lg:w-64 xl:w-72 border-b lg:border-b-0 lg:border-r border-gray-800/60 p-3 sm:p-4 overflow-y-auto shrink-0">
          <ScoreBoard
            players={state.players}
            settings={state.settings}
            currentTurnPlayerId={currentTurnPlayerId}
            localPlayerId={localPlayerId}
          />
        </aside>

        <main className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden min-w-0">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold transition-colors ${
                  isMyTurn ? 'text-indigo-400' : 'text-gray-400'
                }`}
                role="status"
                aria-live="polite"
              >
                {isMyTurn ? "Your turn!" : `${currentPlayerName}'s turn`}
              </p>
              {state.lastWord && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  Last: <span className="text-gray-400 font-mono">{state.lastWord}</span>
                  {' '}&#8594; start with{' '}
                  <span className="text-indigo-400 font-bold text-sm">
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

          <div className="border-t border-gray-800/60 pt-3 sm:pt-4 mt-3 sm:mt-4 shrink-0">
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
