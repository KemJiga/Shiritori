import { useState, useRef, useEffect } from 'react';

interface TurnInputProps {
  isMyTurn: boolean;
  lastWord: string | null;
  error: string | null;
  onSubmit: (word: string) => void;
  isSurvival: boolean;
  localLives: number;
}

export function TurnInput({
  isMyTurn,
  lastWord,
  error,
  onSubmit,
  isSurvival,
  localLives,
}: TurnInputProps) {
  const [value, setValue] = useState('');
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevLivesRef = useRef(localLives);

  const requiredLetter = lastWord ? lastWord[lastWord.length - 1].toUpperCase() : null;

  useEffect(() => {
    if (isSurvival && localLives < prevLivesRef.current) {
      setValue('');
    }
    prevLivesRef.current = localLives;
  }, [isSurvival, localLives]);

  useEffect(() => {
    if (error) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 400);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (isMyTurn) inputRef.current?.focus();
  }, [isMyTurn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !isMyTurn) return;
    onSubmit(value.trim());
    setValue('');
  };

  if (!isMyTurn) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm select-none" role="status">
        Waiting for opponent...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2" aria-label="Submit a word">
      <div className={`flex gap-2 ${shaking ? 'animate-shake' : ''}`}>
        {requiredLetter && (
          <div
            className="flex items-center justify-center w-11 h-11 bg-indigo-600 rounded-xl text-lg font-bold shrink-0 shadow-lg shadow-indigo-600/20"
            aria-label={`Word must start with ${requiredLetter}`}
          >
            {requiredLetter}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            requiredLetter
              ? `Type a word starting with "${requiredLetter}"...`
              : 'Type any word to start...'
          }
          autoComplete="off"
          spellCheck="false"
          className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow min-w-0"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] rounded-xl font-semibold transition-all duration-150 shadow-lg shadow-indigo-600/20 shrink-0"
        >
          Send
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-sm animate-fade-in" role="alert">{error}</p>
      )}
    </form>
  );
}
