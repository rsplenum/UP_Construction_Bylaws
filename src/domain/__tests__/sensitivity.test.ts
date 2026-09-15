import { describe, expect, it } from 'vitest';
import { assessProject } from '../findings';
import {
  FRAMING_INPUTS, INPUTS, INPUT_IDS, NON_INPUT_FIELDS, describeAnswer, getInput,
} from '../inputs';
import { OCCUPANCY_IDS, OccupancyId } from '../occupancy';
import { DEFAULT_PROJECT, ProjectState } from '../project';
import { IMPACT_RANK, analyse, provenanceOf } from '../sensitivity';

const forOccupancy = (occupancy: OccupancyId): ProjectState => ({ ...DEFAULT_PROJECT, occupancy });

describe('the input registry covers the model', () => {
  it('accounts for every field of ProjectState, as a question or knowingly not one', () => {
    const declared = new Set<string>([...INPUT_IDS, ...NON_INPUT_FIELDS]);
    const missing = Object.keys(DEFAULT_PROJECT).filter((k) => !declared.has(k));
    // A new field on the model that nobody registered is a question the interface will
    // never ask while the engine happily computes with its default — which is exactly how
    // masterPlanZone came to decide Clause 15.3 with no control anywhere on screen.
    expect(missing).toEqual([]);
  });

  it('registers nothing that is not on the model', () => {
    const onModel = new Set(Object.keys(DEFAULT_PROJECT));
    expect(INPUT_IDS.filter((id) => !onModel.has(id))).toEqual([]);
  });

  it('asks three framing questions and no more', () => {
    expect(FRAMING_INPUTS).toEqual(['occupancy', 'buildingStage', 'plotArea']);
  });

  it('gives every question a plain-words prompt and a stated assumption', () => {
    for (const def of INPUTS) {
      expect(def.question, def.id).toMatch(/\S.*\?$/);
      expect(def.because, def.id).toMatch(/\S/);
      expect(def.label, def.id).toMatch(/\S\s*\S/);
    }
  });

  it('describes the current answer to every question in words', () => {
    for (const id of INPUT_IDS) {
      expect(describeAnswer(DEFAULT_PROJECT, id), id).toMatch(/\S/);
    }
  });

  it('probes every value a boolean or a fixed choice can take, so "none" means none', () => {
    for (const def of INPUTS) {
      if (!def.exhaustive) continue;
      const probes = new Set(def.probes(DEFAULT_PROJECT).map(String));
      if (def.kind === 'boolean') {
        expect(probes, def.id).toEqual(new Set(['true', 'false']));
      } else {
        const offered = new Set(def.options!(DEFAULT_PROJECT).map((o) => o.value));
        expect(probes, def.id).toEqual(offered);
      }
    }
  });
});

describe('what the engine actually reads', () => {
  it('finds the master-plan zone decisive for every occupancy', () => {
    // The app has always told users "the land-use question is unanswered — set the master
    // plan zone to settle it" while offering no way to set it. This is the measurement that
    // says how much that cost: Clause 15.3 decides whether the use may go on the plot at
    // all, for all sixteen occupancies.
    for (const occupancy of OCCUPANCY_IDS) {
      const { byInput } = analyse(forOccupancy(occupancy));
      expect(IMPACT_RANK[byInput.masterPlanZone.impact], occupancy)
        .toBeGreaterThanOrEqual(IMPACT_RANK.status);
    }
  });

  it('finds the stilt-floor question inert for every occupancy, and says why', () => {
    // conflicts.ts, C-016: "ProjectState.hasStilt exists and is deliberately not consulted."
    // A checkbox the user can tick that cannot change any answer is worse than no checkbox,
    // so the registry carries the reason and the panel prints it.
    for (const occupancy of OCCUPANCY_IDS) {
      expect(analyse(forOccupancy(occupancy)).byInput.hasStilt.impact, occupancy).toBe('none');
    }
    expect(getInput('hasStilt').notConsulted).toMatch(/not read it|never reads it/);
  });

  it('never calls an input inert while one of its probes changes the assessment', () => {
    // The whole interface rests on this: a question is hidden only because the engine was
    // asked and said it does not matter. If that claim can be false the panel is hiding
    // questions that decide the verdict.
    const project = { ...DEFAULT_PROJECT, plotArea: 900, proposedBuiltUpArea: 1800, buildingHeight: 18 };
    const base = assessProject(project);
    const { byInput } = analyse(project, base);
    const fingerprint = (p: ProjectState) => JSON.stringify(assessProject(p));

    for (const def of INPUTS) {
      if (byInput[def.id].impact !== 'none') continue;
      for (const value of def.probes(project)) {
        const probed = { ...project, [def.id]: value } as ProjectState;
        expect(fingerprint(probed), `${def.id} = ${String(value)}`).toBe(fingerprint(project));
      }
    }
  });

  it('reports which inputs each finding on screen rests on', () => {
    const project = { ...DEFAULT_PROJECT, plotArea: 900, proposedBuiltUpArea: 1800 };
    const assessment = assessProject(project);
    const { byFinding, flippedBy } = analyse(project, assessment);

    // Every attributed finding is one the reader can actually see.
    const onScreen = new Set(assessment.findings.map((f) => f.id));
    for (const id of Object.keys(byFinding)) expect(onScreen.has(id), id).toBe(true);
    // Anything that can flip a finding can also change it.
    for (const [id, inputs] of Object.entries(flippedBy)) {
      for (const input of inputs) expect(byFinding[id], id).toContain(input);
    }
    // The floor-area check must rest on the floor area.
    expect(byFinding.far ?? []).toContain('proposedBuiltUpArea');
  });

  it('answers a project in a bounded number of engine runs', () => {
    // The panel re-runs this on every edit. A ladder someone widens to fifty values would
    // make the interface stutter, and the cost should fail a test rather than a user.
    const { runs } = analyse(DEFAULT_PROJECT, assessProject(DEFAULT_PROJECT));
    expect(runs).toBeLessThan(220);
    expect(runs).toBeGreaterThan(INPUT_IDS.length);
  });
});

