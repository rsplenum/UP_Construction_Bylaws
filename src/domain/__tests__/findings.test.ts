import { describe, expect, it } from 'vitest';
import { assessProject } from '../findings';
import { DEFAULT_PROJECT, ProjectState } from '../project';
import { OCCUPANCY_IDS, OCCUPANCIES } from '../occupancy';

const project = (over: Partial<ProjectState> = {}): ProjectState => ({ ...DEFAULT_PROJECT, ...over });

describe('assessProject — it always answers', () => {
  it('produces a headline and findings for every occupancy in the taxonomy', () => {
    for (const id of OCCUPANCY_IDS) {
      const a = assessProject(project({ occupancy: id }));
      expect(a.headline.length, `${id} headline`).toBeGreaterThan(10);
      expect(a.findings.length, `${id} findings`).toBeGreaterThan(3);
      expect(Number.isFinite(a.permissibleArea), `${id} area`).toBe(true);
    }
  });

  it('never emits a finding without a headline or a topic', () => {
    for (const id of OCCUPANCY_IDS) {
      for (const f of assessProject(project({ occupancy: id })).findings) {
        expect(f.headline, `${id}/${f.id}`).toBeTruthy();
        expect(f.topic, `${id}/${f.id}`).toBeTruthy();
        expect(['ok', 'attention', 'blocked', 'info']).toContain(f.status);
      }
    }
  });

  it('survives a degenerate project without throwing or emitting NaN', () => {
    const a = assessProject(project({ plotArea: 0, plotFrontage: 0, plotDepth: 0, roadWidth: 0, proposedBuiltUpArea: 0 }));
    expect(a.findings.length).toBeGreaterThan(0);
    expect(a.headline).not.toMatch(/NaN|Infinity|undefined/);
    for (const f of a.findings) expect(f.headline).not.toMatch(/NaN|Infinity|undefined/);
  });
});

