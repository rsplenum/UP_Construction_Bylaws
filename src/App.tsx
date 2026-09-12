import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ToastProvider } from './context/ToastContext';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { DEFAULT_VIEW, REFERENCE_VIEWS, ViewId, viewFromHash } from './navigation';
import { Workspace } from './workspace/Workspace';
import { Footer } from './components/Footer';

// The workspace ships with the app; reference material loads only when opened.
const MapServerExplorer = lazy(() => import('./components/MapServerExplorer').then((m) => ({ default: m.MapServerExplorer })));
const ByelawsNavigator = lazy(() => import('./components/ByelawsNavigator').then((m) => ({ default: m.ByelawsNavigator })));
const StatutoryRationaleGuide = lazy(() => import('./components/StatutoryRationaleGuide').then((m) => ({ default: m.StatutoryRationaleGuide })));
const FormsAndAppendices = lazy(() => import('./components/FormsAndAppendices').then((m) => ({ default: m.FormsAndAppendices })));
const AiAssistant = lazy(() => import('./components/AiAssistant').then((m) => ({ default: m.AiAssistant })));

const PanelSkeleton: React.FC = () => (
  <div className="space-y-4 p-6" role="status" aria-label="Loading">
    <div className="h-24 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/[0.06]" />
    <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/[0.06]" />
  </div>
);

function AppShell() {
  const [view, setView] = useState<ViewId>(() => viewFromHash(window.location.hash) ?? DEFAULT_VIEW);
  const [searchQuery, setSearchQuery] = useState('');

  const goTo = useCallback((next: ViewId) => {
    setView(next);
    if (viewFromHash(window.location.hash) !== next) window.location.hash = `/${next}`;
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = viewFromHash(window.location.hash);
      if (next) setView(next);
    };
    window.addEventListener('hashchange', onHashChange);
    if (!viewFromHash(window.location.hash)) window.location.replace(`#/${DEFAULT_VIEW}`);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const reference = REFERENCE_VIEWS.find((v) => v.id === view);
    document.title = reference
      ? `${reference.label} · UP Building Byelaws 2025`
      : 'Check compliance · UP Building Byelaws 2025';
  }, [view]);

  // Escape returns to the workspace from any reference view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view !== 'workspace') goTo('workspace');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, goTo]);

  const heading = view === 'workspace'
    ? 'Check a building against the UP Building Byelaws 2025'
    : REFERENCE_VIEWS.find((v) => v.id === view)?.label ?? '';

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfbfd] font-sans text-[#1d1d1f] antialiased selection:bg-emerald-500 selection:text-white dark:bg-black dark:text-[#f5f5f7]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[4000] focus:rounded-full focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <Header
        view={view}
        onNavigate={goTo}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <h1 id="page-heading" className="sr-only">{heading}</h1>
        <ErrorBoundary label={heading}>
          {view === 'workspace' ? (
            <Workspace />
          ) : (
            <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <Suspense fallback={<PanelSkeleton />}>
                {view === 'maps' && <MapServerExplorer />}
                {view === 'navigator' && <ByelawsNavigator searchQuery={searchQuery} />}
                {view === 'rationale' && <StatutoryRationaleGuide />}
                {view === 'forms' && <FormsAndAppendices />}
                {view === 'ask' && <AiAssistant />}
              </Suspense>
            </div>
          )}
        </ErrorBoundary>
      </main>

      {view !== 'workspace' && <Footer />}
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
