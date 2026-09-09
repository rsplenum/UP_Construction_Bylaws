import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback(
    (title: string, message?: string) => showToast('success', title, message),
    [showToast]
  );
  const error = useCallback(
    (title: string, message?: string) => showToast('error', title, message, 5000),
    [showToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => showToast('warning', title, message, 4500),
    [showToast]
  );
  const info = useCallback(
    (title: string, message?: string) => showToast('info', title, message),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        warning,
        info,
        dismissToast,
      }}
    >
      {children}

      {/* Floating Notification Toast Stack */}
      <aside aria-label="Notifications" className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 duration-200 flex items-start gap-3 ${
                isSuccess
                  ? 'bg-emerald-950/90 dark:bg-emerald-900/90 border-emerald-500 text-white'
                  : isError
                  ? 'bg-rose-950/95 dark:bg-rose-900/95 border-rose-500 text-white'
                  : isWarning
                  ? 'bg-amber-950/90 dark:bg-amber-900/90 border-amber-500 text-white'
                  : 'bg-slate-900/90 dark:bg-slate-800/90 border-slate-700 text-white'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold tracking-tight">{toast.title}</h5>
                {toast.message && (
                  <p className="text-[11px] text-slate-200/90 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="flex-shrink-0 rounded-md p-1 text-slate-600 transition-colors hover:bg-white/10 hover:text-white dark:text-slate-400"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
