/**
 * Every question the engine can be asked, declared once.
 *
 * Until this file existed the set of questions was whatever `SitePanel` happened to
 * render, and the two disagreed with the engine in both directions. `masterPlanZone`
 * decides Clause 15.3 — whether this use may go on this plot at all, the app's own first
 * question — and had no control anywhere in the interface, so the verdict panel nagged
 * "the land-use question is unanswered" at a user who had no way to answer it. `areaType`
 * moves the FAR ceiling and the minimum road width, and had no control either. Meanwhile
 * "Stilt floor for parking" was a checkbox a user could tick, and `conflicts.ts` says in
 * its own words that `ProjectState.hasStilt` "exists and is deliberately not consulted".
 *
 * The interface should not be the list of questions. This is the list of questions, and
 * `sensitivity.ts` decides from the engine — not from a hand-curated guess — which of them
 * can change the answer for the project in front of you. A field added to `ProjectState`
 * and not registered here fails a test rather than quietly going unasked.
 */

import { MASTER_PLAN_AUTHORITIES, zonesOfAuthority } from './master-plan-zones';
import {
  HIGH_RISE_M, OCCUPANCIES, OCCUPANCY_GROUPS, OCCUPANCY_IDS, forArea, occupanciesInGroup,
} from './occupancy';
import { BUILDING_STAGE_LABEL, ProjectState, derivePlotDepth } from './project';
import { ZONE_LABEL, ZoneCode } from './zoning';

/** The fields of `ProjectState` that are questions rather than bookkeeping. */
export type InputId =
  | 'occupancy' | 'buildingStage' | 'plotArea' | 'proposedBuiltUpArea'
  | 'roadWidth' | 'buildingHeight' | 'masterPlanZone' | 'areaType'
  | 'plotFrontage' | 'plotDepth' | 'isCornerPlot' | 'zonalCoverageCapPct'
  | 'frontSetbackProvided' | 'rearSetbackProvided' | 'side1Provided' | 'side2Provided'
  | 'parkingBaysProvided' | 'hasRWH' | 'hasSolarPv' | 'hasSolarHeating' | 'hasStilt'
  | 'greenRating' | 'isAffordableHousingScheme' | 'circleRate' | 'cityName';

/**
 * The fields that are deliberately not questions: a name on a report cannot change what
 * the byelaws permit, and `mode` chooses how much of the answer to print rather than what
 * the answer is. Listed rather than implied, so the completeness test can check that every
 * field of `ProjectState` is either a question or knowingly one of these.
 */
export const NON_INPUT_FIELDS = [
  'projectName', 'applicantName', 'plotNumber', 'schemeName', 'architectName',
  'engineerName', 'mode', 'latitude', 'longitude', 'lastSavedAt', 'answered',
] as const;

export type InputKind = 'number' | 'boolean' | 'choice' | 'text';

/** Where a question belongs on screen once it has been asked. */
export type InputGroup = 'what' | 'plot' | 'building' | 'envelope' | 'provisions' | 'money';

export const GROUP_LABEL: Readonly<Record<InputGroup, string>> = {
  what: 'What you are building',
  plot: 'The plot',
  building: 'The building',
  envelope: 'Setbacks you have drawn',
  provisions: 'What you are providing',
  money: 'Rates and local plan',
};

export interface InputOption {
  readonly value: string;
  readonly label: string;
  /** Renders as an `<optgroup>` where present. */
  readonly group?: string;
}

export interface InputDefinition {
  readonly id: InputId;
  /** The question as a person would be asked it, in plain words. */
  readonly question: string;
  /** Two or three words, for a list of answers. */
  readonly label: string;
  readonly kind: InputKind;
  readonly group: InputGroup;
  readonly unit?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** Choices, which may depend on the rest of the project (zone names come from the city). */
  readonly options?: (project: ProjectState) => readonly InputOption[];
  /** Suggestions for a free-text field. */
  readonly suggestions?: readonly string[];

