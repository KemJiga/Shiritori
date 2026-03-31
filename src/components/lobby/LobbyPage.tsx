import { useState, useEffect } from 'react';
import { CreateGameForm } from './CreateGameForm';
import { JoinGameForm } from './JoinGameForm';
import { parseGameIdFromUrl } from '../../utils/id';

type LobbyView = 'menu' | 'create' | 'join';

interface LobbyPageProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (playerName: string, gameId: string) => void;
}

export function LobbyPage({ onCreateGame, onJoinGame }: LobbyPageProps) {
  const [view, setView] = useState<LobbyView>('menu');
  const [inviteGameId, setInviteGameId] = useState<string | null>(null);

  useEffect(() => {
    const gameId = parseGameIdFromUrl();
    if (gameId) {
      setInviteGameId(gameId);
      setView('join');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {view === 'menu' && (
          <LobbyMenu
            onCreate={() => setView('create')}
            onJoin={() => setView('join')}
          />
        )}

        {view === 'create' && (
          <CreateGameForm
            onCancel={() => setView('menu')}
            onCreate={onCreateGame}
          />
        )}

        {view === 'join' && (
          <JoinGameForm
            initialGameId={inviteGameId ?? undefined}
            onCancel={() => {
              setInviteGameId(null);
              setView('menu');
            }}
            onJoin={onJoinGame}
          />
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
    <div className="text-center space-y-8">
      <div>
        <h1 className="text-5xl font-bold mb-2">Shiritori</h1>
        <p className="text-gray-400">The word chain game</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onCreate}
          className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium text-lg transition-colors"
        >
          Create Game
        </button>
        <button
          onClick={onJoin}
          className="w-full px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-medium text-lg transition-colors"
        >
          Join Game
        </button>
      </div>

      <p className="text-xs text-gray-600">
        Peer-to-peer &middot; No account required
      </p>
    </div>
  );
}
