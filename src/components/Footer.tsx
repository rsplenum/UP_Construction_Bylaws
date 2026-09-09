import React from 'react';
import { ExternalLink } from 'lucide-react';

const SPATIAL_PORTALS = [
  { label: 'ISRO Bhuvan Urban GIS', href: 'https://bhuvan-app1.nrsc.gov.in' },
  { label: 'RSAC-UP Spatial Data', href: 'https://rsacup.org.in' },
  { label: 'UP OBPAS Single Window', href: 'https://niveshmitra.up.nic.in' },
];

const STATUTORY_REFERENCES = [
  'UP Urban Planning & Development Act, 1973',
  'National Building Code of India (NBC 2016)',
  'Supreme Court River Ganga 200m orders',
  'Taj Trapezium Zone (TTZ) guidelines',
];

export const Footer: React.FC = () => (
  <footer className="mt-auto border-t border-black/[0.06] bg-white/80 py-8 text-xs text-slate-500 backdrop-blur-xl print:hidden dark:border-white/[0.08] dark:bg-[#161617]/80 dark:text-slate-400">
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 border-b border-black/[0.04] pb-6 md:grid-cols-4 dark:border-white/[0.06]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              UP
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">UP Building Byelaws 2025</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Statutory compliance verification, Master Plan 2031 geoportals, setback engine and GIS analysis across the
            22 Development Authorities of Uttar Pradesh.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-semibold text-slate-900 dark:text-white">Spatial portals</h2>
          <ul className="space-y-1.5 text-[11px]">
            {SPATIAL_PORTALS.map((portal) => (
              <li key={portal.href}>
                <a
                  href={portal.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 rounded transition-colors hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:text-emerald-400"
                >
                  {portal.label}
                  <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-semibold text-slate-900 dark:text-white">Statutory references</h2>
          <ul className="space-y-1.5 text-[11px]">
            {STATUTORY_REFERENCES.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-semibold text-slate-900 dark:text-white">Status of this tool</h2>
          <p className="text-[11px] leading-relaxed">
            An unofficial decision-support aid. Figures are computed from the published byelaws but carry no statutory
            force. Verify every value against the gazette and the concerned Development Authority before submission.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row dark:text-slate-500">
        <p>Byelaws text © Government of Uttar Pradesh. Reproduced for public reference.</p>
        <p className="flex items-center gap-3">
          <span>Runs entirely in your browser — no project data leaves this device</span>
        </p>
      </div>
    </div>
  </footer>
);