describe('assessProject — the verdict tracks the rules', () => {
  it('blocks a use whose road is too narrow, and names the fix', () => {
    const a = assessProject(project({ occupancy: 'com_mall', roadWidth: 9 }));
    const road = a.findings.find((f) => f.id === 'use-road-width')!;
    expect(road.status).toBe('blocked');
    expect(road.fix?.patch.roadWidth).toBe(OCCUPANCIES.com_mall.minRoadWidthM);
    expect(a.canBuild).toBe(false);
  });

  it('clears the same use once the road is wide enough', () => {
    const a = assessProject(project({ occupancy: 'com_mall', plotArea: 5000, roadWidth: 24 }));
    expect(a.findings.find((f) => f.id === 'use-road-width')!.status).toBe('ok');
  });

  it('reports headroom when the proposal is under the entitlement', () => {
    const a = assessProject(project({ occupancy: 'res_single', plotArea: 320, proposedBuiltUpArea: 400 }));
    const far = a.findings.find((f) => f.id === 'far')!;
    expect(far.status).toBe('ok');
    expect(far.headline).toMatch(/spare/);
  });

  it('offers to buy the shortfall when the proposal is over the free entitlement', () => {
    const a = assessProject(project({ occupancy: 'res_single', plotArea: 320, roadWidth: 12, proposedBuiltUpArea: 640 }));
    const far = a.findings.find((f) => f.id === 'far')!;
    expect(far.status).toBe('attention');
    expect(far.money?.amount).toBeGreaterThan(0);
  });

  it('blocks a proposal beyond the absolute ceiling, with no fee offered', () => {
    const a = assessProject(project({ occupancy: 'res_single', plotArea: 320, proposedBuiltUpArea: 5000 }));
    const far = a.findings.find((f) => f.id === 'far')!;
    expect(far.status).toBe('blocked');
    expect(far.nonNegotiable).toBe(true);
    expect(far.money).toBeUndefined();
  });

  it('marks a high-rise fire setback deficit as impossible to buy off', () => {
    const a = assessProject(project({
      occupancy: 'res_group_housing', plotArea: 4000, plotFrontage: 60, roadWidth: 24,
      buildingHeight: 30, frontSetbackProvided: 2, rearSetbackProvided: 2, side1Provided: 2, side2Provided: 2,
    }));
    const setbacks = a.findings.find((f) => f.id === 'setbacks')!;
    expect(setbacks.status).toBe('blocked');
    expect(setbacks.nonNegotiable).toBe(true);
  });

  it('flags the plot that has no room left inside its own setbacks', () => {
    // Above 1200 sqm both sides carry 1.5 m, so a 5 m frontage leaves 2.0 m — under the
    // 2.4 m minimum room width.
    const a = assessProject(project({ occupancy: 'res_single', plotArea: 2000, plotFrontage: 5, plotDepth: 400 }));
    expect(a.findings.find((f) => f.id === 'envelope-viability')?.status).toBe('blocked');
  });

  it('routes a small house to self-declaration and a large scheme to the full route', () => {
    const route = (p: Parameters<typeof assessProject>[0]) =>
      assessProject(p).findings.find((f) => f.id === 'route')!;
    expect(route(project({ occupancy: 'res_single', plotArea: 90 })).clause).toBe('Clause 2.1.2(ii)');
    expect(route(project({ occupancy: 'res_group_housing', plotArea: 5000, roadWidth: 24 })).clause)
      .toBe('Clause 2.1.2(iv)');
  });

  it('keeps a multi-unit building off the instant route, which Clause 2.1.2(iii) denies it', () => {
    // B-047: the old branch admitted any Residential except group housing, so a multi-unit
    // on a 400 m² plot was told it had instant approval. The clause reads "(except
    // multi-unit)".
    const r = assessProject(project({ occupancy: 'res_multi', plotArea: 400, buildingHeight: 12 }))
      .findings.find((f) => f.id === 'route')!;
    expect(r.clause).toMatch(/2\.1\.2\(iii\) and \(iv\)/);
    expect(r.detail).toMatch(/except multi-unit/);
  });

  it('cites a rule about permission, not one about occupancy thresholds', () => {
    const r = assessProject(project()).findings.find((f) => f.id === 'route')!;
    expect(r.rule).toBe('permission.route');
    expect(r.confidence).toBe('gazette');
  });

  it('raises the affordable-housing obligation only where the occupancy triggers it', () => {
    expect(assessProject(project({ occupancy: 'res_single' })).findings.some((f) => f.id === 'ews-lig')).toBe(false);
    const gh = assessProject(project({ occupancy: 'res_group_housing', plotArea: 5000, roadWidth: 24 }));
    expect(gh.findings.some((f) => f.id === 'ews-lig')).toBe(true);
  });

  it('scales parking with the occupancy, not just the area', () => {
    const home = assessProject(project({ occupancy: 'res_single', proposedBuiltUpArea: 400 }));
    const mall = assessProject(project({ occupancy: 'com_mall', plotArea: 5000, roadWidth: 24, proposedBuiltUpArea: 400 }));
    const need = (a: ReturnType<typeof assessProject>) =>
      Number(a.findings.find((f) => f.id === 'parking')!.required!.match(/\d+/)![0]);
    expect(need(mall)).toBeGreaterThan(need(home));
  });
});

describe('assessProject — every fix actually resolves its finding', () => {
  it('applying a fix does not leave the same finding blocked', () => {
    const cases: Partial<ProjectState>[] = [
      { occupancy: 'com_mall', roadWidth: 9 },
      { occupancy: 'res_single', plotArea: 320, proposedBuiltUpArea: 5000 },
      { occupancy: 'res_single', plotArea: 400, hasRWH: false },
      { occupancy: 'res_single', frontSetbackProvided: 0, rearSetbackProvided: 0 },
    ];
    for (const over of cases) {
      const before = assessProject(project(over));
      for (const finding of before.findings) {
        if (!finding.fix || finding.status === 'ok') continue;
        const after = assessProject(project({ ...over, ...finding.fix.patch }));
        const same = after.findings.find((f) => f.id === finding.id);
        expect(same?.status, `${finding.id} after "${finding.fix.label}"`).not.toBe('blocked');
      }
    }
  });
});

