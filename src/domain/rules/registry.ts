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
    clause: 'Para 3.2.5 Table rows 2(a) and 2(b)',
    confidence: 'gazette',
    derivedFrom: ['roadWidth', 'areaType'],
    checked: '2026-09-10',
    quote:
      'Built-up 2(a): base 1.5 throughout; Max FAR 9–12m 2.0, >12–18m 3.0, >18–24m 3.0, >24–45m 5.25, >45m Unrestricted. ' +
      'Non-built-up 2(b): base 2.5 throughout; Max FAR >12–18m 5.0, >18–24m 5.0, >24–45m 8.75, >45m Unrestricted — ' +
      'and no band below 12 m, so a new layout carries no group housing on a 9 m road.',
    ifWrong: 'Scheme viability would be misstated on every group housing project.',
  },

  'far.road-width-commercial': {
    id: 'far.road-width-commercial',
    question: 'How much floor area may a commercial or institutional building have?',
    clause: 'Para 3.2.5 Table rows 3(a) and 3(b)',
    confidence: 'inferred',
    derivedFrom: ['roadWidth', 'areaType'],
    checked: '2026-09-10',
    ifWrong:
      'Rows 3(a) and 3(b) — shops, convenience shopping and commercial units — are now read from the gazette. The same two ladders are still applied by analogy to ten other occupancies, from hotels to warehouses, each of which the gazette gives its own row.',
    challenge: {
      id: 'V-003',
      summary:
        'The gazette carries a per-occupancy, per-area-type FAR matrix running roughly 1,400 lines and forty-odd rows: commercial complexes and malls start at 12 m and 18 m roads rather than 9 m, hotels, cinemas, petrol stations, hospitals, schools, auditoria, guest houses, industry, flatted factories and data centres each have their own ceilings. Only rows 3(a) and 3(b) have been transcribed. Every other occupancy currently reads a table written for shops.',
      derivedFromInstead: ['occupancy', 'roadWidth', 'areaType'],
    },
  },

  'compounding.schedule': {
    id: 'compounding.schedule',
    question: 'What does it cost to regularise a deviation, and can it be regularised at all?',
    clause: 'Chapter 16 — 16.1.3, 16.2, 16.3.6, 16.3.7 and the Schedule at 16.3.8 (Rule No 4)',
    confidence: 'gazette',
    derivedFrom: ['occupancy', 'plotArea', 'buildingHeight'],
    checked: '2026-09-10',
    quote:
      'Compoundable limits (16.2), column A (<=15 m, and multi-units up to 17.5 m, except group housing): front "25% of front setback area up to a maximum of 1.0 meter"; rear, residential "(a) Plot Size up to 500 sqm- 100% compoundable in cases where proper provisions have been made for light and ventilation. (b) Plot Size > 500 sqm - construction up to maximum 10% of the area in rear setback (in addition to permissible 40%)", others "10 percent of rear setback area"; side "Construction up to a maximum of 25% of width of side setback"; FAR "Construction up to a maximum of 10% of total permissible FAR"; height "Construction up to a maximum of 10% height from permissible limit without changing the number of floors"; units "Maximum one unit in plotted development beyond permissible limit". Column B (>15 m, and group housing, except multi-units): setbacks "10 percent of setback area (maximum up to a width of 1-meter), subject to Fire NOC" (printed as one cell spanning the front, rear and side rows); FAR the same 10%; height "-"; units "In Group Housing: Proportionate units relative to percentage of compoundable additional FAR/Purchasable FAR". Fee schedule (16.3.8): Item 1 Rs. 25/38/50/62 per sqm by plot size, x2.0 commercial, x1.5 office, x0.4 industrial, x0.5 facilities, and Item 1F "Rs. 122640 per unit"; Item 2, percent of the price of land, column A front 100/200/150/40/50, side 75/150/100/40/50, rear 50/100/75/20/25, column B all sides 100/200/150/40/50; Item 3 "Rs. 491 per sqm. and 50% of required land price for additional floor area" (982/100%, 736/75%, 196/40%, 246/50%); Item 4 basement 50/100/75/20/25 percent; Items 5-8 room dimensions Rs. 246 and Rs. 123 residential; Item 9 compound wall Rs. 123 per running metre, minimum Rs. 5000; Item 10 height "@Rs. 6132/- per running meter of height (measured as per periphery of existing building) per floor"; Item 11 layout 1.0 percent of land price on saleable area; Item 12 "two times of price of land equivalent to decrease in the area required". Land basis (16.3.6.1): "only the residential rate of the land shall be taken into consideration".',
    ifWrong:
      'Every rupee figure the app shows would be wrong, and a deviation the byelaws bar outright could be presented as purchasable.',
    challenge: {
      id: 'V-004b',
      summary:
        'One quantity in the schedule remains ambiguous. Item 10 charges "per running meter of height (measured as per periphery of existing building) per floor". Read as the building perimeter over its floors, or as the metres of excess height? The readings differ by orders of magnitude. The engine charges the larger and says so on the line item.',
      maxDivergence: 'orders of magnitude on the height head only',
    },
  },

  'social.ews-lig': {
    id: 'social.ews-lig',
    question: 'Must some of the homes be reserved for lower-income buyers, and can that be bought out?',
    clause: 'Chapter 4.3.1 (reservation), 4.3.3 (minimum sizes), 4.3.11 (fee), 4.4 Note-2 (exemption)',
    confidence: 'gazette',
    derivedFrom: ['occupancy', 'plotArea'],
    checked: '2026-09-10',
    quote:
      '4.3.1: "For all housing projects (except affordable housing schemes) having more than one unit, a 10% each of the total units shall be mandatorily reserved for Economically Weaker Section (EWS) and Lower Income Group (LIG) housing respectively. For plots less than 4 Ha, provision to deposit shelter fee shall be applicable." ' +
      '4.3.11: "Shelter Fees = 10% of [(total number of dwelling units) X (minimum EWS dwelling unit carpet area + minimum LIG dwelling unit carpet area) X Circle Rate]". ' +
      '4.3.3 minimum group-housing carpet areas: EWS =>30 – 35 sqm, LIG >35 – 45 sqm. ' +
      '4.4 Note-2: "In such affordable housing schemes, the provisions of paragraph 4.3.1 shall not be applicable, i.e. mandatory EWS and LIG requirements or shelter fee requirements shall not be applicable."',
    ifWrong:
      'A scheme of four hectares or more would be told it can buy its way out of an obligation the gazette gives it no way to buy out of, and multi-unit plotted development would be exempted from the reservation altogether.',
  },

  'setback.bazaar-street': {
    id: 'setback.bazaar-street',
    question: 'How far back must a shop on a bazaar street sit from the road?',
    clause: 'Clause 5.1.5, printed again at Clause 3.2.4.3 Note-3',
    confidence: 'gazette',
    derivedFrom: ['roadWidth'],
    checked: '2026-09-10',
    quote:
      'Note-3: "The permissible front setbacks for buildings on bazaar street shall be as follows (also defined in Chapter-5)." ' +
      'Proposed width of road (metres) / Minimum open space in front (metres): 12 → 3.0, 18 → 4.5, 24 → 6.0, 30 → 6.0, 36 → 7.5, 45 → 7.5, 76 → 9.0. ' +
      'Both printings of the table are identical.',
    ifWrong:
      'Every bazaar-street plot would be assessed against a table written for ordinary commercial plots, which is keyed on plot area and gives an unrelated answer.',
    challenge: {
      id: 'V-012',
      summary:
        'The gazette lists discrete road widths, not bands, and says nothing about a road between two of them. The engine rounds up to the next listed width, which is the stricter reading; taking the largest listed width at or below the actual road would give a smaller setback.',
      maxDivergence: '1.5 m of front setback',
    },
  },

  'far.purchasable-commercial': {
    id: 'far.purchasable-commercial',
    question: 'How much of a building’s floor area is base, how much is purchasable, and how much is premium?',
    clause: 'Clauses 4.2.8, 4.4, 5.1.4, 5.2.5, 5.3.5 and 5.4.4 — seven printed tables',
    confidence: 'gazette',
    derivedFrom: ['occupancy', 'roadWidth', 'areaType', 'plotArea'],
    checked: '2026-09-10',
    quote:
      'One BFAR column shared across four road bands, each band carrying its own PFAR, PPFAR and MFAR. Built-up: commercial units up to 100 sqm BFAR 1.5, MFAR 2.1 / 3.0 / 5.25 / UR; units above 100 sqm same base, MFAR 1.5 / 3.0 / 5.25 / UR; shopping malls BFAR 2.0, MFAR 2.0 / 4.0 / 7.0 / UR. Non-built-up: units up to 100 sqm BFAR 1.75, MFAR 2.45 / 3.6 / 6.1 / UR; units above 100 sqm MFAR 1.75 / 3.6 / 6.1 / UR; malls BFAR 3.0, MFAR 3.0 / 6.0 / 10.5 / UR. MFAR = BFAR + PFAR + PPFAR on all 24 band checks.',
    ifWrong:
      'The engine treats everything above base FAR as one purchasable lump. Chapter 9 prices purchasable and premium purchasable differently, so the split decides the charge.',
    challenge: {
      id: 'V-014',
      summary:
        'Six cells disagree between Chapter 3 and the per-occupancy breakdowns, across group housing, commercial units, shopping malls and multiplexes. The breakdown figure decomposes exactly into its own published components in every case and Chapter 3\'s does not, which suggests Chapter 3 is a rounded summary — but nothing subordinates either chapter, so the engine keeps Chapter 3\'s lower ceiling. A further five bands are printed in the breakdowns and absent from Chapter 3.',
      maxDivergence: '1.5 FAR, on a non-built-up shopping mall or multiplex above a 24 m road',
    },
  },

  'far.mixed-use': {
    id: 'far.mixed-use',
    question: 'How much floor area may a mixed-use building have?',
    clause: 'Clause 8.1.3.1',
    confidence: 'gazette',
    derivedFrom: ['roadWidth', 'areaType'],
    checked: '2026-09-10',
    quote:
      'MU Built-up Area: base 2.0; Max FAR Upto 12m 2.0, >12–24m 4.0, >24–45m 5.25 as printed, '
      + '>45m Unrestricted. MU non-built-up Area: base 2.5; Max FAR 2.5 / 5.0 / 6.25 / Unrestricted. '
      + 'Chapter 3\'s matrix prints no mixed-use row at all, so this is the only table for the use.',
    ifWrong:
      'Mixed use was assessed on the commercial ladder written for shops — base 1.5 built-up against the 2.0 Chapter 8 gives it — so every mixed-use project was told it had roughly a quarter less base floor area than the byelaws allow.',
    challenge: {
      id: 'V-025',
      summary:
        'Two of the table\'s eight cells contradict themselves, and in opposite directions: the built-up 24–45 m band prints a maximum of 5.25 where its own components sum to 4.5, and the new-layout band prints 6.25 where they sum to 8.75. Standing rule 4 resolves each to the lower figure. With no Chapter 3 row to fall back on, there is no independent reading to check either against.',
      maxDivergence: '2.5 FAR, on a new layout above a 24 m road',
    },
  },

  'far.tod': {
    id: 'far.tod',
    question: 'How much floor area may a building in a Transit Oriented Development zone have?',
    clause: 'Clause 8.2.2.2',
    confidence: 'gazette',
    derivedFrom: ['roadWidth'],
    checked: '2026-09-10',
    quote:
      'Minimum right of way 12m — 150% of base FAR. >12–24m — 250%. >24–45m — 350%. >45m — Unrestricted. '
      + 'Base FAR in every row is "As per byelaws". Note (2): the charges for purchasable FAR and '
      + 'premium purchasable FAR shall be the same.',
    ifWrong:
      'Nothing in the app is decided by this yet. The ladder is read and tested; what is missing is any way for a project to say it sits in a TOD zone.',
    challenge: {
      id: 'V-026',
      summary:
        'TOD FAR is a multiplier on whatever base FAR the underlying use carries, so it cannot be resolved without first resolving that use — and it applies only inside a notified TOD zone, which is a fact about the plot that `ProjectState` has no field for. The ladder is modelled and unused rather than guessed at.',
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
