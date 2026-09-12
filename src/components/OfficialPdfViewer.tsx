import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { DOCUMENT_METADATA } from '../data/byelawsData';
import {
  GAZETTE_DOCUMENTS,
  GAZETTE_TOTAL_BYTES,
  GAZETTE_TOTAL_PAGES,
  GazetteDocument,
  documentLabel,
  formatBytes,
  gazetteRange,
} from '../data/gazetteDocuments';

/**
 * The source text, as supplied — one chapter at a time.
 *
 * This reads the same per-chapter PDFs under docs/source/gazette/pdf/ that every rule in
 * the engine is verified against, so a finding's citation and the page you open here are
 * the same bytes. Nothing on this screen is asserted: page counts, sizes and checksums
 * are measured by tools/build-gazette-manifest.py from the files themselves.
 */
export const OfficialPdfViewer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(GAZETTE_DOCUMENTS[0]?.id ?? '');
  const [filterText, setFilterText] = useState('');
  const viewerRef = useRef<HTMLDivElement>(null);

  const selected: GazetteDocument | undefined = useMemo(
    () => GAZETTE_DOCUMENTS.find((d) => d.id === selectedId),
    [selectedId],
  );

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return GAZETTE_DOCUMENTS;
    return GAZETTE_DOCUMENTS.filter((d) =>
      d.title.toLowerCase().includes(q)
      || d.summary.toLowerCase().includes(q)
      || documentLabel(d).toLowerCase().includes(q)
      || String(d.number) === q,
    );
  }, [filterText]);

  const open = (doc: GazetteDocument) => {
    setSelectedId(doc.id);
    // On a phone the list sits above the reader, so the page has to follow the choice.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* What this is, and what it is not */}
      {/* Not .apple-card: that class sets a flat background and, being unlayered CSS,
          beats Tailwind's gradient utility — which left this panel white-on-white. */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Source document, as supplied
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-xs text-slate-300">
                {DOCUMENT_METADATA.version} • {DOCUMENT_METADATA.date}
              </span>
              <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                {GAZETTE_DOCUMENTS.length} documents • {GAZETTE_TOTAL_PAGES} pages
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              {DOCUMENT_METADATA.title}
            </h2>

            <p className="text-sm leading-relaxed text-slate-300">
              These are the pages every rule in this app was checked against. When a finding
              cites a clause, this is the document it was read from — not a summary of it.
              Choose a chapter to open it.
            </p>

            <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
              <p>
                <span className="font-semibold">Provenance, stated plainly.</span>{' '}
                The supplied file is labelled <span className="font-mono">4/9/25 Version TMPR8</span>{' '}
                from the {DOCUMENT_METADATA.department}. TMPR8 reads as a revision marker rather
                than a gazette notification number, and the file carries no notification number
                or date of publication. Verify against the notified byelaws before relying on
                any figure for a submission.
              </p>
            </div>
          </div>

          <dl className="flex-shrink-0 space-y-2 text-xs text-slate-400 md:text-right">
            <div>
              <dt className="uppercase tracking-wide text-[10px] text-slate-500">Governing act</dt>
              <dd className="text-slate-300">{DOCUMENT_METADATA.governingAct}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-[10px] text-slate-500">Held in repository</dt>
              <dd className="font-mono text-slate-300">{formatBytes(GAZETTE_TOTAL_BYTES)}, checksummed</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Index */}
        <div className="space-y-4 lg:col-span-1">
          <div className="apple-card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contents</h3>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {GAZETTE_DOCUMENTS.filter((d) => d.kind === 'chapter').length} chapters
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search chapters or topics…"
                aria-label="Search chapters"
                className="h-8 w-full rounded-lg border border-black/[0.08] bg-slate-50 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-white"
              />
            </div>

            <div className="max-h-[640px] space-y-1.5 overflow-y-auto pr-1 text-xs">
              {filtered.map((doc) => {
                const isOpen = doc.id === selectedId;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => open(doc)}
                    aria-current={isOpen ? 'true' : undefined}
                    className={`w-full rounded-xl border p-2.5 text-left transition-all ${
                      isOpen
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                        : 'border-black/[0.04] bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.06] dark:bg-[#161617] dark:text-slate-300 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {documentLabel(doc)}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {gazetteRange(doc)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs font-medium leading-snug text-slate-900 dark:text-white">
                      {doc.title}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400">
                        {doc.pdfPages} {doc.pdfPages === 1 ? 'page' : 'pages'} • {formatBytes(doc.bytes)}
                      </span>
                      <span className="flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                        {isOpen ? 'Open' : 'Read'}
                        <ChevronRight className="ml-0.5 h-3 w-3" />
                      </span>
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nothing matches “{filterText}”.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reader */}
        <div ref={viewerRef} className="space-y-4 lg:col-span-2">
          <div className="apple-card flex h-[760px] flex-col overflow-hidden border border-black/[0.08] dark:border-white/[0.1]">
            <div className="flex items-center justify-between border-b border-black/[0.06] bg-slate-50 p-3.5 dark:border-white/[0.08] dark:bg-[#161617]">
              <div className="flex min-w-0 items-center space-x-2">
                <FileText className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selected ? `${documentLabel(selected)} — ${selected.title}` : 'Choose a chapter'}
                </span>
              </div>

              {selected && (
                <div className="flex flex-shrink-0 items-center space-x-2 text-xs">
                  <a
                    href={`/${selected.file}`}
                    download={`UP-Byelaws-2025-${selected.id}.pdf`}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>
                  <a
                    href={`/${selected.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1 font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              )}
            </div>

            <div className="relative flex-1 bg-slate-200 dark:bg-black/80">
              {selected ? (
                <iframe
                  // Remount on change so the browser's PDF plugin reloads rather than
                  // keeping the previous chapter's scroll position and page count.
                  key={selected.id}
                  src={`/${selected.file}#toolbar=1&navpanes=1&statusbar=1`}
                  title={`${documentLabel(selected)} — ${selected.title}`}
                  className="h-full w-full border-0"
                />
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-slate-500">
                  Choose a chapter from the list.
                </p>
              )}
            </div>

            {selected && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500 dark:border-white/[0.08] dark:bg-[#161617] dark:text-slate-400">
                <span>
                  Gazette {gazetteRange(selected)} • {selected.pdfPages}{' '}
                  {selected.pdfPages === 1 ? 'page' : 'pages'} • {formatBytes(selected.bytes)}
                </span>
                <span className="font-mono" title="md5 of this file, as checked into the repository">
                  md5 {selected.md5.slice(0, 12)}…
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
