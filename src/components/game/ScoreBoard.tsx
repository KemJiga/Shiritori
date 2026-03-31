import type { Player, GameSettings } from '../../game/types';

interface ScoreBoardProps {
  players: Player[];
  settings: GameSettings;
  currentTurnPlayerId: string;
  localPlayerId: string;
}

export function ScoreBoard({
  players,
  settings,
  currentTurnPlayerId,
  localPlayerId,
}: ScoreBoardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Scoreboard
      </h2>
      {sorted.map((player) => {
        const isCurrentTurn = player.id === currentTurnPlayerId;
        const isLocal = player.id === localPlayerId;
        const progress =
          settings.mode === 'score'
            ? Math.min((player.score / settings.targetScore) * 100, 100)
            : 0;

        return (
          <div
            key={player.id}
            className={`relative rounded-lg px-4 py-2 transition-colors ${
              isCurrentTurn
                ? 'bg-indigo-600/20 ring-1 ring-indigo-500/50'
                : 'bg-gray-800'
            } ${player.status === 'eliminated' ? 'opacity-40' : ''}`}
          >
            {settings.mode === 'score' && (
              <div
                className="absolute inset-0 bg-indigo-600/10 rounded-lg transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            )}
            <div className="relative flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isCurrentTurn && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                )}
                <span
                  className={`font-medium truncate ${isLocal ? 'text-indigo-400' : ''}`}
                >
                  {player.name}
                  {isLocal && <span className="text-xs text-gray-500 ml-1">(you)</span>}
                </span>
              </div>
              <div className="text-right shrink-0">
                {settings.mode === 'score' && (
                  <span className="font-mono text-sm">
                    {player.score}/{settings.targetScore}
                  </span>
                )}
                {settings.mode === 'survival' && (
                  <span className="font-mono text-sm">
                    {'❤'.repeat(player.lives)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
