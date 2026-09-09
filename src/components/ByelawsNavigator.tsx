import React, { useEffect, useMemo, useState } from 'react';
import type { ByelawSection } from '../types';
import {
  BYELAW_CHAPTERS,
  KEY_DEFINITIONS,
  DEEMED_NOC_DEPTS,
  FAR_EXEMPTIONS_TABLE,
  PLOTTED_RESIDENTIAL_SETBACKS,
  HIGH_RISE_SETBACKS,
  EVCI_CHARGER_SPECS,
  DOCUMENT_METADATA
} from '../data/byelawsData';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  Layers,
  Building,
  Sparkles,
  ArrowLeftRight,
  Pin,
  StickyNote
} from 'lucide-react';
import { AuthorityZoningComparison } from './AuthorityZoningComparison';
import { StickyNotesOverlay } from './StickyNotesOverlay';
import { StatutoryRationaleGuide } from './StatutoryRationaleGuide';

interface ByelawsNavigatorProps {
  searchQuery: string;
  onSelectCalculator?: (type: string) => void;
}

const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || !query.trim()) {
    return <>{text}</>;
  }
  const cleanQuery = query.trim();
  const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-300 text-amber-950 font-semibold px-1 py-0.5 rounded shadow-xs dark:text-amber-200"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const ByelawsNavigator: React.FC<ByelawsNavigatorProps> = ({
  searchQuery,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<number | 'all'>('all');
  const [subView, setSubView] = useState<'chapters' | 'rationale' | 'definitions' | 'deemed_noc' | 'far_exemptions' | 'setback_tables' | 'evci' | 'authority_comparison'>('chapters');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    '1.2': true,
    '2.1.2': true,
    '3.2.2': true,
    '3.2.4': true,
    '9.2.3': true,
    '16.3.2': true,
  });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    // navigator.clipboard is undefined outside a secure context and rejects when the
    // document is not focused; the unguarded call threw and left no feedback.
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(id);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      setCopiedSection(`error:${id}`);
      setTimeout(() => setCopiedSection(null), 2500);
    }
  };

  /**
   * Search the whole provision, not just its first paragraph.
   *
   * The previous filter looked at the chapter title, the chapter summary and each
   * section's clauseNumber, title and content — but never the subsections, their
   * bullets, the statutory tables or the notes, which is where most of the substance
   * lives. It also matched the query as one literal string, so "far setback" found
   * nothing, and it reported no hit count.
   */
  const searchTerms = useMemo(
    () =>
      searchQuery
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean),
    [searchQuery],
  );

  const sectionHaystack = (sec: ByelawSection): string =>
    [
      sec.clauseNumber,
      sec.title,
      sec.content,
      ...(sec.subsections ?? []).flatMap((sub) => [sub.clauseNumber, sub.title, sub.content, ...(sub.bullets ?? [])]),
      sec.table?.caption ?? '',
      ...(sec.table?.headers ?? []),
      ...(sec.table?.rows ?? []).flat(),
      ...(sec.notes ?? []),
    ]
      .join(' ')
      .toLowerCase();

  const matchesAllTerms = (haystack: string): boolean => searchTerms.every((term) => haystack.includes(term));

  const { filteredChapters, matchingSectionIds, totalMatchCount } = useMemo(() => {
    const matchIds = new Set<string>();
    let count = 0;

    const chapters = BYELAW_CHAPTERS.filter((ch) => {
      if (selectedChapterId !== 'all' && ch.id !== selectedChapterId) return false;
      if (searchTerms.length === 0) return true;

      const chapterMeta = `${ch.chapterNumber} ${ch.title} ${ch.summary}`.toLowerCase();
      let chapterHasMatch = matchesAllTerms(chapterMeta);

      for (const sec of ch.sections) {
        if (matchesAllTerms(sectionHaystack(sec))) {
          matchIds.add(sec.id);
          chapterHasMatch = true;
          count++;
        }
      }

      return chapterHasMatch;
    });

    return { filteredChapters: chapters, matchingSectionIds: matchIds, totalMatchCount: count };
  }, [searchTerms, selectedChapterId]);

  // Open the sections that matched, so a hit is not hidden behind a collapsed header.
  useEffect(() => {
    if (matchingSectionIds.size === 0) return;
    setExpandedSections((prev) => {
      const next = { ...prev };
      matchingSectionIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [matchingSectionIds]);

  const filteredDefinitions = useMemo(() => {
    if (searchTerms.length === 0) return KEY_DEFINITIONS;
    return KEY_DEFINITIONS.filter((d) =>
      matchesAllTerms(`${d.term} ${d.definition} ${d.category}`.toLowerCase()),
    );
  }, [searchTerms]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-xl border border-slate-700 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Statutory Planning Code • Uttar Pradesh Official Gazette</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {DOCUMENT_METADATA.title}
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl dark:text-slate-400">
              Gazetted by {DOCUMENT_METADATA.department}, {DOCUMENT_METADATA.date} (Version: {DOCUMENT_METADATA.version}).
              Enforced across all 22 Urban Development Authorities and Special Development Areas in Uttar Pradesh.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xl font-bold text-emerald-400">18</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Statutory Chapters</div>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xl font-bold text-emerald-400">102</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Defined Standards</div>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xl font-bold text-emerald-400">15</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Mandatory Schedules</div>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-xl font-bold text-emerald-400">22</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Development Authorities</div>
            </div>
          </div>
        </div>

        {searchTerms.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
          >
            <span className="font-semibold">
              {totalMatchCount === 0
                ? 'No provision matches'
                : `${totalMatchCount} provision${totalMatchCount === 1 ? '' : 's'} across ${filteredChapters.length} chapter${filteredChapters.length === 1 ? '' : 's'}`}
            </span>
            <span className="text-emerald-300/70">for “{searchQuery.trim()}”</span>
            {totalMatchCount === 0 && (
              <span className="text-emerald-300/70">
                — searching clause numbers, titles, body text, sub-clauses, tables and notes.
              </span>
            )}
          </div>
        )}

        {/* Quick Sub-view Selector */}
        <div className="mt-6 pt-4 border-t border-slate-700/80 flex flex-wrap gap-2">
          {[
            { id: 'chapters', label: 'Statutory Provisions', icon: BookOpen },
            { id: 'rationale', label: 'Engineering & Urban Rationale', icon: Sparkles, highlight: true },
            { id: 'authority_comparison', label: 'Compare Authorities (Zoning Matrix)', icon: ArrowLeftRight },
            { id: 'definitions', label: 'Statutory Definitions', icon: FileText },
            { id: 'deemed_noc', label: 'Inter-Agency NOC Timelines', icon: Clock },
            { id: 'far_exemptions', label: 'FAR Exemptions Matrix', icon: Layers },
            { id: 'setback_tables', label: 'Setback Rules Summary', icon: Building },
            { id: 'evci', label: 'EV Charging Infrastructure', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubView(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.highlight && !active ? 'text-emerald-400' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBVIEW 1: CHAPTERS & SECTIONS */}
      {subView === 'chapters' && (
        <div className="space-y-4">
          {/* Chapter Quick Filter pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            <span className="text-slate-600 font-medium whitespace-nowrap dark:text-slate-400">Filter Chapter:</span>
            <button
              onClick={() => setSelectedChapterId('all')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedChapterId === 'all'
                  ? 'bg-emerald-700 text-white font-medium'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.12]'
              }`}
            >
              All Chapters (1-18)
            </button>
            {BYELAW_CHAPTERS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapterId(ch.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedChapterId === ch.id
                    ? 'bg-emerald-700 text-white font-medium'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.12]'
                }`}
              >
                Ch {ch.id}: {ch.title.slice(0, 18)}...
              </button>
            ))}
          </div>

          {filteredChapters.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-600 dark:bg-[#161617] dark:border-white/[0.10] dark:text-slate-400">
              No sections found matching "{searchQuery}". Try searching for terms like "setback", "FAR", "basement", or "fire".
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChapters.map((ch) => (
                <div key={ch.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:bg-[#161617] dark:border-white/[0.10]">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-2 dark:border-white/[0.06] dark:bg-white/[0.06]">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-xs font-bold bg-slate-900 text-white rounded dark:bg-black">
                          {ch.chapterNumber}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          <HighlightText text={ch.title} query={searchQuery} />
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 dark:text-slate-400">
                        <HighlightText text={ch.summary} query={searchQuery} />
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-700 rounded self-start md:self-auto dark:bg-white/[0.12] dark:text-slate-300">
                      {ch.pageRange}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {ch.sections.map((sec) => {
                      const matchesSearch = Boolean(
                        searchQuery.trim() &&
                        (sec.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                         sec.content.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                         sec.clauseNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                      );
                      const isExpanded = matchesSearch || (expandedSections[sec.id] ?? false);
                      const textToCopy = `Clause ${sec.clauseNumber}: ${sec.title}\n\n${sec.content}`;
                      return (
                        <div
                          key={sec.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            matchesSearch
                              ? 'border-amber-300 bg-amber-50/40 dark:border-amber-500/40 dark:bg-amber-950/40'
                              : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50 dark:border-white/[0.10] dark:hover:bg-white/[0.06] dark:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => toggleSection(sec.id)}
                              className="flex items-center space-x-2 text-left flex-1 group"
                            >
                              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-500/30">
                                <HighlightText text={sec.clauseNumber} query={searchQuery} />
                              </span>
                              <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors dark:text-slate-100">
                                <HighlightText text={sec.title} query={searchQuery} />
                              </h4>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              )}
                            </button>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  window.dispatchEvent(
                                    new CustomEvent('open_byelaws_sticky_note', {
                                      detail: {
                                        quote: sec.content.slice(0, 160) + (sec.content.length > 160 ? '...' : ''),
                                        clauseRef: `Clause ${sec.clauseNumber}: ${sec.title}`,
                                        chapterTitle: ch.title,
                                      },
                                    })
                                  );
                                }}
                                title="Pin a session sticky note for this clause"
                                className="text-slate-600 hover:text-amber-600 p-1 rounded hover:bg-amber-100/60 transition-colors dark:text-slate-400"
                              >
                                <Pin className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => copyToClipboard(textToCopy, sec.id)}
                                title="Copy clause text"
                                className="text-slate-600 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors dark:text-slate-400"
                              >
                                {copiedSection === sec.id ? (
                                  <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed dark:text-slate-300">
                              <HighlightText text={sec.content} query={searchQuery} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBVIEW 2: DEFINITIONS DICTIONARY */}
      {subView === 'definitions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chapter 1.2: Statutory Definitions Dictionary
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Showing authoritative legal definitions as enacted in the 2025 Byelaws.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-medium self-start sm:self-auto dark:bg-white/[0.08] dark:text-slate-300">
              {filteredDefinitions.length} Terms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDefinitions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 hover:border-emerald-300 transition-colors space-y-1.5 dark:border-white/[0.10] dark:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 dark:text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <HighlightText text={item.term} query={searchQuery} />
                  </h4>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-white/[0.12] dark:text-slate-300">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-400">
                  <HighlightText text={item.definition} query={searchQuery} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBVIEW 3: DEEMED NOC TIMELINES */}
      {subView === 'deemed_noc' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chapter 2.2.3: Inter-Departmental NOCs & Deemed NOC Mandate
            </h3>
            <p className="text-xs text-slate-600 mt-1 dark:text-slate-400">
              Statutory response deadlines for planning permission approvals. If the department does not explicitly reject with recorded reasons within the timeframe, approval is deemed granted automatically on the 30th day.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.10]">
                  <th className="p-3 font-semibold">Sl.</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Applicability</th>
                  <th className="p-3 font-semibold">Mandatory Time</th>
                  <th className="p-3 font-semibold">Special Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.10]">
                {DEEMED_NOC_DEPTS.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.06]">
                    <td className="p-3 font-bold text-slate-600 dark:text-slate-400">{d.id}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{d.department}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{d.applicability}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 font-bold text-emerald-800 bg-emerald-100 rounded text-[11px] dark:text-emerald-300 dark:bg-emerald-950/50">
                        {d.timeDays}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 italic dark:text-slate-400">{d.notes || 'Deemed approval applies'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 space-y-1 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-200">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300" />
              <span>Crucial Deemed Approval Exception:</span>
            </div>
            <p>
              As per Paragraph 2.2.3(vi)(a), permits that involve the NOC of <strong>Defence, Indian Air Force, and Airport Authority of India (AAI)</strong> cannot be deemed approved; they must be issued only AFTER physical/formal NOC is received.
            </p>
          </div>
        </div>
      )}

      {/* SUBVIEW 4: FAR EXEMPTIONS TABLE */}
      {subView === 'far_exemptions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chapter 3.2.2.8: Comprehensive FAR Inclusion / Exemption Matrix
            </h3>
            <p className="text-xs text-slate-600 mt-1 dark:text-slate-400">
              Direct transcription of the official table determining what built elements are counted in Floor Area Ratio calculations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.10]">
                  <th className="p-2.5 font-semibold">Sl.</th>
                  <th className="p-2.5 font-semibold">Structure / Element</th>
                  <th className="p-2.5 font-semibold text-center">Single / Multi Res</th>
                  <th className="p-2.5 font-semibold text-center">Group Housing</th>
                  <th className="p-2.5 font-semibold text-center">Commercial / Mixed</th>
                  <th className="p-2.5 font-semibold text-center">Office</th>
                  <th className="p-2.5 font-semibold text-center">Institutional</th>
                  <th className="p-2.5 font-semibold text-center">Industrial</th>
                  <th className="p-2.5 font-semibold">Regulatory Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.10]">
                {FAR_EXEMPTIONS_TABLE.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.06]">
                    <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400">{item.id}</td>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">{item.structure}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.singleMultiRes ? 'bg-rose-100 text-rose-700 dark:text-rose-300 dark:bg-rose-950/50' : 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/50'}`}>
                        {item.singleMultiRes ? 'Counted (Y)' : 'Exempt (N)'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.groupHousing ? 'bg-rose-100 text-rose-700 dark:text-rose-300 dark:bg-rose-950/50' : 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/50'}`}>
                        {item.groupHousing ? 'Counted (Y)' : 'Exempt (N)'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.commercialMixed ? 'bg-rose-100 text-rose-700 dark:text-rose-300 dark:bg-rose-950/50' : 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/50'}`}>
                        {item.commercialMixed ? 'Counted (Y)' : 'Exempt (N)'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.office ? 'bg-rose-100 text-rose-700 dark:text-rose-300 dark:bg-rose-950/50' : 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/50'}`}>
                        {item.office ? 'Counted (Y)' : 'Exempt (N)'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.institutional ? 'bg-rose-100 text-rose-700 dark:text-rose-300 dark:bg-rose-950/50' : 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/50'}`}>
                        {item.institutional ? 'Counted (Y)' : 'Exempt (N)'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.industrial ? 'bg-rose-100 text-rose-700 dark:text-rose-300 dark:bg-rose-950/50' : 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/50'}`}>
                        {item.industrial ? 'Counted (Y)' : 'Exempt (N)'}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 italic dark:text-slate-400">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 5: SETBACK TABLES SUMMARY */}
      {subView === 'setback_tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plotted Setbacks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chapter 3.2.4.1: Residential Plotted Setbacks (≤15m Height)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.10]">
                    <th className="p-2.5 font-semibold">Plot Area</th>
                    <th className="p-2.5 font-semibold">Type</th>
                    <th className="p-2.5 font-semibold text-center">Front</th>
                    <th className="p-2.5 font-semibold text-center">Rear</th>
                    <th className="p-2.5 font-semibold text-center">Side-1</th>
                    <th className="p-2.5 font-semibold text-center">Side-2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.10]">
                  {PLOTTED_RESIDENTIAL_SETBACKS.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.06]">
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">{r.plotRange}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{r.type}</td>
                      <td className="p-2.5 text-center font-semibold text-emerald-700 dark:text-emerald-300">{r.front}m</td>
                      <td className="p-2.5 text-center font-semibold text-emerald-700 dark:text-emerald-300">{r.rear}m</td>
                      <td className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">{r.side1}m</td>
                      <td className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">{r.side2}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-600 italic dark:text-slate-400">
              Note: On semi-detached plots, construction on 40% rear setback up to 7m height is permissible unless on stilt.
            </p>
          </div>

          {/* High-Rise Setbacks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 dark:bg-[#161617] dark:border-white/[0.10]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chapter 3.2.4.9: High-Rise Progressive Setbacks (&gt;15m Height)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.10]">
                    <th className="p-2.5 font-semibold">Building Height</th>
                    <th className="p-2.5 font-semibold text-center">Front Setback</th>
                    <th className="p-2.5 font-semibold text-center">Rear Setback</th>
                    <th className="p-2.5 font-semibold text-center">Side-1</th>
                    <th className="p-2.5 font-semibold text-center">Side-2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.10]">
                  {HIGH_RISE_SETBACKS.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.06]">
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">{r.heightRange}</td>
                      <td className="p-2.5 text-center font-semibold text-blue-700 dark:text-blue-300">{r.front}m</td>
                      <td className="p-2.5 text-center font-semibold text-blue-700 dark:text-blue-300">{r.rear}m</td>
                      <td className="p-2.5 text-center font-semibold text-blue-700 dark:text-blue-300">{r.side1}m</td>
                      <td className="p-2.5 text-center font-semibold text-blue-700 dark:text-blue-300">{r.side2}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-600 italic dark:text-slate-400">
              Alternative setback option: Ground floor setback may be 6m (up to 33m ht) or 8m (33-45m ht) with stepped setbacks on subsequent floors.
            </p>
          </div>
        </div>
      )}

      {/* SUBVIEW 6: EV CHARGING INFRASTRUCTURE */}
      {subView === 'evci' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 dark:bg-[#161617] dark:border-white/[0.10]">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chapter 17: Electric Vehicle Charging Infrastructure (EVCI)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-400">
            Prescribes mandatory planning norms for all new urban developments: assumes <strong>20% of total parking capacity</strong> is dedicated for EVs, with an additional power load sanctioned using a <strong>1.25 safety factor</strong> over a 30-year horizon.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.10]">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">4-Wheelers (Cars)</span>
              <p className="text-xs text-slate-600 mt-1 dark:text-slate-400">
                1 Slow Charger for every 3 EVs<br />
                1 Fast Charger for every 10 EVs
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.10]">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">2-Wheelers & 3-Wheelers</span>
              <p className="text-xs text-slate-600 mt-1 dark:text-slate-400">
                1 Slow Charger for every 2 EVs<br />
                Battery Swapping optional in PCS
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.10]">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Buses / Fleet</span>
              <p className="text-xs text-slate-600 mt-1 dark:text-slate-400">
                1 Fast Charger for every 10 EVs<br />
                Liquid cooled cables for FCB batteries
              </p>
            </div>
          </div>

          <h4 className="text-sm font-bold text-slate-800 pt-2 dark:text-slate-100">
            Standard MoP Approved Charger Specifications:
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:border-white/[0.10]">
                  <th className="p-2.5 font-semibold">Speed Category</th>
                  <th className="p-2.5 font-semibold">Charger Type / Name</th>
                  <th className="p-2.5 font-semibold">Power Rating</th>
                  <th className="p-2.5 font-semibold">Voltage (V)</th>
                  <th className="p-2.5 font-semibold">Guns / Connector</th>
                  <th className="p-2.5 font-semibold">Target Segment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.10]">
                {EVCI_CHARGER_SPECS.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.06]">
                    <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">{c.type}</td>
                    <td className="p-2.5 font-bold text-emerald-800 dark:text-emerald-300">{c.name}</td>
                    <td className="p-2.5 text-slate-800 dark:text-slate-100">{c.power}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{c.voltage}</td>
                    <td className="p-2.5 text-slate-800 font-mono dark:text-slate-100">{c.connectorGuns}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">{c.vehicleType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW: RATIONALE & URBAN PHYSICS */}
      {subView === 'rationale' && (
        <StatutoryRationaleGuide />
      )}

      {/* SUBVIEW: AUTHORITY ZONING COMPARISON */}
      {subView === 'authority_comparison' && (
        <AuthorityZoningComparison />
      )}

      {/* Floating Session Sticky Notes Overlay */}
      <StickyNotesOverlay />
    </div>
  );
};
