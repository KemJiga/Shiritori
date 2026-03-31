import type { ClientStatus } from '../../network/client';

interface ConnectionStatusProps {
  status: ClientStatus;
}

const statusConfig: Record<ClientStatus, { label: string; color: string; pulse: boolean }> = {
  connected: { label: 'Connected', color: 'bg-green-500', pulse: false },
  connecting: { label: 'Connecting...', color: 'bg-yellow-500', pulse: true },
  disconnected: { label: 'Disconnected', color: 'bg-red-500', pulse: true },
  failed: { label: 'Connection failed', color: 'bg-red-600', pulse: false },
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = statusConfig[status];

  if (status === 'connected') return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none">
      <div className="bg-gray-900 border border-gray-700 rounded-b-lg px-4 py-2 flex items-center gap-2 shadow-lg pointer-events-auto">
        <span className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
        <span className="text-sm text-gray-300">{config.label}</span>
      </div>
    </div>
  );
}
