import React, { useEffect, useId, useState } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Clamped on blur, never mid-keystroke. */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
  /** Shown under the field in amber; does not block input. */
  warning?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A numeric input that lets people type.
 *
 * The previous inputs ran `Math.max(10, Number(e.target.value))` on every keystroke, so
 * clearing a field snapped it to the floor and typing "5" on the way to "50" jumped to
 * "10". This keeps the raw string while the field has focus and only coerces and clamps
 * on blur, which is also where the min/max are enforced.
 */
export const NumberField: React.FC<NumberFieldProps> = ({
  label, value, onChange, min, max, step = 0.1, unit, hint, warning, disabled, className = '',
}) => {
  const id = useId();
  const [draft, setDraft] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  // Track external changes (presets, auto-fix, undo) while the user is not typing.
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = () => {
    setFocused(false);
    const parsed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    let next = parsed;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
        {unit && <span className="text-slate-600 dark:text-slate-400 font-normal"> ({unit})</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={draft}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          aria-describedby={hint || warning ? `${id}-hint` : undefined}
          aria-invalid={warning ? true : undefined}
          onFocus={() => setFocused(true)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          className={`w-full h-9 rounded-lg border bg-white dark:bg-white/[0.06] px-3 text-sm tabular-nums text-slate-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50 ${
            warning
              ? 'border-amber-400 dark:border-amber-500/60'
              : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400'
          }`}
        />
      </div>
      {(hint || warning) && (
        <p
          id={`${id}-hint`}
          className={`mt-1 text-[10.5px] leading-snug ${warning ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}
        >
          {warning || hint}
        </p>
      )}
    </div>
  );
};
