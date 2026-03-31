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
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          &larr; Back to lobby
        </button>
      </div>

      <h2 className="text-2xl font-bold">Create a Game</h2>

      <div>
        <label htmlFor="host-name" className="block text-sm text-gray-400 mb-1">
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
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-lg font-medium text-lg transition-colors"
      >
        Create Game
      </button>
    </form>
  );
}
