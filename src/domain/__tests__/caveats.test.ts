import { describe, expect, it } from 'vitest';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT } from '../project';
import { RULES } from '../rules/registry';
import type { ProjectState } from '../project';

const project = (over: Partial<ProjectState>): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

const HOUSE = project({
  occupancy: 'res_single', plotArea: 320, roadWidth: 12,
  proposedBuiltUpArea: 450, buildingHeight: 12,
});

const chall = (id: string) =>
  Object.values(RULES).find((r) => r.challenge?.id === id)?.challenge;

/**
 * Twenty-seven of thirty-eight rules carry an open challenge. Before these guards every
 * one of them chipped every finding it touched — twelve alarms on a plain house, which
 * is the same as none. These tests hold the line in both directions: a caveat that does
 * not bear on the project must not show, and one whose scope is unstated must.
 */
describe('every challenge declares what kind of doubt it is', () => {
  it('leaves no challenge unclassified', () => {
    for (const [id, rule] of Object.entries(RULES)) {
      if (!rule.challenge) continue;
      expect(rule.challenge.kind, `${id} has no kind`).toBeDefined();
    }
  });

  it('guards a challenge only where the boundary is stated, and leaves the rest always-on', () => {
    const guarded = Object.values(RULES).filter((r) => r.challenge?.bites).length;
    const total = Object.values(RULES).filter((r) => r.challenge).length;
    expect(total).toBe(27);
    // A guard is a claim about scope. Most challenges do not state one, and those must
    // keep showing: withholding a caveat wrongly is a false assurance.
    expect(guarded).toBeLessThan(total / 2);
  });
});

describe('a caveat shows only where it bears on the project', () => {
  it('does not caveat a house with a doubt about ten commercial occupancies (V-003)', () => {
    const bites = chall('V-003')!.bites!;
    expect(bites({ ...HOUSE })).toBe(false);
    expect(bites({ ...HOUSE, occupancy: 'com_mall' })).toBe(true);
    expect(bites({ ...HOUSE, occupancy: 'inst_health' })).toBe(true);
  });

  it('raises Appendix-15’s omission only for the three authorities it omits (V-056)', () => {
    const bites = chall('V-056')!.bites!;
    expect(bites({ ...HOUSE, cityName: 'Moradabad' })).toBe(false);
    for (const city of ['Lucknow', 'NOIDA', 'ghaziabad']) {
      expect(bites({ ...HOUSE, cityName: city }), city).toBe(true);
    }
  });

  it('raises the telecom ambiguity only above the 465 m² the tables split on (V-051)', () => {
    const bites = chall('V-051')!.bites!;
    expect(bites({ ...HOUSE, proposedBuiltUpArea: 464 })).toBe(false);
    expect(bites({ ...HOUSE, proposedBuiltUpArea: 465 })).toBe(true);
  });

  it('raises the overlapping environmental bands only where they overlap (V-043)', () => {
    const bites = chall('V-043')!.bites!;
    expect(bites({ ...HOUSE, plotArea: 19_999 })).toBe(false);
    expect(bites({ ...HOUSE, plotArea: 20_000 })).toBe(true);
  });
});

describe('an ambiguity cannot unsettle a check that already passes', () => {
  it('drops it on a passing finding but keeps the kinds that could mean the wrong row', () => {
    const assessment = assessProject(HOUSE);
    for (const finding of assessment.findings) {
      if (finding.status === 'ok' && finding.dispute) {
        // A source gap or a missing fact can mean the engine read the wrong row
        // altogether, and a pass on the wrong row is worth flagging. An ambiguity
        // resolved to the stricter reading cannot be: if strict clears it, loose does.
        expect(finding.dispute.kind, finding.headline).not.toBe('ambiguity');
      }
    }
  });

  it('still caveats the checks that are not clear', () => {
    const assessment = assessProject(HOUSE);
    const unresolved = assessment.findings.filter(
      (f) => f.dispute && f.status !== 'ok',
    );
    expect(unresolved.length).toBeGreaterThan(0);
  });
});

describe('what the reader is told', () => {
  it('counts fewer caveats than there are challenged rules in play', () => {
    const assessment = assessProject(HOUSE);
    const carried = assessment.findings.filter((f) => RULES[f.rule ?? '']?.challenge).length;
    expect(assessment.disputedCount).toBeLessThan(carried);
  });

  it('never invents a caveat the registry does not hold', () => {
    for (const over of [
      HOUSE,
      project({ occupancy: 'com_mall', plotArea: 5_000, roadWidth: 24, proposedBuiltUpArea: 12_000 }),
      project({ occupancy: 'inst_education', plotArea: 2_000, roadWidth: 18 }),
    ]) {
      for (const finding of assessProject(over).findings) {
        if (!finding.dispute) continue;
        const registered = RULES[finding.rule ?? '']?.challenge;
        expect(registered, finding.rule).toBeDefined();
        expect(finding.dispute.id).toBe(registered!.id);
        expect(finding.dispute.kind).toBe(registered!.kind);
      }
    }
  });
});
