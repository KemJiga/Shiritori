import type { ClientStatus } from '../../network/client';

interface ConnectionStatusProps {
  status: ClientStatus;
}

const statusConfig: Record<ClientStatus, { label: string; dotColor: string; pulse: boolean }> = {
  connected: { label: 'Connected', dotColor: 'bg-emerald-400', pulse: false },
  connecting: { label: 'Connecting...', dotColor: 'bg-yellow-400', pulse: true },
  disconnected: { label: 'Reconnecting...', dotColor: 'bg-red-400', pulse: true },
  failed: { label: 'Connection lost', dotColor: 'bg-red-500', pulse: false },
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = statusConfig[status];

  if (status === 'connected') return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none animate-slide-up" role="status" aria-live="polite">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/60 rounded-b-xl px-4 py-2 flex items-center gap-2 shadow-xl pointer-events-auto">
        <span className={`w-2 h-2 rounded-full ${config.dotColor} ${config.pulse ? 'animate-pulse' : ''}`} />
        <span className="text-sm text-gray-300 font-medium">{config.label}</span>
      </div>
    </div>
  );
}
