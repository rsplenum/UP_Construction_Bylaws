import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { ToastProvider } from './context/ToastContext';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { CommandItem, CommandPalette } from './components/ui/CommandPalette';
import { DEFAULT_TAB, TABS, TabId, tabFromHash } from './navigation';
import { Footer } from './components/Footer';

// Each tab is its own chunk. The portal used to ship Leaflet, Recharts and jsPDF to
// every visitor on first paint whether or not they opened a map, a chart or a report.
const MapServerExplorer = lazy(() => import('./components/MapServerExplorer').then((m) => ({ default: m.MapServerExplorer })));
const ComplianceAuditEngine = lazy(() => import('./components/ComplianceAuditEngine').then((m) => ({ default: m.ComplianceAuditEngine })));
const ByelawsNavigator = lazy(() => import('./components/ByelawsNavigator').then((m) => ({ default: m.ByelawsNavigator })));
const ComplianceCalculators = lazy(() => import('./components/ComplianceCalculators').then((m) => ({ default: m.ComplianceCalculators })));
const SetbackVisualizer = lazy(() => import('./components/SetbackVisualizer').then((m) => ({ default: m.SetbackVisualizer })));
const ZoningMatrixExplorer = lazy(() => import('./components/ZoningMatrixExplorer').then((m) => ({ default: m.ZoningMatrixExplorer })));
const FormsAndAppendices = lazy(() => import('./components/FormsAndAppendices').then((m) => ({ default: m.FormsAndAppendices })));
const AiAssistant = lazy(() => import('./components/AiAssistant').then((m) => ({ default: m.AiAssistant })));
const StatutoryRationaleGuide = lazy(() => import('./components/StatutoryRationaleGuide').then((m) => ({ default: m.StatutoryRationaleGuide })));

const PanelSkeleton: React.FC = () => (
  <div className="space-y-4" role="status" aria-label="Loading panel">
    <div className="h-24 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/[0.06]" />
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/[0.06]" />
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/[0.06] lg:col-span-2" />
    </div>
  </div>
);

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>(() => tabFromHash(window.location.hash) ?? DEFAULT_TAB);
  const [searchQuery, setSearchQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const goToTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    if (tabFromHash(window.location.hash) !== tab) window.location.hash = `/${tab}`;
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Keep the browser's back button and shareable links working.
  useEffect(() => {
    const onHashChange = () => {
      const next = tabFromHash(window.location.hash);
      if (next) setActiveTab(next);
    };
    window.addEventListener('hashchange', onHashChange);
    if (!tabFromHash(window.location.hash)) window.location.replace(`#/${DEFAULT_TAB}`);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const activeTabDefinition = useMemo(() => TABS.find((t) => t.id === activeTab), [activeTab]);

  useEffect(() => {
    document.title = activeTabDefinition
      ? `${activeTabDefinition.label} · UP Building Byelaws 2025`
      : 'UP Building Byelaws 2025';
  }, [activeTabDefinition]);

  // ⌘K / Ctrl-K, advertised in the header since the first release and wired here.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (event.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test((event.target as HTMLElement)?.tagName ?? '')) {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const commands = useMemo<CommandItem[]>(
    () =>
      TABS.map((tab) => ({
        id: `tab-${tab.id}`,
        label: tab.label,
        hint: tab.description,
        group: 'Go to',
        keywords: tab.keywords,
        run: () => goToTab(tab.id),
      })),
    [goToTab],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfbfd] font-sans text-[#1d1d1f] antialiased selection:bg-emerald-500 selection:text-white dark:bg-black dark:text-[#f5f5f7]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[4000] focus:rounded-full focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <Header
        activeTab={activeTab}
        onNavigate={goToTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <main
        id="main-content"
        tabIndex={-1}
        aria-labelledby="page-heading"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
      >
        <h1 id="page-heading" className="sr-only">
          {activeTabDefinition?.label ?? 'UP Building Byelaws 2025'} — UP Building Byelaws 2025 portal
        </h1>

        <ErrorBoundary label={activeTabDefinition?.label}>
          <Suspense fallback={<PanelSkeleton />}>
            {activeTab === 'maps' && <MapServerExplorer />}
            {activeTab === 'audit' && <ComplianceAuditEngine onNavigate={goToTab} />}
            {activeTab === 'navigator' && <ByelawsNavigator searchQuery={searchQuery} />}
            {activeTab === 'calculators' && <ComplianceCalculators />}
            {activeTab === 'visualizer' && <SetbackVisualizer onOpenRationale={() => goToTab('rationale')} />}
            {activeTab === 'rationale' && <StatutoryRationaleGuide />}
            {activeTab === 'zoning' && <ZoningMatrixExplorer />}
            {activeTab === 'forms' && <FormsAndAppendices />}
            {activeTab === 'ai-assistant' && <AiAssistant />}
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={commands} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ProjectProvider>
          <AppShell />
        </ProjectProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
