import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateGameForm } from './CreateGameForm';
import { JoinGameForm } from './JoinGameForm';
import { parseGameIdFromUrl, generateGameId } from '../../utils/id';
import type { GameSessionLocationState } from '../../navigation';

type LobbyView = 'menu' | 'create' | 'join';

export function LobbyPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<LobbyView>('menu');
  const [inviteGameId, setInviteGameId] = useState<string | null>(null);

  useEffect(() => {
    const gameId = parseGameIdFromUrl();
    if (gameId) {
      setInviteGameId(gameId);
      setView('join');
    }
  }, []);

  const handleCreateGame = useCallback(
    (playerName: string) => {
      const gameId = generateGameId();
      navigate(`/game/${gameId}/host`, {
        state: { playerName } satisfies GameSessionLocationState,
      });
    },
    [navigate],
  );

  const handleJoinGame = useCallback(
    (playerName: string, gameId: string) => {
      navigate(`/game/${gameId}/join`, {
        state: { playerName } satisfies GameSessionLocationState,
      });
    },
    [navigate],
  );

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md animate-fade-in">
        {view === 'menu' && (
          <LobbyMenu
            onCreate={() => setView('create')}
            onJoin={() => setView('join')}
          />
        )}

        {view === 'create' && (
          <div className="animate-slide-up">
            <CreateGameForm
              onCancel={() => setView('menu')}
              onCreate={handleCreateGame}
            />
          </div>
        )}

        {view === 'join' && (
          <div className="animate-slide-up">
            <JoinGameForm
              initialGameId={inviteGameId ?? undefined}
              onCancel={() => {
                setInviteGameId(null);
                setView('menu');
              }}
              onJoin={handleJoinGame}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LobbyMenu({
  onCreate,
  onJoin,
}: {
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <div className="text-center space-y-10">
      <div className="animate-slide-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600/20 mb-6">
          <span className="text-4xl" role="img" aria-label="word chain">
            🔗
          </span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Shiritori
        </h1>
        <p className="text-gray-400 mt-2 text-lg">The word chain game</p>
      </div>

      <div className="space-y-3 animate-slide-up stagger-2">
        <button
          onClick={onCreate}
          className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl font-semibold text-lg transition-all duration-150 shadow-lg shadow-indigo-600/20"
        >
          Create Game
        </button>
        <button
          onClick={onJoin}
          className="w-full px-6 py-4 bg-gray-800/80 hover:bg-gray-700 active:scale-[0.98] border border-gray-700 rounded-xl font-semibold text-lg transition-all duration-150"
        >
          Join Game
        </button>
      </div>

      <p className="text-xs text-gray-600 animate-fade-in stagger-3">
        Peer-to-peer &middot; No account required &middot; Free
      </p>
    </div>
  );
}
