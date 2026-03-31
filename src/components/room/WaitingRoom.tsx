import { CopyInviteLink } from '../shared/CopyInviteLink';
import type { Player } from '../../game/types';

interface WaitingRoomProps {
  gameId: string;
  inviteUrl: string;
  players: Player[];
  localPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

export function WaitingRoom({
  gameId,
  inviteUrl,
  players,
  localPlayerId,
  isHost,
  onStartGame,
  onLeave,
}: WaitingRoomProps) {
  const minPlayersToStart = 2;
  const canStart = isHost && players.length >= minPlayersToStart;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-1">Waiting Room</h1>
          <p className="text-gray-400 text-sm">
            Share the invite to let others join
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-5">
          <CopyInviteLink gameId={gameId} inviteUrl={inviteUrl} />
        </div>

        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">
            Players ({players.length})
          </h2>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    player.status === 'connected' ? 'bg-green-400' : 'bg-gray-500'
                  }`}
                />
                <span className="font-medium">{player.name}</span>
                {player.id === localPlayerId && (
                  <span className="text-xs text-gray-500">(you)</span>
                )}
                {player.id === players[0]?.id && (
                  <span className="ml-auto text-xs bg-indigo-600/30 text-indigo-400 px-2 py-0.5 rounded">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
          >
            Leave
          </button>
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-lg font-medium text-lg transition-colors"
            >
              {players.length < minPlayersToStart
                ? `Need ${minPlayersToStart - players.length} more player(s)`
                : 'Start Game'}
            </button>
          )}
          {!isHost && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
