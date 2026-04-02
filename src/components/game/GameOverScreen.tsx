import type { Player, GameSettings } from '../../game/types';

/** Rematch UI is off until the flow is ready; keep button markup below. */
const REMATCH_UI_ENABLED = false;

interface GameOverScreenProps {
  players: Player[];
  settings: GameSettings;
  winnerId: string | null;
  lastWord: string | null;
  localPlayerId: string;
  isHost: boolean;
  onBackToLobby: () => void;
  onBackToWaiting?: () => void;
  onRematch?: () => void;
}

const podiumColors = [
  'from-yellow-500/20 to-yellow-600/5 ring-yellow-500/30',
  'from-gray-400/15 to-gray-500/5 ring-gray-400/20',
  'from-amber-600/15 to-amber-700/5 ring-amber-600/20',
];

export function GameOverScreen({
  players,
  settings,
  winnerId,
  lastWord,
  localPlayerId,
  isHost,
  onBackToLobby,
  onBackToWaiting,
  onRematch,
}: GameOverScreenProps) {
  const winner = players.find((p) => p.id === winnerId);
  const isLocalWinner = winnerId === localPlayerId;
  const sorted = [...players].sort((a, b) => {
    if (settings.mode === 'survival') return b.lives - a.lives;
    return b.score - a.score;
  });

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md text-center space-y-8 animate-scale-in">
        <div>
          <div className="animate-pop-in">
            <span className="text-5xl block mb-3" role="img" aria-hidden="true">
              {isLocalWinner ? '🎉' : '🏁'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Game Over</h1>
          {winner && (
            <p className="text-xl mt-2 animate-fade-in stagger-2">
              {isLocalWinner ? (
                <span className="text-indigo-400 font-bold">You won!</span>
              ) : (
                <>
                  <span className="text-indigo-400 font-bold">{winner.name}</span>{' '}
                  <span className="text-gray-400">wins!</span>
                </>
              )}
            </p>
          )}
          {lastWord && (
            <p className="text-sm text-gray-500 mt-3 animate-fade-in stagger-2">
              Winning word:{' '}
              <span className="text-gray-200 font-mono font-semibold">{lastWord}</span>
            </p>
          )}
        </div>

        <div className="bg-gray-900/80 rounded-xl p-5 border border-gray-800/60 text-left animate-slide-up stagger-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Final Standings
          </h2>
          <ul className="space-y-2" role="list">
            {sorted.map((player, i) => (
              <li
                key={player.id}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 ${
                  player.id === winnerId
                    ? `bg-gradient-to-r ${podiumColors[0]} ring-1`
                    : i < 3
                      ? `bg-gradient-to-r ${podiumColors[i] ?? ''} ring-1`
                      : 'bg-gray-800/60'
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className={`text-lg font-bold w-7 text-center ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 font-medium truncate">
                  {player.name}
                  {player.id === localPlayerId && (
                    <span className="text-xs text-gray-500 ml-1.5">(you)</span>
                  )}
                </span>
                <span className="font-mono text-sm text-gray-400">
                  {settings.mode === 'score'
                    ? `${player.score} pts`
                    : `${player.lives} lives`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 animate-fade-in stagger-3">
          {REMATCH_UI_ENABLED && isHost && onRematch && (
            <button
              onClick={onRematch}
              className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl font-semibold text-lg transition-all duration-150 shadow-lg shadow-indigo-600/20"
            >
              Rematch
            </button>
          )}
          {isHost && onBackToWaiting && (
            <button
              onClick={onBackToWaiting}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 border border-gray-700 rounded-xl font-medium transition-all duration-150 active:scale-[0.98]"
            >
              Play Again
            </button>
          )}
          {!isHost && (
            <p className="text-gray-500 text-sm py-2">
              Waiting for host to start a new game...
            </p>
          )}
          <button
            onClick={onBackToLobby}
            className="w-full px-6 py-3 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 rounded-xl font-medium transition-all duration-150 active:scale-[0.98]"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
