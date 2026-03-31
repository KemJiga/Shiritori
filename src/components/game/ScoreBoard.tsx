import type { Player, GameSettings } from '../../game/types';

interface ScoreBoardProps {
  players: Player[];
  settings: GameSettings;
  currentTurnPlayerId: string;
  localPlayerId: string;
}

const rankColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];

export function ScoreBoard({
  players,
  settings,
  currentTurnPlayerId,
  localPlayerId,
}: ScoreBoardProps) {
  const sorted = [...players].sort((a, b) => {
    if (settings.mode === 'survival') return b.lives - a.lives;
    return b.score - a.score;
  });

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
        Scoreboard
      </h2>
      <ul className="space-y-1.5" role="list">
        {sorted.map((player, i) => {
          const isCurrentTurn = player.id === currentTurnPlayerId;
          const isLocal = player.id === localPlayerId;
          const isEliminated = player.status === 'eliminated';
          const isDisconnected = player.status === 'disconnected';
          const progress =
            settings.mode === 'score'
              ? Math.min((player.score / settings.targetScore) * 100, 100)
              : 0;

          return (
            <li
              key={player.id}
              className={`relative rounded-lg px-3 py-2 transition-all duration-200 ${
                isCurrentTurn
                  ? 'bg-indigo-600/15 ring-1 ring-indigo-500/40'
                  : 'bg-gray-800/60'
              } ${isEliminated ? 'opacity-35' : ''} ${isDisconnected && !isEliminated ? 'opacity-50' : ''}`}
            >
              {settings.mode === 'score' && (
                <div
                  className="absolute inset-0 bg-indigo-500/8 rounded-lg transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              )}
              <div className="relative flex items-center gap-2">
                <span className={`text-xs font-bold w-4 text-center shrink-0 ${rankColors[i] ?? 'text-gray-600'}`}>
                  {i + 1}
                </span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {isCurrentTurn && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium truncate ${isLocal ? 'text-indigo-400' : ''}`}
                  >
                    {player.name}
                  </span>
                  {isDisconnected && !isEliminated && (
                    <span className="text-[10px] text-yellow-500/80">DC</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {settings.mode === 'score' && (
                    <span className="font-mono text-xs text-gray-400">
                      {player.score}<span className="text-gray-600">/{settings.targetScore}</span>
                    </span>
                  )}
                  {settings.mode === 'survival' && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: settings.initialLives }, (_, j) => (
                        <span
                          key={j}
                          className={`text-xs transition-opacity ${j < player.lives ? 'opacity-100' : 'opacity-20'}`}
                        >
                          &#10084;
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
