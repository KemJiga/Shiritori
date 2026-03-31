import { useState, useEffect } from 'react';

interface HostDisconnectedProps {
  onLeave: () => void;
}

const REDIRECT_SECONDS = 5;

export function HostDisconnected({ onLeave }: HostDisconnectedProps) {
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" role="alertdialog" aria-labelledby="host-dc-title" aria-describedby="host-dc-desc">
      <div className="bg-gray-900 border border-gray-700/60 rounded-2xl p-8 max-w-sm text-center space-y-5 animate-scale-in shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-600/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 id="host-dc-title" className="text-xl font-bold">Host Disconnected</h2>
        <p id="host-dc-desc" className="text-gray-400 text-sm leading-relaxed">
          The host has left the game. Returning to lobby
          {countdown > 0 && <> in <span className="text-gray-200 font-semibold">{countdown}s</span></>}...
        </p>
        <button
          onClick={onLeave}
          autoFocus
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl font-semibold transition-all duration-150 shadow-lg shadow-indigo-600/20"
        >
          Back to Lobby Now
        </button>
      </div>
    </div>
  );
}
