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
