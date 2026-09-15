import React from 'react';
import { ChevronDown } from 'lucide-react';
import { NumberField } from '../components/ui/NumberField';
import { useProject } from '../context/ProjectContext';
import { InputId, getInput } from '../domain/inputs';
import { ProjectState } from '../domain/project';

/** So another panel can put the cursor in a named box. */
export const domIdFor = (id: InputId): string => `answer-${id}`;

interface InputControlProps {
  id: InputId;
  /** Ask the whole question rather than name the field. */
  asQuestion?: boolean;
}

const FIELD_CLASS =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 '
  + 'transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 '
  + 'dark:border-white/10 dark:bg-white/[0.06] dark:text-white';

/**
 * One registered question, rendered as whatever kind of answer it takes.
 *
 * Every control in the workspace comes from here, so a question cannot exist in the
 * registry and be missing from the interface — which is how `masterPlanZone` came to
 * decide Clause 15.3 for every project while having no control anywhere on screen.
 */
export const InputControl: React.FC<InputControlProps> = ({ id, asQuestion = true }) => {
  const { project, patch } = useProject();
  const def = getInput(id);
  const domId = domIdFor(id);
  const label = asQuestion ? def.question : def.label;
  const note = def.note?.(project);
  const value = project[id as keyof ProjectState];

  const write = (next: unknown) => patch({ [id]: next } as Partial<ProjectState>);

  if (def.kind === 'number') {
    return (
      <NumberField
        inputId={domId}
        label={label}
        unit={def.unit}
        value={Number(value)}
        onChange={write}
        min={def.min}
        max={def.max}
        step={def.step}
        warning={note?.tone === 'warn' ? note.text : undefined}
        hint={note?.tone === 'hint' ? note.text : undefined}
      />
    );
  }

  if (def.kind === 'boolean') {
    return (
      <div>
        <label className="flex cursor-pointer items-start gap-2 text-[12.5px] leading-snug text-slate-700 dark:text-slate-300">
          <input
            id={domId}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => write(e.target.checked)}
            className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500"
          />
          <span>{label}</span>
        </label>
        {note && (
          <p className={`mt-1 text-[10.5px] leading-snug ${note.tone === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {note.text}
          </p>
        )}
      </div>
    );
  }

  if (def.kind === 'text') {
    const listId = `${domId}-options`;
    return (
      <div>
        <label htmlFor={domId} className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
          {label}
        </label>
        <input
          id={domId}
          list={def.suggestions ? listId : undefined}
          value={String(value ?? '')}
          onChange={(e) => write(e.target.value)}
          className={FIELD_CLASS}
        />
        {def.suggestions && (
          <datalist id={listId}>
            {def.suggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>
    );
  }

  const options = def.options?.(project) ?? [];
  // An `<optgroup>` per distinct group, in first-seen order; a flat list where none is set.
  const groups = [...new Set(options.map((o) => o.group ?? ''))];
  return (
    <div>
      <label htmlFor={domId} className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        <select
          id={domId}
          value={String(value)}
          onChange={(e) => write(e.target.value)}
          className={`${FIELD_CLASS} appearance-none pr-9`}
        >
          {groups.length === 1 && groups[0] === ''
            ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
            : groups.map((g) => (
              <optgroup key={g || 'other'} label={g || 'Other'}>
                {options.filter((o) => (o.group ?? '') === g).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
            ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      </div>
      {note && (
        <p className={`mt-1 text-[10.5px] leading-snug ${note.tone === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
          {note.text}
        </p>
      )}
    </div>
  );
};
