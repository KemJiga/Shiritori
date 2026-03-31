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
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Invite Code</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-lg font-mono text-indigo-400 tracking-widest select-all">
            {gameId}
          </code>
          <CopyButton
            label={copied === 'code' ? 'Copied!' : 'Copy'}
            active={copied === 'code'}
            onClick={() => copyToClipboard(gameId, 'code')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Invite Link</label>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            aria-label="Invite link"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono text-gray-400 select-all truncate focus:outline-none"
          />
          <CopyButton
            label={copied === 'link' ? 'Copied!' : 'Copy'}
            active={copied === 'link'}
            onClick={() => copyToClipboard(inviteUrl, 'link')}
          />
        </div>
      </div>
    </div>
  );
}

function CopyButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 shrink-0 ${
        active
          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
