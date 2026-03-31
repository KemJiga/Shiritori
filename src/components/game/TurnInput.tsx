import { useState } from 'react';

interface TurnInputProps {
  isMyTurn: boolean;
  lastWord: string | null;
  error: string | null;
  onSubmit: (word: string) => void;
}

export function TurnInput({ isMyTurn, lastWord, error, onSubmit }: TurnInputProps) {
  const [value, setValue] = useState('');

  const requiredLetter = lastWord ? lastWord[lastWord.length - 1].toUpperCase() : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !isMyTurn) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <div>
      {isMyTurn ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            {requiredLetter && (
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg text-lg font-bold shrink-0">
                {requiredLetter}
              </div>
            )}
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                requiredLetter
                  ? `Type a word starting with "${requiredLetter}"...`
                  : 'Type any word to start...'
              }
              autoFocus
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg font-medium transition-colors"
            >
              Submit
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </form>
      ) : (
        <div className="text-center py-3 text-gray-400 text-sm">
          Waiting for opponent...
        </div>
      )}
    </div>
  );
}
