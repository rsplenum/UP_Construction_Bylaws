/**
 * ANGLE C — the register of what this engine claims, and on what authority.
 *
 * Every rule the engine applies appears here. The engine reads the numbers from the
 * ladders in `far.ts` and `setbacks.ts`; this says where those numbers came from and how
 * far they can be trusted. Anything absent from this register is, by definition,
 * unreviewed.
 */

import { RuleSet } from './schema';

/* ---- Occupancy sets the applicability guards key on. -------------------------------
 *
 * Named rather than inlined so that a guard reads as the claim it makes: "this rule
 * speaks to plotted residential" is reviewable; a list of sixteen string literals
 * repeated at five call sites is not.
 */

/** Clause 3.2.2's telescopic ladder and Table 3.2.1's setbacks — single and multi unit. */
const PLOTTED_RESIDENTIAL = ['res_single', 'res_multi'] as const;

/**
 * Everything rows 3(a) and 3(b) are currently applied to. Ten of these have their own
 * printed row in the gazette and read this one anyway — that is V-003, and the guard
 * states the breadth of the claim so the register shows it without reading `far.ts`.
 */
const NON_RESIDENTIAL = [
  'com_shop', 'com_complex', 'com_mall', 'com_hotel', 'com_bazaar', 'office',
  'inst_health', 'inst_education', 'inst_assembly',
  'ind_light', 'ind_general', 'ind_warehouse',
] as const;

/**
 * Clause 12.2(a)'s scope — NBC groups B, C, D, E and F, plus multi-units and group
 * housing. Industrial, storage and hazardous are absent, and conspicuously: Clause
 * 10.1.3(b)'s parallel list for the fire certificate names all three. V-041 disputes
 * whether the list is closed, since the governing words are "used by the public".
 */
const ACCESSIBILITY_SCOPE = [
  'com_shop', 'com_complex', 'com_mall', 'com_hotel', 'com_bazaar', 'office',
  'inst_health', 'inst_education', 'inst_assembly',
  'res_multi', 'res_group_housing', 'mixed_use',
] as const;

/** The occupancies for which a printed BFAR/PFAR/PPFAR row exists (`purchasableRowFor`). */
const PRINTED_SPLIT_ROWS = [
  'res_group_housing', 'com_bazaar', 'com_shop', 'com_complex', 'com_mall', 'com_hotel',
  'mixed_use',
] as const;

/**
 * Clause 13.2.3.2 names six categories; four map onto an occupancy this engine knows.
 * The other two — armed-forces barracks, and hostels of more than 100 students — are in
 * `SOLAR_WATER_HEATING_UNMAPPED`, so this guard is narrower than the clause.
 */
