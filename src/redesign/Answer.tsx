import React, { useMemo, useState } from 'react';
import { assessProject, type Finding } from '../domain/findings';
import { DEFAULT_PROJECT, type ProjectState } from '../domain/project';
import { OCCUPANCIES, type OccupancyId } from '../domain/occupancy';
import { resolveRequiredSetbacks } from '../domain/setbacks';

const inr = (n: number): string => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.00$/, '')} crore`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2).replace(/\.00$/, '')} lakh`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
const m2 = (n: number): string => `${Math.round(n).toLocaleString('en-IN')} m²`;

/* ── the plot, drawn plainly ─────────────────────────────────────────────── */

const Plot: React.FC<{ project: ProjectState }> = ({ project }) => {
  const required = useMemo(
    () => resolveRequiredSetbacks({
      occupancy: project.occupancy,
      plotArea: project.plotArea,
      roadWidth: project.roadWidth,
      buildingHeight: project.buildingHeight,
      isCornerPlot: project.isCornerPlot,
      areaType: project.areaType,
    }),
    [project],
  );

  const w = Math.max(1, project.plotFrontage);
  const d = Math.max(1, project.plotArea / w);
  const inner = {
    w: Math.max(0, w - required.side1 - required.side2),
    d: Math.max(0, d - required.front - required.rear),
  };

  const S = 320 / Math.max(w, d);
  const [pw, pd] = [w * S, d * S];

  return (
    <figure className="plot">
      <svg viewBox={`-30 -22 ${pw + 60} ${pd + 58}`} role="img"
        aria-label={`Plot ${w.toFixed(1)} by ${d.toFixed(1)} metres, with ${m2(inner.w * inner.d)} buildable`}>
        <rect x="0" y="0" width={pw} height={pd} className="plot-edge" />
        <rect
          x={required.side1 * S} y={required.front * S}
          width={inner.w * S} height={inner.d * S}
          className="plot-build"
        />
        <text x={pw / 2} y="-8" className="plot-dim">{w.toFixed(1)} m</text>
        <text x={-10} y={pd / 2} className="plot-dim" transform={`rotate(-90 ${-10} ${pd / 2})`}>
          {d.toFixed(1)} m
        </text>
        <line x1="0" y1={pd + 16} x2={pw} y2={pd + 16} className="plot-road" />
        <text x={pw / 2} y={pd + 34} className="plot-dim">{project.roadWidth} m road</text>
      </svg>
      <figcaption>
        The shaded area is where the building may stand — {m2(inner.w * inner.d)} of{' '}
        {m2(project.plotArea)}.
      </figcaption>
    </figure>
  );
};

/* ── a drawer, which does not exist when it is empty ─────────────────────── */