describe('B-031 — the purchasable FAR charge on the finding itself', () => {
  const gazetteExample = project({
    occupancy: 'res_group_housing',
    areaType: 'non_built_up',
    plotArea: 2_000,
    roadWidth: 30,
    circleRate: 35_000,
    proposedBuiltUpArea: 16_000,
    greenRating: 'none',
  });

  it('quotes the gazette worked example to the rupee', () => {
    const far = assessProject(gazetteExample).findings.find((f) => f.id === 'far');
    // Clause 9.2.5's own example: base 2.5 on 2000 m², 5000 m² purchasable and 6000 m²
    // premium, at ₹35,000/m². The gazette prints ₹9,52,00,000.
    expect(far?.money?.amount).toBe(9_52_00_000);
  });

  it('no longer charges the floor area directly, which was 2.5× too much here', () => {
    const far = assessProject(gazetteExample).findings.find((f) => f.id === 'far');
    const extra = 16_000 - 2.5 * 2_000;
    expect(far?.money?.amount).not.toBe(extra * 35_000 * 0.4);
    expect(far?.working).toMatch(/÷ base FAR/);
  });

  it('prices each use at its own factor coefficient, not a flat 0.40', () => {
    const commercial = assessProject(project({
      occupancy: 'com_complex', plotArea: 1_000, roadWidth: 30,
      circleRate: 35_000, proposedBuiltUpArea: 4_000,
    })).findings.find((f) => f.id === 'far');
    // Commercial is 0.50 purchasable and 1.0 premium — the old flat 0.40 under-charged both.
    expect(commercial?.working).toMatch(/× 0\.5 /);
    expect(commercial?.money?.amount).toBeGreaterThan(2_500 * 35_000 * 0.4);
  });
});

/**
 * B-044 — the height ceiling is the stricter of the two clauses that give one.
 *
 * V-010 records that Clause 3.2.4.1 keys the plotted-residential ceiling on plot size and
 * Clause 4.1.4 on unit count, and that the engine applies the lower. `setbacks.ts` computed
 * it; `findings.ts` reported `occupancy.maxHeightM` alone and so gave the laxer figure on
 * every plot under 300 m². Nothing covered a project where the two disagree, which is the
 * only case V-010 is about.
 */
describe('B-044 — two clauses give the height ceiling and the stricter governs', () => {
  const at = (occupancy: ProjectState['occupancy'], plotArea: number, buildingHeight: number) =>
    assessProject({
      ...DEFAULT_PROJECT, occupancy, plotArea, plotFrontage: 10, plotDepth: plotArea / 10,
      roadWidth: 12, buildingHeight, proposedBuiltUpArea: plotArea,
    }).findings.find((f) => f.id === 'height');

  it('caps a multi-unit on a 200 m² plot at 15 m, not Clause 4.1.4\'s 17.5', () => {
    const finding = at('res_multi', 200, 17);
    expect(finding?.status).toBe('blocked');
    expect(finding?.required).toBe('≤ 15 m');
    expect(finding?.detail).toMatch(/Clause 3\.2\.4\.1/);
    expect(finding?.fix?.patch.buildingHeight).toBe(15);
  });

  it('caps a single unit on a 400 m² plot at 15 m, which is Clause 4.1.4\'s limb', () => {
    const finding = at('res_single', 400, 17);
    expect(finding?.status).toBe('blocked');
    expect(finding?.required).toBe('≤ 15 m');
  });

  it('names both clauses whenever they differ, rather than resolving them silently', () => {
    expect(at('res_multi', 200, 12)?.detail).toMatch(/V-010/);
    expect(at('res_single', 400, 12)?.detail).toMatch(/V-010/);
  });

  it('says nothing about a split where the two clauses agree', () => {
    // A multi-unit above 300 m²: both clauses give 17.5.
    const finding = at('res_multi', 400, 12);
    expect(finding?.status).toBe('ok');
    expect(finding?.detail).not.toMatch(/V-010/);
    expect(finding?.required).toBe('≤ 17.5 m');
  });

  it('leaves a use Table 3.2.1 does not cover on its own ceiling', () => {
    // Group housing has no ceiling at all (Clause 4.2.4) and no plotted-residential band.
    const finding = at('res_group_housing', 2000, 40);
    expect(finding?.status).toBe('ok');
    expect(finding?.required).toBe('Governed by road width and fire clearance');
  });
});
