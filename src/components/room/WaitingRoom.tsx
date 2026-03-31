import { CopyInviteLink } from '../shared/CopyInviteLink';
import { GameSettings } from './GameSettings';
import type { Player, GameSettings as GameSettingsType } from '../../game/types';

interface WaitingRoomProps {
  gameId: string;
  inviteUrl: string;
  players: Player[];
  settings: GameSettingsType;
  localPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
  onUpdateSettings: (patch: Partial<GameSettingsType>) => void;
}

export function WaitingRoom({
  gameId,
  inviteUrl,
  players,
  settings,
  localPlayerId,
  isHost,
  onStartGame,
  onLeave,
  onUpdateSettings,
}: WaitingRoomProps) {
  const minPlayersToStart = 2;
  const connectedPlayers = players.filter((p) => p.status === 'connected');
  const canStart = isHost && connectedPlayers.length >= minPlayersToStart;

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-5 animate-fade-in">
        <header className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Waiting Room</h1>
          <p className="text-gray-500 text-sm mt-1">
            Share the invite to let others join
          </p>
        </header>

        <section className="bg-gray-900/80 rounded-xl p-5 border border-gray-800/60" aria-label="Invite">
          <CopyInviteLink gameId={gameId} inviteUrl={inviteUrl} />
        </section>

        <section className="bg-gray-900/80 rounded-xl p-5 border border-gray-800/60" aria-label="Players">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Players ({players.length})
          </h2>
          <ul className="space-y-2" role="list">
            {players.map((player, i) => (
              <li
                key={player.id}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 animate-slide-up ${
                  player.status === 'disconnected'
                    ? 'bg-gray-800/40 opacity-60'
                    : 'bg-gray-800/80'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    player.status === 'connected'
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                      : 'bg-gray-600'
                  }`}
                  aria-label={player.status === 'connected' ? 'Online' : 'Offline'}
                />
                <span className="font-medium truncate">{player.name}</span>
                {player.id === localPlayerId && (
                  <span className="text-xs text-gray-500">(you)</span>
                )}
                {player.status === 'disconnected' && (
                  <span className="text-xs text-yellow-500 animate-pulse">reconnecting...</span>
                )}
                {player.id === players[0]?.id && (
                  <span className="ml-auto text-xs bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-gray-900/80 rounded-xl p-5 border border-gray-800/60" aria-label="Settings">
          <GameSettings
            settings={settings}
            isHost={isHost}
            onUpdate={onUpdateSettings}
          />
        </section>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onLeave}
            className="px-5 py-3 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98]"
          >
            Leave
          </button>
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl font-semibold text-lg transition-all duration-150 shadow-lg shadow-indigo-600/20"
            >
              {connectedPlayers.length < minPlayersToStart
                ? `Need ${minPlayersToStart - connectedPlayers.length} more player(s)`
                : 'Start Game'}
            </button>
          )}
          {!isHost && (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
