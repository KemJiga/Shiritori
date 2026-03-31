import { useState, useEffect } from 'react';
import type { GameSettings as GameSettingsType } from '../../game/types';
import { LANGUAGES } from '../../game/dictionary';
import type { GameLanguage } from '../../game/dictionary';

interface GameSettingsProps {
  settings: GameSettingsType;
  isHost: boolean;
  onUpdate: (patch: Partial<GameSettingsType>) => void;
}

export function GameSettings({ settings, isHost, onUpdate }: GameSettingsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Game Settings
      </h2>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-400 mb-2">Language</legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                if (lang.enabled) onUpdate({ language: lang.code as GameLanguage });
              }}
              disabled={!isHost || !lang.enabled}
              aria-pressed={settings.language === lang.code}
              className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                settings.language === lang.code
                  ? 'bg-indigo-600/20 ring-2 ring-indigo-500/60 text-white'
                  : lang.enabled
                    ? 'bg-gray-800/80 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
              }`}
            >
              <span className="mr-1.5">{lang.flag}</span>
              {lang.label}
              {!lang.enabled && (
                <span className="ml-1.5 text-[10px] bg-gray-700/60 text-gray-500 px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-400 mb-2">Game Mode</legend>
        <div className="flex gap-2">
          <ModeButton
            label="Score"
            description="Race to the target"
            active={settings.mode === 'score'}
            disabled={!isHost}
            onClick={() => onUpdate({ mode: 'score' })}
          />
          <ModeButton
            label="Survival"
            description="Last one standing"
            active={settings.mode === 'survival'}
            disabled={!isHost}
            onClick={() => onUpdate({ mode: 'survival' })}
          />
        </div>
      </fieldset>

      <div className="animate-fade-in">
        {settings.mode === 'score' && (
          <ScoreSettings settings={settings} isHost={isHost} onUpdate={onUpdate} />
        )}
        {settings.mode === 'survival' && (
          <SurvivalSettings settings={settings} isHost={isHost} onUpdate={onUpdate} />
        )}
      </div>
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
      <label className="block text-sm font-medium text-gray-400 mb-1.5">
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
      <p className="text-xs text-gray-600 mt-1.5">
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
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Lives</label>
        <NumberInput
          value={settings.initialLives}
          min={1}
          max={10}
          disabled={!isHost}
          onChange={(v) => onUpdate({ initialLives: v })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
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
  description,
  active,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex-1 px-4 py-3 rounded-xl text-left transition-all duration-150 ${
        active
          ? 'bg-indigo-600/20 ring-2 ring-indigo-500/60 text-white'
          : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700'
      } ${disabled && !active ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
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
      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
    />
  );
}
