import React, { useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  Search,
  ShieldCheck,
  Building,
  Layers,
  ChevronRight,
  Maximize2,
  FileCheck2,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DOCUMENT_METADATA, BYELAW_CHAPTERS } from '../data/byelawsData';

export const OfficialPdfViewer: React.FC = () => {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [filterText, setFilterText] = useState<string>('');

  const pdfUrl = '/UP_Building_Byelaws_2025.pdf';

  const keyChaptersList = [
    { num: 1, title: 'Short Title and Definitions (102 Terms)', pages: 'pp. 7 - 18', tag: 'Statutory Core' },
    { num: 2, title: 'Permission for Land Development & Self-Certification', pages: 'pp. 19 - 36', tag: 'Approvals & NOCs' },
    { num: 3, title: 'Standards for Land Development, Setbacks & FAR', pages: 'pp. 37 - 75', tag: 'Tables 3.2.4 & FAR' },
    { num: 4, title: 'Residential Buildings (Plotted, Group Housing, EWS/LIG)', pages: 'pp. 76 - 83', tag: 'Plotted & Housing' },
    { num: 5, title: 'Commercial Buildings (Bazaar Street, Malls, Hotels)', pages: 'pp. 84 - 93', tag: 'Commercial' },
    { num: 6, title: 'Institutional Buildings & Community Facilities', pages: 'pp. 94 - 100', tag: 'Hospitals & Schools' },
    { num: 7, title: 'Industrial and Agricultural Use Buildings', pages: 'pp. 101 - 103', tag: 'MSME & Flatted' },
    { num: 8, title: 'Mixed-Use and Transit-Oriented Development (TOD)', pages: 'pp. 104 - 107', tag: 'TOD Zones' },
    { num: 9, title: 'Additional Floor Area Ratio (Purchasable & Green FAR)', pages: 'pp. 108 - 112', tag: 'FAR Calculations' },
    { num: 10, title: 'Fire Prevention and Life Safety (Fire Act 2022)', pages: 'pp. 113 - 115', tag: 'Fire Safety' },
    { num: 11, title: 'Structural Safety & SDBR (Earthquake Resistant)', pages: 'pp. 116 - 122', tag: 'Structural Codes' },
    { num: 12, title: 'Provisions for Differently Abled, Elderly & Children', pages: 'pp. 123 - 126', tag: 'Accessibility' },
    { num: 13, title: 'Environmental Sustainability (RWH, Solar & STP)', pages: 'pp. 127 - 133', tag: 'Green Norms' },
    { num: 14, title: 'Qualifications & Competence of Licensed Persons (LTP)', pages: 'pp. 134 - 137', tag: 'Professional Roles' },
    { num: 15, title: 'Zoning Regulations & Matrix of Permissibility', pages: 'pp. 138 - 156', tag: '16 Land Use Zones' },
    { num: 16, title: 'Compounding of Building Construction (Section 32)', pages: 'pp. 157 - 163', tag: 'Compounding Fees' },
    { num: 17, title: 'Provision of Electric Charging Infrastructure (EVCI)', pages: 'pp. 164 - 174', tag: 'EV Charging' },
    { num: 18, title: 'In-Building Solutions for Common Telecom (CTI)', pages: 'pp. 175 - 180', tag: 'Fiber & Telecom' },
  ];

  const filteredChapters = keyChaptersList.filter(
    (c) =>
      c.title.toLowerCase().includes(filterText.toLowerCase()) ||
      c.tag.toLowerCase().includes(filterText.toLowerCase()) ||
      c.num.toString() === filterText.trim()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Card */}
      <div className="apple-card p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Repository Part • Official Gazette
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-mono">
                {DOCUMENT_METADATA.version} • {DOCUMENT_METADATA.date}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                {DOCUMENT_METADATA.totalPages} Pages Document
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              {DOCUMENT_METADATA.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              The official gazetted PDF is integrated directly into this repository as a first-class document.
              Access all 18 chapters, 102 statutory definitions, master plan use zones for all 22 UP Development Authorities,
              and complete schedules for setbacks, FAR, and compounding fees.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4 text-emerald-400" />
                Housing & Urban Planning Dept, UP
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-4 h-4 text-teal-400" />
                18 Chapters + 15 Appendices
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                Available Offline & in Repository
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 flex-shrink-0">
            <a
              href={pdfUrl}
              download="UP_Building_Construction_and_Development_Byelaws_2025.pdf"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF (72 KB)</span>
            </a>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in New Browser Window</span>
            </a>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: PDF Viewer + Chapter Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Chapter Index & Search (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="apple-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Document Index
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                18 Chapters • 15 Appendices
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search chapters or topics..."
                className="w-full h-8 pl-8 pr-3 bg-slate-50 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Chapter List */}
            <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1 text-xs">
              {filteredChapters.map((ch) => (
                <div
                  key={ch.num}
                  onClick={() => setSelectedChapter(ch.num)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedChapter === ch.num
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-[#161617] border-black/[0.04] dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                      Chapter {ch.num}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {ch.pages}
                    </span>
                  </div>
                  <div className="font-medium text-xs text-slate-900 dark:text-white mt-0.5 leading-snug">
                    {ch.title}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400">
                      {ch.tag}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
                      View <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}

              {/* Appendices Summary Card */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-bold text-xs">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Appendices 1 through 15</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Contains all 4 statutory completion certificate forms (Form A, B, C, D),
                  Appendix-12 plinth affidavit, Appendix-14 SDBR earthquake format, and
                  Appendix-15 use-zone mapping across all 22 UP Development Authorities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Embedded PDF Viewer (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="apple-card overflow-hidden flex flex-col h-[760px] border border-black/[0.08] dark:border-white/[0.1]">
            {/* Viewer Header */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#161617] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                  Document Stream: UP_Building_Byelaws_2025.pdf
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <a
                  href={pdfUrl}
                  download="UP_Building_Construction_and_Development_Byelaws_2025.pdf"
                  className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand</span>
                </a>
              </div>
            </div>

            {/* Embedded PDF iframe */}
            <div className="flex-1 bg-slate-200 dark:bg-black/80 relative">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&statusbar=1`}
                title="Uttar Pradesh Building Construction and Development Byelaws 2025"
                className="w-full h-full border-0"
              />
            </div>

            {/* Viewer Footer */}
            <div className="p-2.5 bg-slate-50 dark:bg-[#161617] border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-4">
              <span>Housing & Urban Planning Department • Government of Uttar Pradesh</span>
              <span className="font-mono">Document Hash / Version: TMPR8-2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
