import { useState, useEffect } from 'react';

interface TimerDisplayProps {
  deadline: number | null;
  totalSeconds: number;
}

export function TimerDisplay({ deadline, totalSeconds }: TimerDisplayProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (!deadline) {
      setRemaining(totalSeconds);
      return;
    }

    const tick = () => {
      const left = Math.max(0, (deadline - Date.now()) / 1000);
      setRemaining(left);
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [deadline, totalSeconds]);

  const fraction = Math.min(remaining / totalSeconds, 1);
  const isUrgent = remaining <= 5;
  const displaySeconds = Math.ceil(remaining);

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference * (1 - fraction);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-11 h-11">
        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-800"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-100 ${
              isUrgent ? 'text-red-500' : 'text-indigo-500'
            }`}
            stroke="currentColor"
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${
            isUrgent ? 'text-red-400' : 'text-gray-200'
          }`}
        >
          {displaySeconds}
        </span>
      </div>
      {isUrgent && (
        <span className="text-red-400 text-sm font-medium animate-pulse">
          Hurry!
        </span>
      )}
    </div>
  );
}
