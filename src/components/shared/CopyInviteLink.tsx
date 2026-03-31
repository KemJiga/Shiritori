import { useState } from 'react';

interface CopyInviteLinkProps {
  gameId: string;
  inviteUrl: string;
}

export function CopyInviteLink({ gameId, inviteUrl }: CopyInviteLinkProps) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const copyToClipboard = async (text: string, kind: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for insecure contexts
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Invite Code</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-lg font-mono text-indigo-400 tracking-wider select-all">
            {gameId}
          </code>
          <button
            onClick={() => copyToClipboard(gameId, 'code')}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
          >
            {copied === 'code' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Invite Link</label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono text-gray-300 select-all focus:outline-none"
          />
          <button
            onClick={() => copyToClipboard(inviteUrl, 'link')}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
          >
            {copied === 'link' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
