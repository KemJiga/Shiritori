import { useState } from 'react';

interface JoinGameFormProps {
  initialGameId?: string;
  onCancel: () => void;
  onJoin: (playerName: string, gameId: string) => void;
}

export function JoinGameForm({ initialGameId, onCancel, onJoin }: JoinGameFormProps) {
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState(initialGameId ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && gameId.trim()) {
      onJoin(name.trim(), gameId.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          &larr; Back to lobby
        </button>
      </div>

      <h2 className="text-2xl font-bold">Join a Game</h2>

      <div>
        <label htmlFor="join-name" className="block text-sm text-gray-400 mb-1">
          Your Display Name
        </label>
        <input
          id="join-name"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="game-code" className="block text-sm text-gray-400 mb-1">
          Game Code
        </label>
        <input
          id="game-code"
          type="text"
          placeholder="Enter invite code"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim() || !gameId.trim()}
        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 rounded-lg font-medium text-lg transition-colors"
      >
        Join Game
      </button>
    </form>
  );
}
