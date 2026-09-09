import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' } as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog shell with the behaviour the hand-rolled modals were missing: Escape closes,
 * focus moves into the dialog and is trapped there, focus returns to the trigger on
 * close, background scrolling is locked, and screen readers are told this is a dialog.
 */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, subtitle, icon, children, footer, size = 'md' }) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = `modal-title-${title.replace(/\W+/g, '-').toLowerCase()}`;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown, true);

    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panelRef.current)?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${SIZES[size]} max-h-[88vh] overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-2xl outline-none dark:border-white/[0.12] dark:bg-[#161617]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] p-5 dark:border-white/[0.08]">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white dark:text-slate-400"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(88vh-9rem)] overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="border-t border-black/[0.06] bg-slate-50/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
