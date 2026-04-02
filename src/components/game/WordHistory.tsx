import { useEffect, useRef } from 'react';
import type { WordEntry, Player } from '../../game/types';

interface WordHistoryProps {
  wordHistory: WordEntry[];
  players: Player[];
}

export function WordHistory({ wordHistory, players }: WordHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
    }
  }, [wordHistory.length]);

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? 'Unknown';

  if (wordHistory.length === 0) {
    return (
      <div
        className="flex flex-1 flex-col min-h-0 overflow-hidden"
        aria-label="No words yet"
      >
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm select-none">
          <div className="text-center space-y-2">
            <span className="text-3xl block" role="img" aria-hidden="true">
              &#9997;
            </span>
            <p>No words played yet</p>
            <p className="text-xs text-gray-700">The first player can start with any word!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col min-h-0 overflow-hidden"
      role="log"
      aria-label="Word history"
    >
      <div
        ref={scrollRef}
        className="word-history-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain"
      >
        <div className="min-h-full flex flex-col justify-end gap-0.5 py-1">
          {wordHistory.map((entry, i) => {
            const highlight = entry.word[entry.word.length - 1];
            const isNew = i === wordHistory.length - 1;
            return (
              <div
                key={`${entry.timestamp}-${i}`}
                className={`flex items-center justify-center gap-4 text-sm py-0.5 shrink-0 ${
                  isNew ? 'animate-slide-up' : ''
                }`}
              >
                <span className="text-gray-600 shrink-0 text-center truncate">
                  {getPlayerName(entry.playerId)}
                </span>
                <span className="font-medium text-gray-300">
                  {entry.word.slice(0, -1)}
                  <span className="text-indigo-400 font-bold">{highlight}</span>
                </span>
                <span className="text-gray-700 font-mono">+{entry.word.length}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