const Drawer: React.FC<{
  title: string; count?: string; tone?: 'plain' | 'money' | 'stop';
  children: React.ReactNode;
}> = ({ title, count, tone = 'plain', children }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className={`drawer drawer-${tone}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="drawer-title">{title}</span>
        {count && <span className="drawer-count">{count}</span>}
        <span className="drawer-mark" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="drawer-body">{children}</div>}
    </section>
  );
};

/* ── the inputs, as one sentence you can open ────────────────────────────── */

const Ask: React.FC<{
  project: ProjectState; set: (p: Partial<ProjectState>) => void;
}> = ({ project, set }) => {
  const [open, setOpen] = useState(false);
  const occ = OCCUPANCIES[project.occupancy];

  const num = (
    id: keyof ProjectState, label: string, suffix: string, step = 10,
  ) => (
    <label className="field" htmlFor={`f-${String(id)}`}>
      <span>{label}</span>
      <input
        id={`f-${String(id)}`} type="number" inputMode="decimal" step={step}
        value={String(project[id] ?? '')}
        onChange={(e) => set({ [id]: Number(e.target.value) } as Partial<ProjectState>)}
      />
      <span className="suffix">{suffix}</span>
    </label>
  );

  return (
    <div className="ask">
      <button type="button" className="ask-line" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>
          {occ.plain} · {m2(project.plotArea)} plot · {project.roadWidth} m road ·{' '}
          {m2(project.proposedBuiltUpArea)} · {project.buildingHeight} m tall
        </span>
        <span className="ask-edit">{open ? 'done' : 'change'}</span>
      </button>

      {open && (
        <div className="ask-form">
          <label className="field" htmlFor="f-occupancy">
            <span>Building</span>
            <select
              id="f-occupancy" value={project.occupancy}
              onChange={(e) => set({ occupancy: e.target.value as OccupancyId })}
            >
              {Object.values(OCCUPANCIES).map((o) => (
                <option key={o.id} value={o.id}>{o.plain}</option>
              ))}
            </select>
          </label>
          {num('plotArea', 'Plot', 'm²')}
          {num('roadWidth', 'Road in front', 'm', 1)}
          {num('proposedBuiltUpArea', 'Floor area wanted', 'm²')}
          {num('buildingHeight', 'Height', 'm', 0.5)}
          <label className="field" htmlFor="f-stage">
            <span>Built yet</span>
            <select
              id="f-stage" value={project.buildingStage}
              onChange={(e) => set({ buildingStage: e.target.value as ProjectState['buildingStage'] })}
            >
              <option value="proposed">No — planning it</option>
              <option value="under_construction">Under construction</option>
              <option value="built">Already built</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
};

/* ── the screen ──────────────────────────────────────────────────────────── */

export const Answer: React.FC = () => {
  const [project, setProject] = useState<ProjectState>({
    ...DEFAULT_PROJECT, plotArea: 320, roadWidth: 12,
    proposedBuiltUpArea: 450, buildingHeight: 12,
  });
  const set = (p: Partial<ProjectState>) => setProject((v) => ({ ...v, ...p }));
  const a = useMemo(() => assessProject(project), [project]);

  const stops = a.findings.filter((f) => f.status === 'blocked');
  const todo = a.findings.filter((f) => f.status === 'attention');
  const over = a.proposedArea > a.permissibleArea;

  const verdict = stops.length > 0 ? 'stop' : over ? 'trim' : 'yes';
  const word = { yes: 'Yes.', trim: 'Yes, smaller.', stop: 'Not as drawn.' }[verdict];
  const line = {
    yes: `You can build ${m2(a.permissibleArea)} here. You asked for ${m2(a.proposedArea)}.`,
    trim: `This plot allows ${m2(a.permissibleArea)}. You asked for ${m2(a.proposedArea)} — ${m2(a.proposedArea - a.permissibleArea)} too much.`,
    stop: stops[0]?.headline ?? '',
  }[verdict];

  const list = (items: Finding[]) => (
    <ul className="findings">
      {items.map((f) => (
        <li key={f.id}>
          <p>{f.headline}</p>
          {f.required && <p className="fine">Needs {f.required}{f.proposed ? ` · you have ${f.proposed}` : ''}</p>}
        </li>
      ))}
    </ul>
  );

  return (
    <main>
      <Ask project={project} set={set} />

      <section className={`verdict verdict-${verdict}`}>
        <h1>{word}</h1>
        <p>{line}</p>
      </section>

      <Plot project={project} />

      <div className="drawers">
        {a.ledger.total > 0 ? (
          <Drawer title="What you pay the government" count={inr(a.ledger.total)} tone="money">
            <ul className="bill">
              {a.ledger.lines.filter((l) => !l.supersededBy).map((l) => (
                <li key={l.label}>
                  <span>{l.label}</span>
                  <span className="figure">{l.free ? 'nothing' : inr(l.amount)}{l.perUnit ? ' each' : ''}</span>
                </li>
              ))}
            </ul>
            <p className="fine">Not counting the sanction fee, connection charges or stamp duty.</p>
          </Drawer>
        ) : (
          <p className="nothing-due">Nothing to pay the government at these figures.</p>
        )}

        {stops.length > 0 && (
          <Drawer title="What stops you" count={String(stops.length)} tone="stop">
            {list(stops)}
          </Drawer>
        )}

        {todo.length > 0 && (
          <Drawer title="To settle before you apply" count={String(todo.length)}>
            {list(todo)}
          </Drawer>
        )}
      </div>

      <p className="honesty">
        {a.disputedCount > 0
          ? `${a.disputedCount} of these answers rest on a clause that can be read more than one way. The stricter reading is used.`
          : 'Every answer here is read straight from the gazette.'}
      </p>
    </main>
  );
};