  /**
   * The three questions without which there is no question. These are asked of everyone,
   * always, because a verdict computed without them is not a verdict about anything: an
   * occupancy and a plot decide which tables are read at all, and whether the building
   * exists decides whether Chapter 16 is pricing a deviation or fining a drawing.
   */
  readonly framing?: boolean;

  /**
   * What the app is assuming while this question is unanswered, said plainly. Shown
   * verbatim in the assumption ledger, so it must be true of the default value and must
   * not dress a guess up as a derivation.
   */
  readonly because: string;

  /**
   * Values to try when testing whether this input can change the answer. For a boolean or
   * a fixed set of choices this is every value the field can take and the result is exact.
   * For a number it is a ladder placed across the thresholds the byelaws actually use, and
   * the result is a sample — see `exhaustive`.
   */
  readonly probes: (project: ProjectState) => readonly unknown[];
  /** True where `probes` returns every value the field can hold. */
  readonly exhaustive: boolean;

  /**
   * Set where the engine holds the field but never reads it. The sensitivity sweep would
   * report this anyway; saying it here names the reason rather than leaving the reader to
   * infer that their answer was ignored by accident.
   */
  readonly notConsulted?: string;

  /** How the current answer reads in a sentence: "3.5 m", "not looked up", "yes". */
  readonly format?: (project: ProjectState) => string;

  /**
   * A remark about the answer currently in the box — that the road is narrower than this
   * occupancy may be built on, that this height crosses into the high-rise regime. Shown
   * under the control, and never blocking: the engine's job is to say what follows from a
   * number, not to refuse it.
   */
  readonly note?: (project: ProjectState) => { readonly text: string; readonly tone: 'warn' | 'hint' } | undefined;
}

const ladder = (...values: number[]) => () => values;

/** A ladder placed around whatever the user currently has, for a field with no fixed scale. */
const around = (id: InputId, ...absolute: number[]) =>
  (p: ProjectState): number[] => {
    const current = Number(p[id as keyof ProjectState] ?? 0);
    return [...absolute, current * 0.4, current * 2.2].map((n) => Math.max(0, Number(n.toFixed(2))));
  };

const BOTH = () => [true, false];

const SETBACK_PROBES = ladder(0, 1.2, 3, 6, 12);

const zoneOptions = (project: ProjectState): InputOption[] => {
  const local = zonesOfAuthority(project.cityName);
  const named = new Map<ZoneCode, string[]>();
  for (const row of local) named.set(row.zone, [...row.names]);
  return [
    { value: 'unknown', label: 'I have not looked it up' },
    ...(Object.keys(ZONE_LABEL) as ZoneCode[]).map((code) => ({
      value: code,
      // Appendix-15 exists precisely so the question can be asked the way an applicant can
      // answer it: nobody's master plan prints "C-2", it prints "Convenience Shopping".
      label: named.has(code)
        ? `${named.get(code)!.join(' / ')} — ${ZONE_LABEL[code]} (${code})`
        : `${ZONE_LABEL[code]} (${code})`,
      group: named.has(code) ? `On the ${project.cityName} plan` : 'Other zones',
    })),
  ];
};

