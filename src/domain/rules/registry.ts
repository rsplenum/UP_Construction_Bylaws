/**
 * ANGLE C — the register of what this engine claims, and on what authority.
 *
 * Every rule the engine applies appears here. The engine reads the numbers from the
 * ladders in `far.ts` and `setbacks.ts`; this says where those numbers came from and how
 * far they can be trusted. Anything absent from this register is, by definition,
 * unreviewed.
 */

import { RuleSet } from './schema';

export const RULES: RuleSet = {
  'setback.plotted-residential': {
    id: 'setback.plotted-residential',
    question: 'How far must a plotted house sit from each boundary?',
    clause: 'Para 3.2.4.1 (Table 3.2.1)',
    confidence: 'gazette',
    derivedFrom: ['plotArea'],
    quote:
      'Up to 150: 1 / 0 / 0 / 0. >150 to 300: 3 / 1.5 / 0 / 0. >300 to 500: 3 / 3 / 0 / 0. ' +
      '>500 to 1200: 4.5 / 4.5 / 1.5 / 0. >1200: 6 / 6 / 1.5 / 1.5.',
    checked: '2026-09-10',
    ifWrong:
      'Every front setback the engine reports is derived from the wrong input. The error is largest on small plots facing wide roads, and on large plots facing narrow ones.',
  },

  'setback.high-rise': {
    id: 'setback.high-rise',
    question: 'How much clear space must a building over 15 m keep on every side?',
    clause: 'Clause 3.2.4.9',
    confidence: 'gazette',
    checked: '2026-09-10',
    quote: '>15–17.5: 5 all round. >17.5–21: 6. >21–27: 7. >27–33: 8. >33–39: 9. >39–45: 10. >45–51: 11. >51: 15 front, 12 others.',
    derivedFrom: ['buildingHeight'],
    ifWrong:
      'Fire tender access would be assessed against the wrong figure. These setbacks are non-compoundable, so an error here cannot be corrected by a fee later.',
  },

  'far.telescopic-residential': {
    id: 'far.telescopic-residential',
    question: 'How much floor area may a plotted house have?',
    clause: 'Section 3.2.2 & 3.2.2.1',
    confidence: 'gazette',
    derivedFrom: ['plotArea'],
    quote:
      'Up to 150 — Base FAR 2.0, Max FAR 2.0. >150 to 300 — 1.8 / 2.0. >300 to 500 — 1.75 / 2.0. ' +
      '>500 to 1200 — 1.5 / 2.0. >1200 — 1.25 / 2.0.',
    checked: '2026-09-10',
    ifWrong:
      'The headline figure — how much you may build — would be wrong on every plotted residential project.',
  },

  'far.road-width-group-housing': {
    id: 'far.road-width-group-housing',
    question: 'How much floor area may a group housing scheme have?',
    clause: 'Section 3.2.2.2 & 4.2.8',
    confidence: 'gazette',
    derivedFrom: ['roadWidth'],
    checked: '2026-09-10',
    quote: 'Base FAR 1.5 built-up / 2.5 non-built-up at every road width. Max FAR: 9–12m 2.0, >12–18m 3.0, >18–24m 3.0, >24–45m 5.25, >45m unrestricted.',
    ifWrong: 'Scheme viability would be misstated on every group housing project.',
  },

  'far.road-width-commercial': {
    id: 'far.road-width-commercial',
    question: 'How much floor area may a commercial or institutional building have?',
    clause: 'Section 5.2.5',
    confidence: 'inferred',
    derivedFrom: ['roadWidth'],
    ifWrong:
      'Applied to eleven occupancies from shops to warehouses. The commercial matrix was extended to all of them by analogy, without a source for any occupancy other than commercial.',
    challenge: {
      id: 'V-003',
      summary:
        'Offices, hospitals, schools, assembly and industrial uses were routed to the commercial road-width FAR matrix because no separate matrix was available. The byelaws are likely to set these separately.',
    },
  },

  'compounding.schedule': {
    id: 'compounding.schedule',
    question: 'What does it cost to regularise a deviation?',
    clause: 'Chapter 16.3',
    confidence: 'inferred',
    derivedFrom: ['occupancy'],
    ifWrong:
      'Every rupee figure the app shows is wrong. The multipliers are a reconstruction: the codebase previously held three mutually inconsistent fee models and none matched the schedule in its own data layer.',
    challenge: {
      id: 'V-004',
      summary:
        'The retained model prices deviations as a multiple of the circle rate. A schedule in the data layer instead used flat per-square-metre rates (₹25–62/m² for residential). These are not reconcilable; one of them is not the byelaw.',
      maxDivergence: 'orders of magnitude',
    },
  },

  'occupancy.thresholds': {
    id: 'occupancy.thresholds',
    question: 'What road width, plot size and height does each use require?',
    clause: 'Chapter 15.3.2 and the occupancy chapters',
    confidence: 'inferred',
    derivedFrom: ['occupancy'],
    ifWrong:
      'The permissibility verdict — the first thing the app says — would be wrong. This is the newest and least sourced part of the engine: sixteen occupancies were defined in one pass to widen coverage.',
    challenge: {
      id: 'V-005',
      summary:
        'The sixteen-occupancy taxonomy was written to widen coverage from four. Minimum road widths, plot sizes, height caps and parking ratios were set by reasoning from the four that existed, not from the byelaws.',
    },
  },

  'parking.ecs-ratios': {
    id: 'parking.ecs-ratios',
    question: 'How many car spaces are required?',
    clause: 'Chapter 10 (Table 10.1)',
    confidence: 'inferred',
    derivedFrom: ['occupancy'],
    ifWrong: 'Parking provision would be misstated, which is a common cause of sanction refusal.',
  },

  'services.rwh-threshold': {
    id: 'services.rwh-threshold',
    question: 'When is rainwater harvesting compulsory?',
    clause: 'Chapter 13.1',
    confidence: 'secondary',
    derivedFrom: ['plotArea'],
    checked: '2026-09-09',
    ifWrong: 'A mandatory provision would be missed, blocking the completion certificate.',
  },
};

export const RULE_IDS = Object.keys(RULES);