describe('provenance', () => {
  it('starts with nothing answered, so every live number is the app\'s', () => {
    expect(DEFAULT_PROJECT.answered).toEqual([]);
    const sensitivity = analyse(DEFAULT_PROJECT);
    const { answered, assumed, inert } = provenanceOf(DEFAULT_PROJECT, sensitivity);
    expect(answered).toEqual([]);
    expect(assumed.length).toBeGreaterThan(0);
    expect(new Set([...assumed, ...inert]).size).toBe(INPUT_IDS.length);
  });

  it('puts each question in exactly one bucket', () => {
    const project: ProjectState = { ...DEFAULT_PROJECT, answered: ['plotArea', 'roadWidth'] };
    const p = provenanceOf(project, analyse(project));
    const all = [...p.answered, ...p.assumed, ...p.inert];
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(all)).toEqual(new Set(INPUT_IDS));
    // The three assumption tiers partition the assumptions.
    expect([...p.decisive, ...p.material, ...p.cosmetic].sort()).toEqual([...p.assumed].sort());
  });

  it('moves a question out of the assumptions once it is answered', () => {
    const before = provenanceOf(DEFAULT_PROJECT, analyse(DEFAULT_PROJECT));
    expect(before.assumed).toContain('roadWidth');

    const after: ProjectState = { ...DEFAULT_PROJECT, answered: ['roadWidth'] };
    const now = provenanceOf(after, analyse(after));
    expect(now.assumed).not.toContain('roadWidth');
    expect(now.answered).toEqual(['roadWidth']);
  });

  it('ranks the assumptions worth chasing above the ones that only reword an answer', () => {
    const p = provenanceOf(DEFAULT_PROJECT, analyse(DEFAULT_PROJECT));
    // A house on a 320 m² plot: the zone decides whether it is permitted at all; the
    // circle rate only appears in sentences until something is actually bought.
    expect(p.decisive).toContain('masterPlanZone');
    // The app has assumed ₹35,000/m² since the day it shipped, and on a house drawn inside
    // its entitlement that number reaches nothing: nothing is bought, nothing is compounded.
    // Asking for it here would be asking for a number to put in a sentence nobody reads.
    expect(p.inert).toContain('circleRate');

    // Within a tier the heaviest question is asked first, so the top of the list is always
    // the one worth going and finding out.
    const sensitivity = analyse(DEFAULT_PROJECT);
    const ranks = p.decisive.map((id) => IMPACT_RANK[sensitivity.byInput[id].impact]);
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
  });

  it('holds an answer the user gave even where it changes nothing', () => {
    // Answered-and-inert is still inert: the panel should not present a question back to
    // someone as outstanding merely because they took the trouble to answer it.
    const project: ProjectState = { ...DEFAULT_PROJECT, answered: ['hasStilt'] };
    const p = provenanceOf(project, analyse(project));
    expect(p.inert).toContain('hasStilt');
    expect(p.answered).not.toContain('hasStilt');
  });
});

describe('sensitivity is project-specific, not a table', () => {
  it('asks a 600 m² plot about solar photovoltaics and a 320 m² plot not at all', () => {
    // Clause 13.2.3.1 binds plots of 500 m² and above. A hand-curated "which fields matter
    // for a house" list cannot express that; running the engine can.
    const small = { ...DEFAULT_PROJECT, plotArea: 320 };
    const large = { ...DEFAULT_PROJECT, plotArea: 600 };
    expect(analyse(small).byInput.hasSolarPv.impact).toBe('none');
    expect(analyse(large).byInput.hasSolarPv.impact).not.toBe('none');
  });

  it('asks for the circle rate only once something is actually priced against it', () => {
    // Drawn 900 m² on a 320 m² plot and not yet built, nothing is charged — the drawing is
    // redrawn, so the rate reaches nothing and the app does not ask for it. Say the same
    // building is standing and Chapter 16 has something to compound, and the same number
    // swings the bill by millions. One project, two honest answers to "does this matter".
    const drawn = { ...DEFAULT_PROJECT, proposedBuiltUpArea: 900 };
    expect(provenanceOf(drawn, analyse(drawn)).inert).toContain('circleRate');

    const standing = { ...drawn, buildingStage: 'built' as const };
    const p = provenanceOf(standing, analyse(standing));
    expect(p.material).toContain('circleRate');
    expect(analyse(standing).byInput.circleRate.moneySwing).toBeGreaterThan(1_000_000);
  });

  it('asks about the affordable-housing waiver only where EWS and LIG bite', () => {
    const house = { ...DEFAULT_PROJECT, occupancy: 'res_single' as OccupancyId };
    const scheme = { ...DEFAULT_PROJECT, occupancy: 'res_group_housing' as OccupancyId, plotArea: 6000 };
    expect(analyse(house).byInput.isAffordableHousingScheme.impact).toBe('none');
    expect(analyse(scheme).byInput.isAffordableHousingScheme.impact).not.toBe('none');
  });
});
