import { BookOpen, Bot, FileCheck2, Globe, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The app has one screen. These are the reference materials you can open beside it.
 *
 * The first version made these peers of the compliance check — nine tabs, none of which
 * answered the question on its own. They are supporting material, so they sit behind a
 * single menu and the workspace is what you land on.
 */
export type ViewId = 'workspace' | 'maps' | 'navigator' | 'rationale' | 'forms' | 'ask';

export interface ReferenceView {
  id: Exclude<ViewId, 'workspace'>;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const REFERENCE_VIEWS: readonly ReferenceView[] = [
  {
    id: 'maps', label: 'Find the site', icon: Globe,
    description: 'Locate the plot on the master plan and check zone buffers',
  },
  {
    id: 'navigator', label: 'Read the byelaws', icon: BookOpen,
    description: 'All 18 chapters, definitions and statutory tables',
  },
  {
    id: 'rationale', label: 'Why these rules', icon: Sparkles,
    description: 'What each threshold is protecting, traced to NBC and IS codes',
  },
  {
    id: 'forms', label: 'Statutory forms', icon: FileCheck2,
    description: 'Appendices 2–14, filled from this project',
  },
  {
    id: 'ask', label: 'Ask a question', icon: Bot,
    description: 'Anything about the byelaws, grounded in this project',
  },
];

export const DEFAULT_VIEW: ViewId = 'workspace';

export function isViewId(value: string): value is ViewId {
  return value === 'workspace' || REFERENCE_VIEWS.some((v) => v.id === value);
}

export function viewFromHash(hash: string): ViewId | null {
  const raw = hash.replace(/^#\/?/, '').split('?')[0];
  return isViewId(raw) ? raw : null;
}
