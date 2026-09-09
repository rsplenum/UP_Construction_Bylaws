import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PROJECT, LEGACY_OCCUPANCY, ProjectState } from '../domain/project';
import { OCCUPANCIES, OccupancyId } from '../domain/occupancy';

const STORAGE_KEY = 'up_byelaws_2025_project';
const HISTORY_KEY = 'up_byelaws_2025_project_history';
const MAX_HISTORY = 12;
const MAX_UNDO = 30;

export interface SavedProject {
  id: string;
  name: string;
  savedAt: string;
  savedAtIso: string;
  state: ProjectState;
  score?: number;
}

interface ProjectContextValue {
  project: ProjectState;
  /** Patch one or more fields. Every screen writes through this. */
  patch: (changes: Partial<ProjectState>) => void;
  replace: (next: ProjectState) => void;
  reset: () => void;
  undo: () => void;
  canUndo: boolean;
  savedProjects: SavedProject[];
  saveSnapshot: (name: string, score?: number) => SavedProject | null;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  exportJson: () => string;
  importJson: (raw: string) => { ok: true } | { ok: false; error: string };
  lastSavedLabel: string;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — the app stays usable, it just will not remember */
  }
}

/** Coerce a persisted or imported payload into a valid project, field by field. */
function sanitize(candidate: unknown): ProjectState {
  const input = (candidate ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_PROJECT };

  for (const key of Object.keys(DEFAULT_PROJECT) as (keyof ProjectState)[]) {
    const value = input[key];
    const fallback = DEFAULT_PROJECT[key];
    if (value === undefined || value === null) continue;

    if (typeof fallback === 'number') {
      const n = Number(value);
      if (Number.isFinite(n)) (out[key] as number) = n;
    } else if (typeof fallback === 'boolean') {
      (out[key] as boolean) = Boolean(value);
    } else if (typeof fallback === 'string') {
      (out[key] as string) = String(value);
    }
  }

  // A project saved before the occupancy taxonomy was widened carries one of the four
  // original names; translate rather than silently resetting the user's project.
  const rawOccupancy = String(input.occupancy ?? '');
  if (rawOccupancy in OCCUPANCIES) {
    out.occupancy = rawOccupancy as OccupancyId;
  } else if (rawOccupancy in LEGACY_OCCUPANCY) {
    out.occupancy = LEGACY_OCCUPANCY[rawOccupancy];
  }

  // Fields that are optional on the model and so have no defaults to type-check against.
  if (Number.isFinite(Number(input.latitude))) out.latitude = Number(input.latitude);
  if (Number.isFinite(Number(input.longitude))) out.longitude = Number(input.longitude);

  return out;
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<ProjectState>(() => sanitize(readJson(STORAGE_KEY, DEFAULT_PROJECT)));
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => readJson<SavedProject[]>(HISTORY_KEY, []));
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('');
  const undoStack = useRef<ProjectState[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Persist on idle rather than on every keystroke, so dragging a slider does not
  // write to localStorage 60 times a second.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeJson(STORAGE_KEY, project);
      setLastSavedLabel(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [project]);

  const pushUndo = useCallback((previous: ProjectState) => {
    undoStack.current = [previous, ...undoStack.current].slice(0, MAX_UNDO);
    setCanUndo(true);
  }, []);

  const patch = useCallback(
    (changes: Partial<ProjectState>) => {
      setProject((prev) => {
        const next = { ...prev, ...changes };
        const changed = (Object.keys(changes) as (keyof ProjectState)[]).some((k) => prev[k] !== next[k]);
        if (!changed) return prev;
        pushUndo(prev);
        return next;
      });
    },
    [pushUndo],
  );

  const replace = useCallback(
    (next: ProjectState) => {
      setProject((prev) => {
        pushUndo(prev);
        return sanitize(next);
      });
    },
    [pushUndo],
  );

  const reset = useCallback(() => {
    setProject((prev) => {
      pushUndo(prev);
      return { ...DEFAULT_PROJECT };
    });
  }, [pushUndo]);

  const undo = useCallback(() => {
    setProject((prev) => {
      const [previous, ...rest] = undoStack.current;
      if (!previous) return prev;
      undoStack.current = rest;
      setCanUndo(rest.length > 0);
      return previous;
    });
  }, []);

  const saveSnapshot = useCallback(
    (name: string, score?: number): SavedProject | null => {
      const now = new Date();
      const entry: SavedProject = {
        id: `proj-${now.getTime()}`,
        name: name.trim() || `${project.occupancy.replace('_', ' ')} · ${project.plotArea} m²`,
        savedAt: now.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        savedAtIso: now.toISOString(),
        state: { ...project },
        score,
      };
      const next = [entry, ...savedProjects].slice(0, MAX_HISTORY);
      setSavedProjects(next);
      writeJson(HISTORY_KEY, next);
      return entry;
    },
    [project, savedProjects],
  );

  const loadSnapshot = useCallback(
    (id: string) => {
      const found = savedProjects.find((p) => p.id === id);
      if (found) replace(found.state);
    },
    [savedProjects, replace],
  );

  const deleteSnapshot = useCallback(
    (id: string) => {
      const next = savedProjects.filter((p) => p.id !== id);
      setSavedProjects(next);
      writeJson(HISTORY_KEY, next);
    },
    [savedProjects],
  );

  const exportJson = useCallback(
    () => JSON.stringify({ format: 'up-byelaws-2025-project', version: 1, project }, null, 2),
    [project],
  );

  const importJson = useCallback(
    (raw: string): { ok: true } | { ok: false; error: string } => {
      try {
        const parsed = JSON.parse(raw);
        const payload = parsed?.project ?? parsed;
        if (!payload || typeof payload !== 'object') return { ok: false, error: 'File does not contain a project object.' };
        replace(sanitize(payload));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Could not parse the file as JSON.' };
      }
    },
    [replace],
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      project, patch, replace, reset, undo, canUndo,
      savedProjects, saveSnapshot, loadSnapshot, deleteSnapshot,
      exportJson, importJson, lastSavedLabel,
    }),
    [project, patch, replace, reset, undo, canUndo, savedProjects, saveSnapshot, loadSnapshot, deleteSnapshot, exportJson, importJson, lastSavedLabel],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextValue => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
};
