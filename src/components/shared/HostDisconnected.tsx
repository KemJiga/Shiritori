interface HostDisconnectedProps {
  onLeave: () => void;
}

export function HostDisconnected({ onLeave }: HostDisconnectedProps) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-950/90 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-sm text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-600/20 flex items-center justify-center">
          <span className="text-red-400 text-2xl">!</span>
        </div>
        <h2 className="text-xl font-bold text-gray-100">Host Disconnected</h2>
        <p className="text-gray-400 text-sm">
          The host has left the game. The session has ended.
        </p>
        <button
          onClick={onLeave}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
