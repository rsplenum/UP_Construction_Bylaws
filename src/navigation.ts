import {
  ArrowLeftRight, BookOpen, Bot, ClipboardCheck, FileCheck2, FileText, Globe, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The app has one screen. These are the reference materials you can open beside it.
 *
 * The first version made these peers of the compliance check — nine tabs, none of which
 * answered the question on its own. They are supporting material, so they sit behind a
 * single menu and the workspace is what you land on.
 */
export type ViewId =
  | 'workspace' | 'plot' | 'compare' | 'maps' | 'navigator' | 'gazette' | 'rationale'
  | 'forms' | 'ask';

export interface ReferenceView {
  id: ViewId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const REFERENCE_VIEWS: readonly ReferenceView[] = [
  {
    id: 'workspace', label: 'Check a specific design', icon: ClipboardCheck,
    description: 'You have a floor area and a height in mind — test that building against every chapter',
  },
  {
    id: 'compare', label: 'Choosing between two plots', icon: ArrowLeftRight,
    description: 'Neither one is bought yet \u2014 see what the byelaws do to each before you commit',
  },
  {
    id: 'maps', label: 'Find the site', icon: Globe,
    description: 'Locate the plot on the master plan and check zone buffers',
  },
  {
    id: 'navigator', label: 'Read the byelaws', icon: BookOpen,
    description: 'All 18 chapters, definitions and statutory tables',
  },
  {
    id: 'gazette', label: 'The source text', icon: FileText,
    description: 'The supplied PDFs themselves, the pages every rule was checked against',
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

/**
 * What fits on this plot is the question people arrive with, so it is what they land on.
 *
 * It used to be the second item in a menu labelled "Reference" — the screen that answers
 * the question, filed as supporting material, next to the statutory forms. Nobody looks
 * for the answer in the appendix. The workspace is still there for the other job: testing
 * a building you have already designed.
 */
export const DEFAULT_VIEW: ViewId = 'plot';

export function isViewId(value: string): value is ViewId {
  return value === 'workspace' || REFERENCE_VIEWS.some((v) => v.id === value);
}

export function viewFromHash(hash: string): ViewId | null {
  const raw = hash.replace(/^#\/?/, '').split('?')[0];
  return isViewId(raw) ? raw : null;
}
