import React from 'react';
import { MASTER_PLAN_AUTHORITIES } from '../domain/master-plan-zones';
import { TERMS } from '../domain/glossary';

/**
 * Who this applies to, and what the words mean.
 *
 * Two things sat missing at the bottom of every answering screen. The first item on every
 * serious plot-buying checklist is "establish which authority has jurisdiction", because
 * that decides which FAR, which setbacks and which approval regime apply — and we were a
 * UP Development Authority tool that never said so, leaving a reader in Ghaziabad unable
 * to tell whether any of it was theirs.
 *
 * The second is that every term of art on these screens is a Hindi word we print only in
 * English. This is not a translation layer, and a half-translated interface would read
 * worse than an English one. It is the smaller, honest version: where a statutory term
 * appears, the word the reader would actually use appears with it, once.
 */
export const ScopeFooter: React.FC = () => (
  <footer className="mt-8 border-t border-slate-200 pt-4 dark:border-white/10">
    <p className="max-w-[72ch] text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-400">
      These are the <strong className="font-medium">Uttar Pradesh Building Construction and
      Development Byelaws 2025</strong>, as they apply to the Development Authorities of
      Uttar Pradesh. They do not apply outside the state, and an individual Authority may
      vary them by its own resolution — check with yours before relying on any figure here.
    </p>

    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
      <details className="group">
        <summary className="cursor-pointer list-none text-[11px] text-sky-700 marker:content-none hover:underline dark:text-sky-400">
          The {MASTER_PLAN_AUTHORITIES.length} authorities named in the byelaws
        </summary>
        <p className="mt-1.5 max-w-[72ch] text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
          {MASTER_PLAN_AUTHORITIES.join(' · ')}
        </p>
        <p className="mt-1.5 max-w-[72ch] text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          Appendix-15 of the gazette. An Authority not on this list is still governed by the
          byelaws; it simply has no master-plan zone table printed there.
        </p>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none text-[11px] text-sky-700 marker:content-none hover:underline dark:text-sky-400">
          नक्शा, शमनीकरण, गज — the words these screens are about
        </summary>
        <dl className="mt-1.5 max-w-[72ch] space-y-1.5">
          {TERMS.map((t) => (
            <div key={t.id} className="text-[11px] leading-snug">
              <dt className="text-slate-800 dark:text-slate-200">
                <span className="font-medium">{t.hindi}</span>
                <span className="text-slate-500 dark:text-slate-400"> · {t.roman} · {t.english}</span>
              </dt>
              <dd className="text-slate-600 dark:text-slate-400">{t.gloss}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  </footer>
);
