export interface AuditEngineState {
  occupancy: 'single_unit' | 'multi_unit' | 'group_housing' | 'commercial';
  plotArea: number; // sqm
  plotFrontage: number; // m
  roadWidth: number; // m
  buildingHeight: number; // m
  proposedBuiltUpArea: number; // sqm
  isCornerPlot: boolean;
  hasStilt: boolean;
  frontSetbackProvided: number;
  rearSetbackProvided: number;
  side1Provided: number;
  side2Provided: number;
  parkingBaysProvided: number;
  hasRWH: boolean;
  hasSolarHeating: boolean;
  greenRating: 'none' | 'silver' | 'gold' | 'platinum';
  lastSavedAt?: string;
}

export const DEFAULT_AUDIT_STATE: AuditEngineState = {
  occupancy: 'single_unit',
  plotArea: 320,
  plotFrontage: 14,
  roadWidth: 12,
  buildingHeight: 12,
  proposedBuiltUpArea: 450,
  isCornerPlot: false,
  hasStilt: true,
  frontSetbackProvided: 3.5,
  rearSetbackProvided: 3.0,
  side1Provided: 1.5,
  side2Provided: 1.5,
  parkingBaysProvided: 4,
  hasRWH: true,
  hasSolarHeating: false,
  greenRating: 'none',
};

const STORAGE_KEY = 'up_byelaws_2025_audit_state';
const HISTORY_STORAGE_KEY = 'up_byelaws_2025_audit_history';

export interface AuditSessionHistoryItem {
  id: string;
  projectName: string;
  savedAt: string;
  state: AuditEngineState;
  score?: number;
  totalCompliant?: number;
  totalIssues?: number;
}

export function loadAuditState(): AuditEngineState {
  if (typeof window === 'undefined') return DEFAULT_AUDIT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUDIT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUDIT_STATE,
      ...parsed,
    };
  } catch (err) {
    console.warn('Failed to load audit state from localStorage:', err);
    return DEFAULT_AUDIT_STATE;
  }
}

export function saveAuditState(state: AuditEngineState): string {
  if (typeof window === 'undefined') return '';
  try {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const payload = {
      ...state,
      lastSavedAt: now,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return now;
  } catch (err) {
    console.warn('Failed to save audit state to localStorage:', err);
    return '';
  }
}

export function clearAuditState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear audit state from localStorage:', err);
  }
}

export function loadAuditHistory(): AuditSessionHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch (err) {
    console.warn('Failed to load audit history from localStorage:', err);
    return [];
  }
}

export function saveAuditSessionToHistory(
  projectName: string,
  state: AuditEngineState,
  score?: number,
  totalCompliant?: number,
  totalIssues?: number
): AuditSessionHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const history = loadAuditHistory();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newItem: AuditSessionHistoryItem = {
      id: 'audit-' + Date.now(),
      projectName: projectName.trim() || `Project #${history.length + 1} (${state.occupancy.replace('_', ' ')})`,
      savedAt: `${formattedDate}, ${formattedTime}`,
      state: { ...state, lastSavedAt: `${formattedDate}, ${formattedTime}` },
      score,
      totalCompliant,
      totalIssues,
    };

    // Filter out if duplicate ID exists, prepend new item, cap at exactly 5 items
    const updated = [newItem, ...history.filter(h => h.id !== newItem.id)].slice(0, 5);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save audit session history to localStorage:', err);
    return [];
  }
}

export function deleteAuditHistoryItem(id: string): AuditSessionHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const history = loadAuditHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to delete audit history item:', err);
    return [];
  }
}

export function clearAuditHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear audit history:', err);
  }
}
