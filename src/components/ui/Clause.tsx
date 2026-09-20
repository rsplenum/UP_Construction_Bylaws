import React from 'react';

/**
 * A citation, styled as evidence rather than as a footnote.
 *
 * The category's weakness is that a generic calculator gets overruled by an architect and
 * loses the reader for good. The answer to that is the clause — but a clause set in grey
 * 11px beside a paragraph reads as small print, which is what people skip. Every citation
 * in the interface goes through this, so they are recognisable as one kind of thing: the
 * receipt for the sentence next to them.
 */
export const Clause: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children, className = '',
}) => (
  <span
    className={`inline-flex items-center rounded border border-slate-300 bg-slate-50 px-1.5 py-px font-mono text-[10.5px] font-medium text-slate-700 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-300 ${className}`}
  >
    {children}
  </span>
);
