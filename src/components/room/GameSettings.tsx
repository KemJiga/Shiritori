import { useState, useEffect } from 'react';
import type { GameSettings as GameSettingsType } from '../../game/types';

interface GameSettingsProps {
  settings: GameSettingsType;
  isHost: boolean;
  onUpdate: (patch: Partial<GameSettingsType>) => void;
}

export function GameSettings({ settings, isHost, onUpdate }: GameSettingsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Game Settings</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Game Mode</label>
        <div className="flex gap-2">
          <ModeButton
            label="Score"
            active={settings.mode === 'score'}
            disabled={!isHost}
            onClick={() => onUpdate({ mode: 'score' })}
          />
          <ModeButton
            label="Survival"
            active={settings.mode === 'survival'}
            disabled={!isHost}
            onClick={() => onUpdate({ mode: 'survival' })}
          />
        </div>
      </div>

      {settings.mode === 'score' && (
        <ScoreSettings settings={settings} isHost={isHost} onUpdate={onUpdate} />
      )}

      {settings.mode === 'survival' && (
        <SurvivalSettings settings={settings} isHost={isHost} onUpdate={onUpdate} />
      )}
    </div>
  );
}

function ScoreSettings({
  settings,
  isHost,
  onUpdate,
}: {
  settings: GameSettingsType;
  isHost: boolean;
  onUpdate: (patch: Partial<GameSettingsType>) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">
        Target Score
      </label>
      <NumberInput
        value={settings.targetScore}
        min={10}
        max={500}
        step={10}
        disabled={!isHost}
        onChange={(v) => onUpdate({ targetScore: v })}
      />
      <p className="text-xs text-gray-500 mt-1">
        Each word adds its length to your score. First to reach the target wins!
      </p>
    </div>
  );
}

function SurvivalSettings({
  settings,
  isHost,
  onUpdate,
}: {
  settings: GameSettingsType;
  isHost: boolean;
  onUpdate: (patch: Partial<GameSettingsType>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Lives</label>
        <NumberInput
          value={settings.initialLives}
          min={1}
          max={10}
          disabled={!isHost}
          onChange={(v) => onUpdate({ initialLives: v })}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Turn Timer (seconds)
        </label>
        <NumberInput
          value={settings.turnTimerSeconds}
          min={5}
          max={120}
          step={5}
          disabled={!isHost}
          onChange={(v) => onUpdate({ turnTimerSeconds: v })}
        />
      </div>
    </div>
  );
}

function ModeButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      } ${disabled && !active ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );
}

function NumberInput({
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const v = Number(raw);
    if (!isNaN(v) && v >= min && v <= max) {
      onChange(v);
    } else {
      setLocalValue(String(value));
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => commit(localValue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(localValue);
      }}
      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}
