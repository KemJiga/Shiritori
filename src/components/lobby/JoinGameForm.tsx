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
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        aria-label="Back to lobby"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <h2 className="text-2xl font-bold">Join a Game</h2>
        <p className="text-sm text-gray-500 mt-1">Enter a game code to join your friends</p>
      </div>

      <div>
        <label htmlFor="join-name" className="block text-sm font-medium text-gray-400 mb-1.5">
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
          autoComplete="off"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
      </div>

      <div>
        <label htmlFor="game-code" className="block text-sm font-medium text-gray-400 mb-1.5">
          Game Code
        </label>
        <input
          id="game-code"
          type="text"
          placeholder="Paste invite code"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          autoComplete="off"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim() || !gameId.trim()}
        className="w-full px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl font-semibold text-lg transition-all duration-150 shadow-lg shadow-emerald-600/20"
      >
        Join Game
      </button>
    </form>
  );
}
