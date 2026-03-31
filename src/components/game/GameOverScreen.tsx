import type { Player, GameSettings } from '../../game/types';

interface GameOverScreenProps {
  players: Player[];
  settings: GameSettings;
  winnerId: string | null;
  localPlayerId: string;
  isHost: boolean;
  onBackToLobby: () => void;
  onBackToWaiting?: () => void;
}

export function GameOverScreen({
  players,
  settings,
  winnerId,
  localPlayerId,
  isHost,
  onBackToLobby,
  onBackToWaiting,
}: GameOverScreenProps) {
  const winner = players.find((p) => p.id === winnerId);
  const isLocalWinner = winnerId === localPlayerId;
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Game Over</h1>
          {winner && (
            <p className="text-xl">
              {isLocalWinner ? (
                <span className="text-indigo-400">You won!</span>
              ) : (
                <>
                  <span className="text-indigo-400 font-semibold">
                    {winner.name}
                  </span>{' '}
                  wins!
                </>
              )}
            </p>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl p-5 text-left">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Final Standings
          </h2>
          <div className="space-y-2">
            {sorted.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                  player.id === winnerId
                    ? 'bg-indigo-600/20 ring-1 ring-indigo-500/50'
                    : 'bg-gray-800'
                }`}
              >
                <span className="text-lg font-bold text-gray-500 w-6">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium">
                  {player.name}
                  {player.id === localPlayerId && (
                    <span className="text-xs text-gray-500 ml-1">(you)</span>
                  )}
                </span>
                <span className="font-mono text-sm">
                  {settings.mode === 'score'
                    ? `${player.score} pts`
                    : `${player.lives} lives`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {isHost && onBackToWaiting && (
            <button
              onClick={onBackToWaiting}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-lg transition-colors"
            >
              Play Again
            </button>
          )}
          {!isHost && (
            <p className="text-gray-400 text-sm">
              Waiting for host to start a new game...
            </p>
          )}
          <button
            onClick={onBackToLobby}
            className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