const SOLAR_WATER_CATEGORIES = [
  'com_hotel', 'inst_health', 'inst_education', 'inst_assembly',
] as const;

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
    consumes: ['plotArea', 'occupancy', 'buildingHeight', 'cornerPlot'],
    // Table 3.2.1 carries a height ceiling in its own right — "three floors with stilts up
    // to 15 meter" under 300 m², "four storeys with stilts up to 17.5-meter" above it. That
    // is the Chapter 3 limb of V-010, and declaring it here is what puts two producers of
    // `maxHeight` in the graph.
    produces: ['requiredSetback', 'maxHeight'],
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: PLOTTED_RESIDENTIAL }], ranges: [{ fact: 'buildingHeight', max: 15 }] },
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
    consumes: ['buildingHeight'],
    produces: ['requiredSetback'],
    appliesWhen: { ranges: [{ fact: 'buildingHeight', min: 15, minInclusive: false }] },
    ifWrong:
      'Fire tender access would be assessed against the wrong figure. These setbacks are non-compoundable, so an error here cannot be corrected by a fee later.',
  },

  /**
   * Added when the graph showed six setback tables answering one question and only two of
   * them in the register (B-045). Chapter 3.2.4.2's flat 5 m is one of the four that had
   * no entry at all, so a group housing scheme's setback finding carried the plotted
   * residential rule's provenance.
   */
  'setback.group-housing': {
    id: 'setback.group-housing',
    question: 'How far must a group housing block below 15 m sit from each boundary?',
    clause: 'Clause 3.2.4.2',
    confidence: 'transcribed',
    derivedFrom: ['occupancy'],
    consumes: ['occupancy', 'buildingHeight'],
    produces: ['requiredSetback'],
    appliesWhen: {
      oneOf: [{ fact: 'occupancy', values: ['res_group_housing'] }],
      ranges: [{ fact: 'buildingHeight', max: 15 }],
    },
    ifWrong:
      'Every group housing scheme below the high-rise threshold is assessed against a flat 5 m on all four faces. The figure predates the verification pass and carries no line-anchored citation, so it cannot claim the gazette.',
  },

  /**
   * The four plot-area ladders for non-residential uses below 15 m — commercial,
   * healthcare, educational and industrial. One entry rather than four because they are
   * one mechanism keyed on one input, and splitting them would say more than is known.
   */
  'setback.non-residential': {
    id: 'setback.non-residential',
    question: 'How far must a shop, hospital, school or factory below 15 m sit from each boundary?',
    clause: 'Chapter 3.2.4, with the per-use tables in Chapters 5, 6 and 7',
    confidence: 'transcribed',
    derivedFrom: ['plotArea', 'occupancy'],
    consumes: ['plotArea', 'occupancy', 'buildingHeight', 'cornerPlot'],
    produces: ['requiredSetback'],
    appliesWhen: {
      oneOf: [{ fact: 'occupancy', values: NON_RESIDENTIAL }],
      ranges: [{ fact: 'buildingHeight', max: 15 }],
    },
    ifWrong:
      'The envelope is wrong on every non-residential project below the high-rise threshold, and the error scales with plot size — B-005 found the commercial >3000 m² band missing entirely, giving 6 m of front setback where the gazette requires 12.',
    challenge: {
      id: 'V-052',
      summary:
        'Two of the four ladders — commercial and healthcare — were checked against the gazette on 2026-09-10 and carry that note in `setbacks.ts`. The educational and industrial ladders have never been checked against any source, and neither of the two that were carries a line-anchored citation, so none of the four may claim gazette confidence.',
      derivedFromInstead: ['plotArea', 'occupancy', 'roadWidth'],
    },
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
    consumes: ['plotArea', 'occupancy', 'farIncentive'],
    produces: ['baseFar', 'ceilingFar'],
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: PLOTTED_RESIDENTIAL }] },
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
    consumes: ['occupancy', 'roadWidth', 'areaType', 'farIncentive'],
    produces: ['baseFar', 'ceilingFar'],
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['res_group_housing'] }] },
    ifWrong: 'Scheme viability would be misstated on every group housing project.',
  },

  'far.road-width-commercial': {
    id: 'far.road-width-commercial',
    question: 'How much floor area may a commercial or institutional building have?',
    clause: 'Para 3.2.5 Table rows 3(a) and 3(b)',
    confidence: 'inferred',
    derivedFrom: ['roadWidth', 'areaType'],
    checked: '2026-09-10',
    consumes: ['roadWidth', 'areaType', 'occupancy', 'farIncentive'],
    produces: ['baseFar', 'ceilingFar'],
    // V-003: the gazette gives each of these its own row and the engine reads one table
    // written for shops. The guard states the breadth of that claim rather than hiding it.
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: NON_RESIDENTIAL }] },
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
    clause: 'Chapter 16 — 16.3.2, 16.3.3, 16.3.5, 16.3.7 and the Schedule at 16.3.8 (Rule No 4)',
    confidence: 'gazette',
    derivedFrom: ['occupancy', 'plotArea', 'buildingHeight'],
    checked: '2026-09-10',
    quote:
      'Compoundable limits (16.3.3), column A (<=15 m, and multi-units up to 17.5 m, except group housing): front "25% of front setback area up to a maximum of 1.0 meter"; rear, residential "(a) Plot Size up to 500 sqm- 100% compoundable in cases where proper provisions have been made for light and ventilation. (b) Plot Size > 500 sqm - construction up to maximum 10% of the area in rear setback (in addition to permissible 40%)", others "10 percent of rear setback area"; side "Construction up to a maximum of 25% of width of side setback"; FAR "Construction up to a maximum of 10% of total permissible FAR"; height "Construction up to a maximum of 10% height from permissible limit without changing the number of floors"; units "Maximum one unit in plotted development beyond permissible limit". Column B (>15 m, and group housing, except multi-units): setbacks "10 percent of setback area (maximum up to a width of 1-meter), subject to Fire NOC" (printed as one cell spanning the front, rear and side rows); FAR the same 10%; height "-"; units "In Group Housing: Proportionate units relative to percentage of compoundable additional FAR/Purchasable FAR". Fee schedule (16.3.8): Item 1 Rs. 25/38/50/62 per sqm by plot size, x2.0 commercial, x1.5 office, x0.4 industrial, x0.5 facilities, and Item 1F "Rs. 122640 per unit"; Item 2, percent of the price of land, column A front 100/200/150/40/50, side 75/150/100/40/50, rear 50/100/75/20/25, column B all sides 100/200/150/40/50; Item 3 "Rs. 491 per sqm. and 50% of required land price for additional floor area" (982/100%, 736/75%, 196/40%, 246/50%); Item 4 basement 50/100/75/20/25 percent; Items 5-8 room dimensions Rs. 246 and Rs. 123 residential; Item 9 compound wall Rs. 123 per running metre, minimum Rs. 5000; Item 10 height "@Rs. 6132/- per running meter of height (measured as per periphery of existing building) per floor"; Item 11 layout 1.0 percent of land price on saleable area; Item 12 "two times of price of land equivalent to decrease in the area required". Land basis (16.3.7(c)): "only the residential rate of the land shall be taken into consideration".',
    consumes: [
      'occupancy', 'plotArea', 'buildingHeight', 'landRate', 'floorCount',
      'requiredSetback', 'ceilingFar', 'maxHeight', 'seismicMandatory',
      'fireClearanceRequired', 'accessibilityRequired',
    ],
    produces: ['compoundableLimit', 'compoundingFee', 'nonCompoundable'],
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
    consumes: ['occupancy', 'plotArea', 'affordableScheme', 'dwellingUnits', 'landRate'],
    produces: ['ewsLigReservation', 'shelterFee'],
    // Clause 4.3.1 binds "all housing projects … having more than one unit"; Clause 4.4
    // Note-2 lifts it off a qualifying affordable scheme.
    appliesWhen: {
      oneOf: [{ fact: 'occupancy', values: ['res_multi', 'res_group_housing'] }],
      flags: [{ fact: 'affordableScheme', is: false }],
    },
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
    consumes: ['occupancy', 'roadWidth', 'plotArea', 'buildingHeight'],
    produces: ['requiredSetback'],
    appliesWhen: {
      oneOf: [{ fact: 'occupancy', values: ['com_bazaar'] }],
      ranges: [{ fact: 'buildingHeight', max: 15 }],
    },
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
    consumes: ['occupancy', 'roadWidth', 'areaType', 'plotArea', 'affordableScheme', 'baseFar'],
    produces: ['purchasableSplit'],
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: PRINTED_SPLIT_ROWS }] },
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
    consumes: ['occupancy', 'roadWidth', 'areaType', 'mixedUseLocation', 'farIncentive'],
    produces: ['baseFar', 'ceilingFar'],
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ['mixed_use'] }] },
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
    consumes: ['roadWidth', 'todZone'],
    produces: ['ceilingFar'],
    appliesWhen: { flags: [{ fact: 'todZone', is: true }] },
    ifWrong:
      'Nothing in the app is decided by this yet. The ladder is read and tested; what is missing is any way for a project to say it sits in a TOD zone.',
    challenge: {
      id: 'V-026',
      summary:
        'TOD FAR is a multiplier on whatever base FAR the underlying use carries, so it cannot be resolved without first resolving that use — and it applies only inside a notified TOD zone, which is a fact about the plot that `ProjectState` has no field for. The ladder is modelled and unused rather than guessed at.',
    },
  },

  'far.purchase-gate': {
    id: 'far.purchase-gate',
    question: 'May this project buy extra FAR at all, given the road it faces?',
    clause: 'Clauses 9.2.1(ii) and 9.2.3 Note 1',
    confidence: 'gazette',
    derivedFrom: ['roadWidth', 'occupancy', 'areaType'],
    checked: '2026-09-11',
    quote:
      'Purchasable and premium purchasable FAR shall be allowed only on roads with ROW 12m and above '
      + 'in built-up and non-built-up areas. For group housing in built-up areas, this is allowed on '
      + 'roads with ROW 9m. — and Note 1: In case of residential plotted development, calculation of '
      + 'purchasable FAR is not dependent on the width of the approach road and will be allowed on '
      + 'minimum 9-m /7.5-m or 4.0-m road as the case may be.',
    consumes: ['roadWidth', 'occupancy', 'areaType'],
    produces: ['purchaseGateOpen'],
    ifWrong:
      'This decides whether the headroom between base FAR and the ceiling is reachable or dead. Applied '
      + 'too widely it bars purchases the byelaws allow — which is what B-027 found — and applied too '
      + 'narrowly it prices floor area that cannot lawfully be built.',
  },

  'far.purchasable-fee': {
    id: 'far.purchasable-fee',
    question: 'What does the extra FAR cost?',
    clause: 'Clause 9.2.5',
    confidence: 'gazette',
    derivedFrom: ['occupancy', 'plotArea', 'roadWidth', 'areaType', 'landRate'],
    checked: '2026-09-11',
    quote:
      'C = Le x Rc x P, where Le = FP ÷ Base FAR and FP is the additional floor area availed. '
      + 'Factor coefficients: Commercial 0.50 / 1.0; Mixed Use 0.45 / 0.9; Office Buildings / '
      + 'Institutional 0.45 / 0.9; Hotels 0.40 / 0.8; Residential (Plotted) 0.40 / –; Residential '
      + '(Group Housing) 0.40 / 0.8; Community Facilities and Infrastructure 0.20 / 0.4.',
    consumes: [
      'occupancy', 'plotArea', 'roadWidth', 'areaType', 'landRate',
      'baseFar', 'ceilingFar', 'purchasableSplit', 'purchaseGateOpen', 'greenCertified',
    ],
    produces: ['purchaseFee'],
    appliesWhen: { flags: [{ fact: 'purchaseGateOpen', is: true }] },
    ifWrong:
      'The charge is the whole reason purchasable FAR is a decision rather than an entitlement. The '
      + 'gazette prints its own worked example, which the engine reproduces to the rupee, so the '
      + 'arithmetic is checked against the drafter rather than against a reading of the drafter.',
    challenge: {
      id: 'V-014',
      summary:
        'The formula, the coefficients and the tranche split are all read from the gazette, and '
        + 'the app reproduces Clause 9.2.5\'s worked example to the rupee. What is unresolved is '
        + 'inherited: on malls and hotels the split comes from a Chapter 5 row whose base FAR is '
        + 'higher than the Chapter 3 base the ceiling uses. Note-2 subordinates chapter 9 to the '
        + 'chapters but nothing subordinates chapter 5 to chapter 3, so both readings stand and '
        + 'the finding names the divergence rather than hiding it.',
      derivedFromInstead: ['roadWidth', 'occupancy', 'areaType'],
      maxDivergence: '1.5 FAR of base, on a non-built-up mall',
    },
  },

  'far.green-incentive': {
    id: 'far.green-incentive',
    question: 'How much extra floor area does a green rating earn, and what happens if it is not achieved?',
    clause: 'Clause 9.3',
    confidence: 'gazette',
    derivedFrom: ['greenRating'],
    checked: '2026-09-11',
    quote:
      'GRIHA Three star/ IGBC Silver / LEED silver or equivalent rating – 3% additional FAR on availed '
      + 'FAR. GRIHA Four star/IGBC Gold/LEED Gold – 5%. GRIHA Five star/ IGBC Platinum/ LEED Platinum – '
      + '7%. Note I: awarded after pre-certification from the empanelled agency; this incentive FAR on '
      + 'Green Buildings shall be over and above the MFAR. Note II: a penalty at 2 times of the land '
      + 'cost as per the circle rates for the additional FAR for the rating not achieved.',
    // Deliberately NOT consuming `ceilingFar`. Clause 9.3 states the incentive as a
    // percentage "on availed FAR" and grants it "over and above the MFAR", so the
    // percentage is knowable without the ceiling. Reading the ceiling here would put a
    // cycle in the graph — the FAR rules consume the incentive — for no gain in fidelity.
    consumes: ['greenRating', 'greenCertified'],
    produces: ['farIncentive'],
    appliesWhen: { oneOf: [{ fact: 'greenRating', values: ['silver', 'gold', 'platinum'] }] },
    ifWrong:
      'This is the one FAR addition that sits above the maximum permissible FAR rather than inside it, '
      + 'so treating it as part of the ceiling would silently withhold up to 7% of the floor area a '
      + 'rated building has earned.',
    challenge: {
      id: 'V-031',
      summary:
        'The 3/5/7% is applied on a self-declared rating. Note I awards it only after pre-certification '
        + 'from an empanelled agency and Note II reverses it at twice the circle-rate land cost if the '
        + 'rating is not achieved at occupancy — so the incentive is conditional and provisional, and '
        + 'the engine presents it as neither. greenRatingShortfallPenalty is modelled and uncalled.',
    },
  },

  'structural.seismic-applicability': {
    id: 'structural.seismic-applicability',
    question: 'Must this building be designed to resist earthquakes, and what does that oblige?',
    clause: 'Clause 11.8.1, with 11.3 and 11.5',
    confidence: 'gazette',
    derivedFrom: ['buildingHeight', 'occupancy'],
    checked: '2026-09-11',
    quote:
      'Earthquake-proof construction requirements will be applicable to buildings with more than 3 '
      + 'floors including ground floor or more than 12 meters in height and all infrastructure '
      + 'facilities with land cover of more than 500 square meters. Chapter 3 restates the same rule '
      + 'and agrees on every figure. Peer review above 50 m (11.3); structural audit in year 10 and '
      + 'every 5 years thereafter for high-rise and special buildings (11.5).',
    consumes: ['buildingHeight', 'occupancy', 'floorCount', 'groundCoverage'],
    produces: ['seismicMandatory', 'peerReviewRequired', 'structuralAuditSchedule'],
    ifWrong:
      'Clause 16.3.2(vi) hangs off this: it makes construction non-compoundable where earthquake '
      + 'measures are mandatory. Getting the trigger wrong either bars compounding that the byelaws '
      + 'allow or quotes a fee for work no fee can regularise.',
    challenge: {
      id: 'V-038',
      summary:
        'The four obligations that key on height and floor count — seismic design, the fire '
        + 'certificate, the completion-stage fire NOC and the structural completion certificate — use '
        + 'three different floor counts, two different heights and three different words for area, '
        + 'and no clause relates them. The floor-count limb of 11.8.1 cannot be evaluated at all: '
        + 'ProjectState has no floor count and one cannot be derived from height.',
      derivedFromInstead: ['buildingHeight'],
    },
  },

  'accessibility.scope': {
    id: 'accessibility.scope',
    question: 'Must this building be accessible to people with disabilities, and to what standard?',
    clause: 'Clause 12.2, with the requirements at 12.3 and 12.4',
    confidence: 'gazette',
    derivedFrom: ['occupancy'],
    checked: '2026-09-11',
    quote:
      'These regulations are applicable to all buildings and facilities used by the public such as '
      + 'educational, institutional, assembly, commercial, business, mercantile buildings, multi-units '
      + 'and group housing. It shall not apply to single unit residential dwellings.',
    consumes: ['occupancy', 'buildingHeight'],
    produces: ['accessibilityRequired'],
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: ACCESSIBILITY_SCOPE }] },
    ifWrong:
      'Alone among the three mandatory-measure chapters this one sets no height, floor or area '
      + 'threshold, so it reaches a single-storey shop that neither the fire nor the seismic trigger '
      + 'touches. Clause 16.3.2(xii) makes a breach of it non-compoundable.',
    challenge: {
      id: 'V-041',
      summary:
        'Clause 12.2(a) applies to buildings "used by the public such as" six named categories, and '
        + 'industrial, storage and hazardous are not among them — though Clause 10.1.3(b) names all '
        + 'three for the fire certificate. "Such as" leaves the list open, so the governing test is '
        + 'public use, which the project model cannot see. Industrial uses are reported unresolved '
        + 'rather than decided.',
    },
  },

  'licensing.competence': {
    id: 'licensing.competence',
    question: 'Which licensed professionals must prepare, sign and supervise this application?',
    clause: 'Chapter 14 (14.1, 14.2 and 14.4)',
    confidence: 'gazette',
    derivedFrom: ['plotArea', 'buildingHeight', 'occupancy'],
    checked: '2026-09-11',
    quote:
      'Supervisor: residential buildings on plot up to 100 m2 and up to two storeys or 7.5 m. '
      + 'Engineer: structural details and calculations on plot up to 500 sq.m and up to 5 storeys or '
      + '16.0 m. Structural engineer: all buildings. Landscape architect: 5 hectares and above, 2 in '
      + 'metro cities. One site engineer per 2500 sqm supervised.',
    consumes: ['plotArea', 'buildingHeight', 'occupancy', 'builtUpArea', 'floorCount'],
    produces: ['licensedRole', 'siteEngineerRequired'],
    ifWrong:
      'Clause 14.1 makes this a gate — work not planned and supervised by licensed persons is work '
      + 'for which permission cannot be sought. Naming the wrong professional wastes a fee and a '
      + 'submission cycle; missing one means the application is not competently signed at all.',
    challenge: {
      id: 'V-046',
      summary:
        'The three experience tables at 14.4 are keyed on six seismic zones where IS 1893 — which '
        + 'Chapter 11.1 itself adopts — defines four, numbered II to V. Zone-6 is a real empty cell '
        + 'in every banded row. The engine holds the two merged column groups as printed and does '
        + 'not map them to IS 1893 zones, because nothing in the byelaws says how.',
      derivedFromInstead: ['zone'],
    },
  },

  'ev.charging-infrastructure': {
    id: 'ev.charging-infrastructure',
    question: 'How many EV charging points does this building need, and what load must it carry?',
    clause: 'Clause 17.1 and 17.1.2.1',
    confidence: 'gazette',
    derivedFrom: ['occupancy', 'plotArea'],
    checked: '2026-09-11',
    quote:
      'Charging infrastructures shall be provided only for EVs, which is currently assumed to be '
      + '20% of all vehicle holding capacity / parking capacity at the premise, with an additional '
      + 'power load equivalent to all charging points operating simultaneously at a safety factor '
      + 'of 1.25. Norms of provisions: 4Ws 1 SC each 3 EVs, 1 FC each 10 EVs; 3Ws 1 SC each 2 EVs; '
      + '2Ws 1 SC each 2 EVs; PV (Buses) 1 FC each 10 EVs.',
    consumes: ['occupancy', 'plotArea', 'parkingRequirement'],
    produces: ['evChargingProvision'],
    ifWrong:
      'The load figure decides the DISCOM sanction the premises applies for, which is a long-lead '
      + 'item on any commercial project. Reading the EV share as a charger count — which the engine '
      + 'did — over-states the charger requirement threefold and omits fast chargers entirely.',
    challenge: {
      id: 'V-050',
      summary:
        'Clause 17.1.2.1 states ratios for two- and three-wheelers as well as cars, and Note (i) '
        + 'plans bays at 20% of the capacity of all vehicles "including 2Ws". The parking standard '
        + 'the engine applies is expressed in car-equivalent spaces only, so those limbs cannot be '
        + 'computed at all. The load figure also uses the smallest chargers Clause 17.8 admits, so '
        + 'it is a floor rather than a specification.',
    },
  },

  'telecom.cti': {
    id: 'telecom.cti',
    question: 'What telecom infrastructure must this building provide, and whose clearance does it need?',
    clause: 'Chapter 18 — 18.3, 18.5.1.1 and 18.5.1.2',
    confidence: 'gazette',
    derivedFrom: ['plotArea'],
    checked: '2026-09-11',
    quote:
      'Occupancy-cum-Completion certificate to a building to be granted only after ensuring that '
      + 'the CTI as per the prescribed standards is in place. Telecom room: up to 465 sqm 3.0 x 2.4 m; '
      + '465-930 sqm 3.0 x 3.4 m; above 930 sqm an additional room. Min 1.2m x 1.83m per TSP beside '
      + 'the entrance facility; 100 mm encased conduit to the MDF room. No fee will be charged for '
      + 'IBS/FTTx Network.',
    consumes: ['plotArea', 'builtUpArea', 'ibsCoveredArea'],
    produces: ['telecomRoomSpace', 'ibsNocRequired', 'occupancyCertificateGate'],
    ifWrong:
      'This is a clearance most applicants do not know exists, gating the same certificate the fire '
      + 'NOC gates, and Clause 18.5.1.1(b) puts the duty to apply on the applicant rather than the '
      + 'Authority. Discovering it at completion means the building is finished and cannot be occupied.',
    challenge: {
      id: 'V-051',
      summary:
        'Both telecom-room tables are captioned by built-up area and keyed by "area to be covered by '
        + 'IBS", and the chapter nowhere says the two are the same — so a building over 465 m² whose '
        + 'IBS covers only part of it reads two ways. With no coverage figure in the project model the '
        + 'whole building is taken as covered, which gives the larger room. Everything below the '
        + 'tables defers to NBC 2016 Part 8 Section 6, which this repository does not hold.',
    },
  },

  'permission.route': {
    id: 'permission.route',
    question: 'Which sanction route does this project take, and what does that route depend on?',
    clause: 'Clause 2.1.2, with the deemed NOC at 2.2.3(v)',
    confidence: 'gazette',
    derivedFrom: ['plotArea', 'occupancy', 'buildingHeight'],
    checked: '2026-09-11',
    quote:
      'For plots of size upto 100 square meters for residential purpose and plots of size up to 30 '
      + 'square meters for commercial purpose will not require any permission, except in the mela area '
      + '... and plots in unauthoritized layouts/ colonies. For plots in layouts approved or developed '
      + 'by the Authority: for plots of size upto 500 square meters for residential purpose (except '
      + 'multi-unit) and plots of size up to 200 square meters for commercial purpose ... instant '
      + 'online approval.',
    consumes: ['plotArea', 'occupancy', 'buildingHeight', 'approvedLayout', 'melaOrUnauthorisedArea'],
    produces: ['sanctionRoute'],
    ifWrong:
      'This is the first practical question an applicant asks. Sending a project down a lighter route '
      + 'than it qualifies for produces an approval revocable within thirty days under Clause '
      + '2.1.2(v), with the owner, applicant and licensed technical person each personally liable.',
    challenge: {
      id: 'V-053',
      summary:
        'Both lighter routes turn on facts no drawing shows — whether the plot is in a layout approved '
        + 'by the Authority, in a mela area, or in an unauthorised colony. Assuming them favourably is '
        + 'the laxer reading in both cases, so the route is reported with its conditions attached '
        + 'rather than asserted.',
      derivedFromInstead: ['approvedLayout', 'melaOrUnauthorisedArea'],
    },
  },

  'zoning.permissibility': {
    id: 'zoning.permissibility',
    question: 'May this use go on this plot at all?',
    clause: 'Clause 15.3 (gazette pp. 149–156)',
    confidence: 'gazette',
    derivedFrom: ['occupancy', 'zone', 'areaType', 'plotArea'],
    checked: '2026-09-11',
    quote:
      '53 activities against 16 land-use zones — 847 verdicts, stated as cell fill: green '
      + 'permitted, red prohibited, green carrying a number permitted subject to that condition. '
      + 'Read from the chapter PDF by fill colour, because the flattened text carries none of it.',
    consumes: ['occupancy', 'zone', 'areaType', 'plotArea'],
    produces: ['useAllowed'],
    ifWrong:
      'This is the first question and it is prior to every dimensional one: a use prohibited in '
      + 'the zone is not made lawful by a wider road or a smaller building. Answering it wrongly '
      + 'in the permissive direction sends a project to design on a plot it can never be built on.',
    challenge: {
      id: 'V-054',
      summary:
        'Fifteen of the sixteen occupancies resolve to a row, and five of those resolve to the '
        + 'stricter of two rows because the row turns on a fact the project model does not carry — '
        + 'a hotel\'s room count, a hospital\'s beds, a school\'s level, whether an office is '
        + 'government. The alternative is named on the finding. The 47 conditional cells carry a '
        + 'numbered condition from Clause 15.3.3 that the engine reports but does not hold.',
      derivedFromInstead: ['hotelRooms'],
    },
  },

  'occupancy.thresholds': {
    id: 'occupancy.thresholds',
    question: 'What road width, plot size and height does each use require?',
    clause: 'Chapter 15.3.2 and the occupancy chapters',
    confidence: 'inferred',
    derivedFrom: ['occupancy'],
    consumes: ['occupancy', 'areaType', 'roadWidth', 'plotArea', 'buildingHeight', 'hotelRooms'],
    // Clause 4.1.4's limb of V-010 — the ceiling keyed on unit count, not plot size — is
    // `OccupancyDefinition.maxHeightM`, and this is the rule that reports it.
    produces: ['useAllowed', 'minRoadWidth', 'minPlotArea', 'maxHeight'],
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
    clause: 'Para 3.3.4.3 (Parking Standards)',
    confidence: 'inferred',
    derivedFrom: ['occupancy'],
    consumes: ['occupancy', 'builtUpArea', 'dwellingUnits', 'unitCarpetArea'],
    produces: ['parkingRequirement'],
    ifWrong: 'Parking provision would be misstated, which is a common cause of sanction refusal.',
    challenge: {
      id: 'V-032',
      summary:
        'The rule cited "Chapter 10 (Table 10.1)" and Chapter 10 is Fire Prevention and Life Safety — three pages, no tables. The parking standards are at Para 3.3.4.3, and opening it shows the engine reading the wrong basis for residential and the wrong figure for three commercial uses.',
      derivedFromInstead: ['occupancy', 'plotArea'],
      maxDivergence: 'Shops 2.0 ECS/100 m² against the gazette\'s 1.0 — double. Residential is stated per dwelling unit by unit size, not per 100 m² at all.',
    },
  },

  'services.rainwater-harvesting': {
    id: 'services.rainwater-harvesting',
    question: 'When is rainwater harvesting compulsory?',
    clause: 'Clause 13.1.2 (Requirements of Building Plan), with 13.1.2(f)',
    confidence: 'gazette',
    derivedFrom: ['plotArea'],
    checked: '2026-09-11',
    quote:
      'In case of no collective recharge network, roof top rainwater harvesting system in plots '
      + 'of all uses of 300 square meters and more area (including group housing) except '
      + 'waterlogged areas. … Ground water recharging system should not be adopted in areas with '
      + 'water logging problem, but arrangements can be made to collect rainwater received from '
      + 'the roofs of buildings. 13.1.2(f): for plots of areas from 100-300 square meters it is '
      + 'not mandatory if the rainwater flows into the scheme\'s collective recharge network; '
      + 'above 300 square meters "it shall be mandatory for the building owner to install '
      + 'rainwater harvesting system himself".',
    consumes: ['plotArea', 'builtUpArea'],
    produces: ['rainwaterHarvestingRequired'],
    appliesWhen: { ranges: [{ fact: 'plotArea', min: 300 }] },
    ifWrong:
      'The engine applied "more than 300 m²" against a clause that reads "300 square meters and '
      + 'more area", so a plot standing at exactly 300 m² was excused a mandatory provision — and '
      + 'it stated the requirement unconditionally, where the gazette excepts waterlogged areas '
      + 'and substitutes roof collection for recharge there.',
  },

  'services.solar-pv': {
    id: 'services.solar-pv',
    question: 'When must a plot generate solar power?',
    clause: 'Clause 13.2.3.1',
    confidence: 'gazette',
    derivedFrom: ['plotArea'],
    checked: '2026-09-11',
    quote:
      'All plots having size 500 sqm and above shall install solar photovoltaic power generation '
      + 'system. This should also be encouraged for plots smaller than 500 sqm. The power '
      + 'generated may be used for in-house utilization or for transfer to the grid.',
    consumes: ['plotArea'],
    produces: ['solarPvRequired'],
    appliesWhen: { ranges: [{ fact: 'plotArea', min: 500 }] },
    ifWrong:
      'This is the plot-size trigger the engine used to require solar *water heating* against. '
      + 'Getting it wrong names the wrong system on the wrong buildings — and a photovoltaic '
      + 'array and a solar thermal collector are not substitutes for one another.',
  },

  'services.solar-water-heating': {
    id: 'services.solar-water-heating',
    question: 'Which buildings must heat their water with solar?',
    clause: 'Clause 13.2.3.2',
    confidence: 'gazette',
    derivedFrom: ['occupancy'],
    checked: '2026-09-11',
    quote:
      'No new building in the following categories in which there is a system of installation for '
      + 'supplying hot water shall be built unless the system of the installation is also having '
      + 'an auxiliary solar assisted water heating system: (a) hotels, lodges, guest houses, '
      + 'service apartments; (b) institutional buildings (hospitals and nursing home); (c) '
      + 'schools, colleges, universities, technical institutions, training centres; (d) assembly '
      + 'buildings (auditorium, community halls, wedding/banquet halls, etc); (e) barracks of '
      + 'armed forces/paramilitary forces and police forces; (f) hostels for schools, colleges, '
      + 'and training centres with more than 100 students.',
    consumes: ['occupancy'],
    produces: ['solarWaterHeatingRequired'],
    appliesWhen: { oneOf: [{ fact: 'occupancy', values: SOLAR_WATER_CATEGORIES }] },
    ifWrong:
      'The trigger is the building category and nothing else — no plot size, no built-up area, no '
      + 'height. Keying it on plot area, as the engine did, exempts a small hotel and burdens a '
      + 'large house with an obligation the chapter does not place on it.',
    challenge: {
      id: 'V-042',
      summary:
        'The clause binds a building of these categories "in which there is a system of '
        + 'installation for supplying hot water". ProjectState records no hot water system, so '
        + 'the engine assumes a hotel, hospital, school or assembly building has one — the '
        + 'stricter reading. Two of the six categories, barracks and hostels of more than 100 '
        + 'students, have no occupancy in the taxonomy at all.',
      derivedFromInstead: ['occupancy'],
    },
  },

  'services.solid-waste': {
    id: 'services.solid-waste',
    question: 'What waste facilities must the building provide?',
    clause: 'Clause 13.4',
    confidence: 'gazette',
    derivedFrom: ['occupancy'],
    checked: '2026-09-11',
    quote:
      'All buildings shall provide facilities for solid waste management with segregation of dry '
      + 'and wet waste at source. For waste management in residential buildings (including group '
      + 'housing) and all non-residential buildings with an area of more than 500 square meters, '
      + 'two types of dustbins (biodegradable and non-biodegradable) shall be provided on the '
      + 'ground floor near the entrance of the plot.',
    consumes: ['occupancy', 'builtUpArea'],
    produces: ['solidWasteProvision'],
    ifWrong:
      'Small, and cheap to comply with — but it is a submission item, and the 500 m² qualifier '
      + 'attaches to non-residential buildings only, so reading it across residential as well '
      + 'would drop the requirement from every house.',
  },

  'services.tree-plantation': {
    id: 'services.tree-plantation',
    question: 'How many trees must the landscape plan show?',
    clause: 'Clause 13.7',
    confidence: 'gazette',
    derivedFrom: ['plotArea', 'occupancy'],
    checked: '2026-09-11',
    quote:
      'Residential: one tree on a plot of area less than 200 square meters; two trees on a plot '
      + 'of 200 to 300 square meters area; four trees on a plot of area 301 to 500 square meters; '
      + 'one tree per 100 square meter area or part thereof in a plot of area more than 500 '
      + 'square meter; 50 trees per hectare in group housing scheme. Industrial: one tree per 80 '
      + 'square meter plot of land. Commercial: one tree per 100 square meter area. '
      + 'Institutional/community facilities, playgrounds, open areas and parks: greenery on a '
      + 'minimum of 20% of the total area where trees shall be planted at the rate of 125 trees '
      + 'per hectare. Environmental condition, Category-A and above: a minimum of 1 tree for '
      + 'every 80 sqm of land.',
    consumes: ['plotArea', 'occupancy'],
    produces: ['treePlantingRequired'],
    ifWrong:
      'The landscape plan is a submission requirement checked again before the completion '
      + 'certificate, and the count is one of the few figures in Chapter 13 an app can compute '
      + 'exactly.',
    challenge: {
      id: 'V-044',
      summary:
        'Chapter 3\'s landscape plan states the same obligation on a different base — 50 trees '
        + 'per hectare of the 20% of open space in a commercial scheme, against Chapter 13\'s '
        + 'one tree per 100 m² of the whole plot. The engine takes Chapter 13\'s per-plot rate, '
        + 'which is much the stricter. Clause 13.7(a) also leaves a gap between its "200 to 300" '
        + 'and "301 to 500" bands, and an office building is in none of the four categories the '
        + 'clause names.',
      derivedFromInstead: ['plotArea', 'occupancy'],
      maxDivergence:
        'A 1,000 m² commercial plot: 10 trees under Chapter 13.7(c), under one under Chapter 3\'s '
        + 'rate applied to its open space.',
    },
  },

  'services.environmental-conditions': {
    id: 'services.environmental-conditions',
    question: 'What does a building owe once it passes 5,000 m² of built-up area — and when does '
      + 'it need Environment Clearance?',
    clause: 'Clause 13.1.2, 13.2.4, 13.3, 13.4, 13.6, 13.7, 13.8 and 13.9 (environmental conditions)',
    confidence: 'gazette',
    derivedFrom: ['occupancy', 'plotArea'],
    checked: '2026-09-11',
    quote:
      'Category-A (5000-20000 sqm), Category-B (20000 -50000 sqm), Category-C (50000-150000 '
      + 'sqm), Category-D (>150000 sqm or Site Area >50 Ha). 13.8 Category-B: "No development '
      + 'permission shall be given to the Building and Construction projects, until getting '
      + 'Environment Clearance from SEIAA (State Level Environment Impact Assessment Authority) '
      + 'as required under the Environmental Impact Assessment notification-2006 and amended from '
      + 'time to time. If the developer wishes to split the project into phases, developer has to '
      + 'produce Environment Clearance from SEIAA, prior to the approval of first phase of the '
      + 'project." 13.9: "For all buildings above 50,000 sqm built up area".',
    consumes: ['occupancy', 'plotArea', 'builtUpArea'],
    produces: ['environmentalCategory', 'treePlantingRequired', 'occupancyCertificateGate'],
    ifWrong:
      'The Environment Clearance is the one thing in Chapter 13 that stops a development '
      + 'permission being issued at all, and it was not modelled: every project above 20,000 m² '
      + 'of built-up area was told it could proceed. The conditions attached to the categories '
      + 'are also the only place several obligations appear — recharge bores, fly ash, the '
      + 'renewable 1%, the DG exhaust, the compensatory 1:3 plantation.',
    challenge: {
      id: 'V-043',
      summary:
        'The printed bands overlap: 20,000 m² is inside both Category-A and Category-B, 50,000 '
        + 'inside both B and C. And Category-D appears in only one of the seven tables, so read '
        + 'literally a 200,000 m² project owes no recharge bore while a 6,000 m² one does. The '
        + 'engine places a boundary project in the higher band and lets D inherit C, on the '
        + 'strength of Clause 13.9\'s own preamble — "For all buildings above 50,000 sqm built '
        + 'up area" — against a table whose only row is printed "50000-150000 sqm".',
      derivedFromInstead: ['occupancy'],
    },
  },

  'fire.safety-certificate': {
    id: 'fire.safety-certificate',
    question: 'Does this building need a Fire Safety Certificate?',
    clause: 'Clause 10.1.3',
    confidence: 'gazette',
    derivedFrom: ['buildingHeight', 'occupancy'],
    checked: '2026-09-11',
    quote:
      'Without prejudice to these building byelaws and enforcement of byelaws by the State, following ' +
      'buildings shall obtain \u2018Fire Safety Certificate\u2019 from Fire and Emergency Services; ' +
      '(a) Multi-storied buildings having more than 15 meters height. (b) Special buildings like ' +
      'educational, institutional, assembly, business, mercantile, industrial, storage and hazardous ' +
      'buildings as defined in National Building Code as amended from time to time. (c) Mixed ' +
      'occupancies with any of the aforesaid occupancies having more than 500 square meter covered area.',
    consumes: ['buildingHeight', 'occupancy', 'builtUpArea', 'groundCoverage', 'floorCount', 'hasStilt'],
    produces: ['specialBuilding', 'fireClearanceRequired', 'occupancyCertificateGate'],
    ifWrong:
      'A missing Fire Safety Certificate is one of the thirteen offences at Clause 16.3.2 that cannot be compounded at any price, and without it no occupancy certificate can issue. Under-requiring it builds something that can never be regularised.',
    challenge: {
      id: 'V-034',
      summary:
        'Clause 1.2(q) defines "Special Building" over a different list and gates it at 500 sqm of built-up area. The engine takes the union of the two, which is the stricter reading; on the Clause 1.2(q) reading alone a school, an office or a shop below 500 sqm would need no certificate.',
      derivedFromInstead: ['occupancy'],
      maxDivergence: 'A 400 sqm school: certificate required under Clause 10.1.3(b), not required under Clause 1.2(q).',
    },
  },

  'fire.access': {
    id: 'fire.access',
    question: 'What access must a fire tender have to the building?',
    clause: 'Clause 10.2.1',
    confidence: 'gazette',
    derivedFrom: ['buildingHeight', 'roadWidth'],
    checked: '2026-09-11',
    quote:
      'Access to the building shall mean the availability of means of approach to each floor of the ' +
      'building or to nearest point of the building in case of emergency-situation for firefighting ' +
      'and/or rescue operations at least from one side like-road or permanent open space etc.',
    consumes: ['buildingHeight', 'roadWidth', 'requiredSetback'],
    produces: ['fireAccessRequirement'],
    ifWrong:
      'The engine previously blocked any building over 15 m on a road under 12 m as non-negotiable, citing a clause that is about mixed-use development. No such rule is in the gazette, and a fabricated block tells someone their project cannot be sanctioned when the byelaws do not say so.',
  },
};

export const RULE_IDS = Object.keys(RULES);
