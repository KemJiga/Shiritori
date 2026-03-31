import { useState } from 'react';

interface CreateGameFormProps {
  onCancel: () => void;
  onCreate: (playerName: string) => void;
}

export function CreateGameForm({ onCancel, onCreate }: CreateGameFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onCreate(name.trim());
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
        <h2 className="text-2xl font-bold">Create a Game</h2>
        <p className="text-sm text-gray-500 mt-1">Set up a room and invite your friends</p>
      </div>

      <div>
        <label htmlFor="host-name" className="block text-sm font-medium text-gray-400 mb-1.5">
          Your Display Name
        </label>
        <input
          id="host-name"
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

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl font-semibold text-lg transition-all duration-150 shadow-lg shadow-indigo-600/20"
      >
        Create Game
      </button>
    </form>
  );
}
