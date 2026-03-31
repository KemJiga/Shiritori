import { useEffect, useRef } from 'react';
import type { WordEntry, Player } from '../../game/types';

interface WordHistoryProps {
  wordHistory: WordEntry[];
  players: Player[];
}

export function WordHistory({ wordHistory, players }: WordHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [wordHistory.length]);

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? 'Unknown';

  if (wordHistory.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        No words played yet. The first player can start with any word!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
      {wordHistory.map((entry, i) => {
        const highlight = entry.word[entry.word.length - 1];
        return (
          <div
            key={i}
            className="flex items-baseline gap-2 text-sm"
          >
            <span className="text-gray-500 shrink-0 w-16 text-right text-xs">
              {getPlayerName(entry.playerId)}
            </span>
            <span className="font-medium text-gray-200">
              {entry.word.slice(0, -1)}
              <span className="text-indigo-400 font-bold">{highlight}</span>
            </span>
            <span className="text-xs text-gray-600">+{entry.word.length}</span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
