import {
  BookOpen, Bot, Calculator, CheckSquare, Compass, FileCheck2, Globe, MapPin, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TabId =
  | 'maps' | 'audit' | 'navigator' | 'calculators'
  | 'visualizer' | 'rationale' | 'zoning' | 'forms' | 'ai-assistant';

export interface TabDefinition {
  id: TabId;
  label: string;
  /** Shown in the command palette and as the mobile menu description. */
  description: string;
  icon: LucideIcon;
  badge?: string;
  highlight?: boolean;
  keywords: string;
}

export const TABS: readonly TabDefinition[] = [
  {
    id: 'audit', label: 'Compliance Audit', icon: CheckSquare, badge: 'Live',
    description: 'Cross-rule verdict on the whole project, with the arithmetic shown',
    keywords: 'audit check verify compliance score conflict report scrutiny',
  },
  {
    id: 'calculators', label: 'FAR & Fees', icon: Calculator,
    description: 'Telescopic FAR, purchasable FAR charge, parking ECS, compounding fee',
    keywords: 'far floor area ratio fee purchasable pfar ppfar parking ecs evci compounding shaman shulk',
  },
  {
    id: 'visualizer', label: '2D Setbacks', icon: Compass, badge: 'Sec 32',
    description: 'Scaled site plan with the buildable envelope and deviation analysis',
    keywords: 'setback envelope site plan blueprint drawing margin open space',
  },
  {
    id: 'maps', label: 'Spatial GIS', icon: Globe, badge: '22 Authorities', highlight: true,
    description: 'Master plan layers, buffers and point-level spatial audit',
    keywords: 'gis map spatial bhuvan satellite zone buffer river airport tod authority',
  },
  {
    id: 'navigator', label: 'Byelaws Code', icon: BookOpen,
    description: 'All 18 chapters, definitions, schedules and statutory tables',
    keywords: 'chapter clause section definition rule text code law read search',
  },
  {
    id: 'zoning', label: 'Zoning Matrix', icon: MapPin,
    description: 'Activity permissibility across the 16 standard use zones',
    keywords: 'zoning permissible activity land use matrix zone c1 c2 mixed',
  },
  {
    id: 'rationale', label: 'Planning Rationale', icon: Sparkles, badge: 'NBC / IS',
    description: 'Why each threshold exists, traced to NBC and IS codes',
    keywords: 'why rationale reason nbc is code justification explain',
  },
  {
    id: 'forms', label: 'Statutory Forms', icon: FileCheck2,
    description: 'Appendices 2–14 auto-filled from the project',
    keywords: 'form appendix affidavit sdbr application certificate print',
  },
  {
    id: 'ai-assistant', label: 'AI Copilot', icon: Bot,
    description: 'Ask about any rule, grounded in the byelaws and your project',
    keywords: 'ai chat ask question assistant copilot help gemini',
  },
];

export const DEFAULT_TAB: TabId = 'audit';

export function isTabId(value: string): value is TabId {
  return TABS.some((t) => t.id === value);
}

/** Read the tab from the URL hash so a view can be linked and the back button works. */
export function tabFromHash(hash: string): TabId | null {
  const raw = hash.replace(/^#\/?/, '').split('?')[0];
  return isTabId(raw) ? raw : null;
}