export const INPUTS: readonly InputDefinition[] = [
  {
    id: 'occupancy',
    question: 'What are you building?',
    label: 'Building type',
    kind: 'choice', group: 'what', framing: true, exhaustive: true,
    because: 'a single dwelling, which is what most people opening this are holding',
    // Plain mode names the building the way someone would say it out loud; precise mode
    // names it the way the byelaws' own occupancy table does.
    options: (p) =>
      OCCUPANCY_GROUPS.flatMap((g) =>
        occupanciesInGroup(g).map((o) => ({
          value: o.id, label: p.mode === 'simple' ? o.plain : o.label, group: g,
        })),
      ),
    probes: () => OCCUPANCY_IDS,
    format: (p) => OCCUPANCIES[p.occupancy]?.label ?? p.occupancy,
  },
  {
    id: 'buildingStage',
    question: 'Has it been built?',
    label: 'Stage',
    kind: 'choice', group: 'what', framing: true, exhaustive: true,
    because: 'nothing is built yet, so a rule broken on paper is redrawn rather than fined',
    options: () =>
      (Object.keys(BUILDING_STAGE_LABEL) as (keyof typeof BUILDING_STAGE_LABEL)[])
        .map((s) => ({ value: s, label: BUILDING_STAGE_LABEL[s] })),
    probes: () => Object.keys(BUILDING_STAGE_LABEL),
    format: (p) => BUILDING_STAGE_LABEL[p.buildingStage],
  },
  {
    id: 'plotArea',
    question: 'How big is the plot?',
    label: 'Plot area',
    kind: 'number', group: 'plot', framing: true, exhaustive: false,
    unit: 'm²', min: 10, step: 10,
    because: '320 m², a 200-square-yard plot',
    // Every plot-area threshold the byelaws turn on: the dwelling minima, rainwater
    // harvesting at 300, solar photovoltaics at 500, the EWS and shelter-fee bands.
    probes: ladder(45, 100, 200, 300, 500, 1000, 2000, 3000, 5000),
  },
  {
    id: 'proposedBuiltUpArea',
    question: 'How much floor area do you want?',
    label: 'Floor area wanted',
    kind: 'number', group: 'building', exhaustive: false,
    unit: 'm²', min: 10, step: 10,
    because: '450 m², roughly what a plot this size is entitled to',
    probes: around('proposedBuiltUpArea', 60, 300, 1500, 5000),
  },
  {
    id: 'roadWidth',
    question: 'How wide is the road it faces?',
    label: 'Road width',
    kind: 'number', group: 'plot', exhaustive: false,
    unit: 'm', min: 3, step: 1,
    because: '12 m, the commonest sanctioned width and wide enough for most things',
    // Clause 4.1.3's access minima, the FAR bands, and the 18 m gate on purchasable FAR.
    probes: ladder(4, 6, 9, 12, 18, 24, 30, 45),
    note: (p) => {
      const need = forArea(OCCUPANCIES[p.occupancy].minRoadWidthM, p.areaType);
      return p.roadWidth < need
        ? { text: `Clause 4.1.3 wants ${need} m for this use here`, tone: 'warn' as const }
        : undefined;
    },
  },
  {
    id: 'buildingHeight',
    question: 'How tall will it be?',
    label: 'Height',
    kind: 'number', group: 'building', exhaustive: false,
    unit: 'm', min: 3, step: 0.5,
    because: '12 m, about four storeys',
    // 15 m starts the high-rise regime; 17.5 m is the stilt reading of it; 30 and 45 move
    // the fire and structural ladders.
    probes: ladder(7, 12, 15, 17.5, 21, 30, 45, 60),
    note: (p) => (p.buildingHeight > HIGH_RISE_M
      ? { text: 'Above 15 m, so the high-rise fire and structural rules apply', tone: 'hint' as const }
      : undefined),
  },
  {
    id: 'masterPlanZone',
    question: 'What does the master plan zone this plot as?',
    label: 'Master plan zone',
    kind: 'choice', group: 'what', exhaustive: true,
    because: 'you have not looked it up',
    options: zoneOptions,
    probes: () => ['unknown', ...Object.keys(ZONE_LABEL)],
    format: (p) => (p.masterPlanZone === 'unknown' ? 'not looked up' : `${ZONE_LABEL[p.masterPlanZone]} (${p.masterPlanZone})`),
  },
  {
    id: 'areaType',
    question: 'Is this an established area or a new layout?',
    label: 'Area type',
    kind: 'choice', group: 'plot', exhaustive: true,
    because: 'an established built-up area rather than a new layout',
    options: () => [
      { value: 'built_up', label: 'Established built-up area' },
      { value: 'non_built_up', label: 'New layout on open land' },
    ],
    probes: () => ['built_up', 'non_built_up'],
    format: (p) => (p.areaType === 'built_up' ? 'established built-up area' : 'new layout'),
  },
  {
    id: 'plotFrontage',
    question: 'How wide is the road-facing edge?',
    label: 'Frontage',
    kind: 'number', group: 'plot', exhaustive: false,
    unit: 'm', min: 3, step: 0.5,
    because: '14 m, which leaves the depth to follow from the area',
    probes: around('plotFrontage', 4.5, 9, 18, 30),
    format: (p) => `${p.plotFrontage} m, depth ${derivePlotDepth(p).toFixed(1)} m`,
  },
  {
    id: 'plotDepth',
    question: 'How deep is the plot?',
    label: 'Depth',
    kind: 'number', group: 'plot', exhaustive: false,
    unit: 'm', min: 0, step: 0.5,
    because: 'taken as the area divided by the frontage, which assumes a rectangle',
    probes: around('plotDepth', 0, 9, 18, 40),
    format: (p) => (p.plotDepth > 0 ? `${p.plotDepth} m` : `${derivePlotDepth(p).toFixed(1)} m, from area ÷ frontage`),
  },
  {
    id: 'isCornerPlot',
    question: 'Does it face two roads?',
    label: 'Corner plot',
    kind: 'boolean', group: 'plot', exhaustive: true,
    because: 'one road frontage',
    probes: BOTH,
  },
  {
    id: 'frontSetbackProvided',
    question: 'How much have you left at the front?',
    label: 'Front setback',
    kind: 'number', group: 'envelope', exhaustive: false,
    unit: 'm', min: 0, step: 0.1,
    because: '3.5 m, a common front setback rather than one read off your drawing',
    probes: SETBACK_PROBES,
  },
  {
    id: 'rearSetbackProvided',
    question: 'How much have you left at the rear?',
    label: 'Rear setback',
    kind: 'number', group: 'envelope', exhaustive: false,
    unit: 'm', min: 0, step: 0.1,
    because: '3 m, a common rear setback rather than one read off your drawing',
    probes: SETBACK_PROBES,
  },
  {
    id: 'side1Provided',
    question: 'How much have you left on the left side?',
    label: 'Left setback',
    kind: 'number', group: 'envelope', exhaustive: false,
    unit: 'm', min: 0, step: 0.1,
    because: '1.5 m, a common side setback rather than one read off your drawing',
    probes: SETBACK_PROBES,
  },
  {
    id: 'side2Provided',
    question: 'How much have you left on the right side?',
    label: 'Right setback',
    kind: 'number', group: 'envelope', exhaustive: false,
    unit: 'm', min: 0, step: 0.1,
    because: '1.5 m, a common side setback rather than one read off your drawing',
    probes: SETBACK_PROBES,
  },
  {
    id: 'parkingBaysProvided',
    question: 'How many car spaces have you drawn?',
    label: 'Parking',
    kind: 'number', group: 'provisions', exhaustive: false,
    unit: 'car spaces', min: 0, step: 1,
    because: 'four car spaces',
    probes: around('parkingBaysProvided', 0, 2, 10, 60),
  },
  {
    id: 'hasRWH',
    question: 'Will there be rainwater harvesting?',
    label: 'Rainwater harvesting',
    kind: 'boolean', group: 'provisions', exhaustive: true,
    because: 'yes, which is the answer that makes the check pass',
    probes: BOTH,
  },
  {
    id: 'hasSolarPv',
    question: 'Will there be solar photovoltaics?',
    label: 'Solar photovoltaics',
    kind: 'boolean', group: 'provisions', exhaustive: true,
    because: 'no',
    probes: BOTH,
  },
  {
    id: 'hasSolarHeating',
    question: 'Will there be solar water heating?',
    label: 'Solar water heating',
    kind: 'boolean', group: 'provisions', exhaustive: true,
    because: 'no',
    probes: BOTH,
  },
  {
    id: 'hasStilt',
    question: 'Is the ground floor a stilt for parking?',
    label: 'Stilt floor',
    kind: 'boolean', group: 'provisions', exhaustive: true,
    because: 'yes',
    probes: BOTH,
    // Clause 10.1.3(a) governs "multi-storied buildings"; Clause 1.2(m) defines the term
    // 2.5 m higher for a stilted building. Rather than pick a reading, the engine applies
    // the flat 15 m and emits a caveat between 15 and 17.5 — so this answer changes
    // nothing, and the interface should say so instead of collecting it.
    notConsulted:
      'The engine holds this but never reads it. Whether a stilt raises the 15 m high-rise '
      + 'threshold to 17.5 m is an open conflict (C-016); until it is settled the stricter '
      + '15 m is applied to everyone and a caveat is shown instead.',
  },
  {
    id: 'greenRating',
    question: 'Will it be certified green?',
    label: 'Green rating',
    kind: 'choice', group: 'provisions', exhaustive: true,
    because: 'no rating, so no FAR bonus',
    options: () => [
      { value: 'none', label: 'No rating' },
      { value: 'silver', label: 'GRIHA 3-star / IGBC Silver — +3% FAR' },
      { value: 'gold', label: 'GRIHA 4-star / IGBC Gold — +5% FAR' },
      { value: 'platinum', label: 'GRIHA 5-star / IGBC Platinum — +7% FAR' },
    ],
    probes: () => ['none', 'silver', 'gold', 'platinum'],
  },
  {
    id: 'isAffordableHousingScheme',
    question: 'Is this a government affordable-housing scheme?',
    label: 'Affordable-housing scheme',
    kind: 'boolean', group: 'what', exhaustive: true,
    because: 'no, so the EWS and LIG obligation under Clause 4.4 stands',
    probes: BOTH,
  },
  {
    id: 'circleRate',
    question: 'What is the residential circle rate here?',
    label: 'Circle rate',
    kind: 'number', group: 'money', exhaustive: false,
    unit: '₹/m²', min: 0, step: 1000,
    because: '₹35,000/m², a rate every fee in the bill moves in direct proportion to',
    probes: around('circleRate', 6000, 20000, 90000, 250000),
    format: (p) => `₹${p.circleRate.toLocaleString('en-IN')}/m²`,
  },
  {
    id: 'zonalCoverageCapPct',
    question: 'Does your zonal plan cap ground coverage?',
    label: 'Ground coverage cap',
    kind: 'number', group: 'money', exhaustive: false,
    unit: '%', min: 0, max: 100, step: 5,
    because: 'none, since the byelaws print no coverage percentage and your own plan has not been read',
    probes: ladder(0, 25, 40, 55, 75, 90),
    format: (p) => (p.zonalCoverageCapPct > 0 ? `${p.zonalCoverageCapPct}%` : 'none stated'),
  },
  {
    id: 'cityName',
    question: 'Which authority sanctions here?',
    label: 'Authority',
    kind: 'text', group: 'money', exhaustive: false,
    because: 'Lucknow',
    suggestions: MASTER_PLAN_AUTHORITIES,
    probes: () => [...MASTER_PLAN_AUTHORITIES.slice(0, 6), 'Somewhere not in Appendix-15'],
  },
];

export const INPUT_IDS: readonly InputId[] = INPUTS.map((i) => i.id);

const BY_ID = new Map<InputId, InputDefinition>(INPUTS.map((i) => [i.id, i]));

export function getInput(id: InputId): InputDefinition {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`No such input: ${id}`);
  return found;
}

export function isInputId(value: unknown): value is InputId {
  return typeof value === 'string' && BY_ID.has(value as InputId);
}

/** The questions asked of everyone, in the order they are asked. */
export const FRAMING_INPUTS: readonly InputId[] = INPUTS.filter((i) => i.framing).map((i) => i.id);

/** What this project currently answers for one question, in words. */
export function describeAnswer(project: ProjectState, id: InputId): string {
  const def = getInput(id);
  if (def.format) return def.format(project);
  const value = project[id as keyof ProjectState];
  if (def.kind === 'boolean') return value ? 'yes' : 'no';
  if (def.kind === 'choice') {
    const option = def.options?.(project).find((o) => o.value === String(value));
    return option?.label ?? String(value);
  }
  if (def.kind === 'number') return `${value}${def.unit ? ` ${def.unit}` : ''}`;
  return String(value || '—');
}
