import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Shown in the fallback so the user knows which panel failed. */
  label?: string;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Keeps one failing panel from blanking the whole portal.
 *
 * Leaflet, Recharts and jsPDF all throw on malformed input; without a boundary a single
 * throw unmounted the entire application and left a white page with no way back.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`[${this.props.label ?? 'panel'}] render failed`, error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-6 text-center"
      >
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
          {this.props.label ?? 'This panel'} could not be displayed
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-rose-700/80 dark:text-rose-300/80">
          The rest of the portal is unaffected — your project data is saved. Try again, or switch to another tab.
        </p>
        <p className="mx-auto mt-3 max-w-md break-words rounded-lg bg-white/60 dark:bg-black/30 px-3 py-2 text-left font-mono text-[10.5px] text-rose-800 dark:text-rose-300">
          {this.state.error.message}
        </p>
        <button
          type="button"
          onClick={this.handleReset}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }
}
