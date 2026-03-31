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

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - fraction);

  const strokeColor = isUrgent
    ? 'rgb(239, 68, 68)'
    : `rgb(99, 102, 241)`;

  return (
    <div className="flex items-center gap-2 shrink-0" role="timer" aria-label={`${displaySeconds} seconds remaining`}>
      <div className="relative w-11 h-11">
        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-800"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            stroke={strokeColor}
            style={{ transition: 'stroke-dashoffset 0.15s linear, stroke 0.3s ease' }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums ${
            isUrgent ? 'text-red-400' : 'text-gray-200'
          }`}
        >
          {displaySeconds}
        </span>
      </div>
      {isUrgent && (
        <span className="text-red-400 text-xs font-semibold animate-pulse">
          Hurry!
        </span>
      )}
    </div>
  );
}
