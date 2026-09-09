import React, { useState, useEffect } from 'react';
import {
  StickyNote,
  Pin,
  Trash2,
  X,
  Plus,
  Palette,
  Check,
  Copy,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Download
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export interface StickyNoteItem {
  id: string;
  selectedText: string;
  note: string;
  color: 'yellow' | 'mint' | 'sky' | 'rose' | 'lavender';
  clauseRef?: string;
  chapterTitle?: string;
  createdAt: string;
}

const STORAGE_KEY = 'byelaws_sticky_notes_v1';

const COLOR_STYLES: Record<StickyNoteItem['color'], { bg: string; border: string; text: string; badge: string; accent: string }> = {
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-950/70',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-950 dark:text-amber-100',
    badge: 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200',
    accent: 'bg-amber-400',
  },
  mint: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/70',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-950 dark:text-emerald-100',
    badge: 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200',
    accent: 'bg-emerald-400',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/70',
    border: 'border-sky-300 dark:border-sky-700',
    text: 'text-sky-950 dark:text-sky-100',
    badge: 'bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200',
    accent: 'bg-sky-400',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/70',
    border: 'border-rose-300 dark:border-rose-700',
    text: 'text-rose-950 dark:text-rose-100',
    badge: 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200',
    accent: 'bg-rose-400',
  },
  lavender: {
    bg: 'bg-purple-50 dark:bg-purple-950/70',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-950 dark:text-purple-100',
    badge: 'bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200',
    accent: 'bg-purple-400',
  },
};

interface StickyNotesOverlayProps {
  activeSectionRef?: string;
  activeChapterTitle?: string;
  onJumpToClause?: (clauseRef: string) => void;
}

export const StickyNotesOverlay: React.FC<StickyNotesOverlayProps> = ({
  activeSectionRef,
  activeChapterTitle,
  onJumpToClause,
}) => {
  const toast = useToast();
  const [notes, setNotes] = useState<StickyNoteItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [activeFilterColor, setActiveFilterColor] = useState<string>('all');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Composition form state
  const [quoteText, setQuoteText] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [clauseRef, setClauseRef] = useState<string>('');
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<StickyNoteItem['color']>('yellow');

  // Floating selection action button state
  const [selectionPopup, setSelectionPopup] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  });

  // Save notes to sessionStorage whenever changed
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('SessionStorage quota exceeded for sticky notes', e);
    }
  }, [notes]);

  // Listen for user text selection inside the navigator container
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const text = selection.toString().trim();
      if (text.length >= 4) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPopup({
          visible: true,
          x: Math.min(window.innerWidth - 180, Math.max(10, rect.left + rect.width / 2 - 80)),
          y: Math.max(10, rect.top - 44),
          text,
        });
      } else {
        setSelectionPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Listen for custom trigger event from clause cards or external buttons
  useEffect(() => {
    const handleCustomTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ quote?: string; clauseRef?: string; chapterTitle?: string }>;
      const detail = customEvent.detail || {};
      setQuoteText(detail.quote || '');
      setClauseRef(detail.clauseRef || activeSectionRef || '');
      setChapterTitle(detail.chapterTitle || activeChapterTitle || '');
      setNoteContent('');
      setSelectedColor('yellow');
      setIsComposing(true);
      setIsOpen(true);
    };

    window.addEventListener('open_byelaws_sticky_note', handleCustomTrigger);
    return () => {
      window.removeEventListener('open_byelaws_sticky_note', handleCustomTrigger);
    };
  }, [activeSectionRef, activeChapterTitle]);

  const handleStartAnnotating = (text?: string) => {
    const quote = text || selectionPopup.text || '';
    setQuoteText(quote);
    setClauseRef(activeSectionRef || '');
    setChapterTitle(activeChapterTitle || '');
    setNoteContent('');
    setSelectedColor('yellow');
    setIsComposing(true);
    setIsOpen(true);
    setSelectionPopup({ visible: false, x: 0, y: 0, text: '' });
  };

  const handleSaveNote = () => {
    if (!noteContent.trim() && !quoteText.trim()) {
      toast.warning('Empty Note', 'Please provide a note text or highlighted quote.');
      return;
    }

    const newNote: StickyNoteItem = {
      id: 'sn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      selectedText: quoteText.trim(),
      note: noteContent.trim(),
      color: selectedColor,
      clauseRef: clauseRef.trim() || undefined,
      chapterTitle: chapterTitle.trim() || undefined,
      createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setNotes((prev) => [newNote, ...prev]);
    setIsComposing(false);
    setQuoteText('');
    setNoteContent('');
    toast.success('Sticky Note Pinned', 'Annotation saved to active session.');
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.info('Note Removed', 'Sticky note removed from session.');
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all session sticky notes?')) {
      setNotes([]);
      sessionStorage.removeItem(STORAGE_KEY);
      toast.info('Notes Cleared', 'All session annotations cleared.');
    }
  };

  const handleCopyNote = (item: StickyNoteItem) => {
    const text = `[UP Byelaws 2025 Sticky Note]\nClause: ${item.clauseRef || 'General'}\nHighlight: "${item.selectedText}"\nObservation: ${item.note}`;
    navigator.clipboard.writeText(text);
    setCopiedNoteId(item.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
    toast.success('Copied', 'Note and quote copied to clipboard.');
  };

  const handleExportNotes = () => {
    if (notes.length === 0) return;
    const markdown = `# Uttar Pradesh Byelaws 2025 - Session Sticky Notes\nGenerated: ${new Date().toLocaleString()}\n\n` +
      notes.map((n, i) => (
        `### Note ${i + 1}: ${n.clauseRef || 'General Annotation'}\n` +
        (n.chapterTitle ? `*${n.chapterTitle}*\n\n` : '') +
        (n.selectedText ? `> "${n.selectedText}"\n\n` : '') +
        `**Note:** ${n.note}\n\n` +
        `*Created at: ${n.createdAt}*\n---\n`
      )).join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UP_Byelaws_2025_Session_Notes_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Notes Exported', 'Downloaded session notes as Markdown file.');
  };

  const filteredNotes = notes.filter((n) => {
    if (activeFilterColor === 'all') return true;
    return n.color === activeFilterColor;
  });

  return (
    <>
      {/* 1. Floating Quick Highlight Pill (Appears over mouse text selection) */}
      {selectionPopup.visible && (
        <div
          style={{
            position: 'fixed',
            left: `${selectionPopup.x}px`,
            top: `${selectionPopup.y}px`,
            zIndex: 9999,
          }}
          className="animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleStartAnnotating(selectionPopup.text);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-full shadow-xl text-xs font-semibold hover:bg-emerald-600 transition-colors border border-slate-700"
          >
            <Pin className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Sticky Note</span>
          </button>
        </div>
      )}

      {/* 2. Floating Launcher Button (Bottom-Right Dock) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <button
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) setIsComposing(false);
          }}
          className="flex items-center space-x-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-full shadow-lg hover:shadow-xl transition-all border-2 border-amber-300 text-xs sm:text-sm group dark:border-amber-500/40"
          title="Toggle session sticky notes overlay"
        >
          <StickyNote className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
          <span>Sticky Notes</span>
          <span className="bg-slate-950 text-amber-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
            {notes.length}
          </span>
        </button>
      </div>

      {/* 3. Sticky Notes Slide-Out Overlay Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/30">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <StickyNote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Session Sticky Notes</span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
                    {notes.length} Active
                  </span>
                </h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">
                  Temporary notes & highlights for current audit session
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsComposing(true)}
                className="p-1.5 rounded-md hover:bg-amber-200/50 text-slate-700 dark:text-slate-300 transition-colors"
                title="Create a new sticky note"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-800 transition-colors dark:text-slate-400"
                title="Close overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Filter Tabs & Actions */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveFilterColor('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeFilterColor === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                All ({notes.length})
              </button>
              {(['yellow', 'mint', 'sky', 'rose', 'lavender'] as const).map((color) => {
                const count = notes.filter((n) => n.color === color).length;
                return (
                  <button
                    key={color}
                    onClick={() => setActiveFilterColor(color)}
                    className={`w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 transition-transform ${
                      COLOR_STYLES[color].accent
                    } ${activeFilterColor === color ? 'scale-125 ring-2 ring-slate-800 dark:ring-white' : 'opacity-80'}`}
                    title={`Filter ${color} notes (${count})`}
                  />
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              {notes.length > 0 && (
                <>
                  <button
                    onClick={handleExportNotes}
                    className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-0.5"
                    title="Export session notes to Markdown"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Delete all notes"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* New Sticky Note Composer Form */}
          {isComposing && (
            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pin New Sticky Note</span>
                </span>
                <button
                  onClick={() => setIsComposing(false)}
                  className="text-slate-600 hover:text-slate-700 text-xs font-medium dark:text-slate-400"
                >
                  Cancel
                </button>
              </div>

              {quoteText && (
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded border border-amber-200 dark:border-amber-800 text-[11px] text-slate-700 dark:text-slate-300 italic">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block not-italic mb-0.5">
                    Highlighted Byelaw Excerpt:
                  </span>
                  "{quoteText}"
                </div>
              )}

              <input
                type="text"
                placeholder="Clause reference (e.g., Section 3.2.2 Telescopic FAR)"
                aria-label="Clause reference for this note"
              value={clauseRef}
                onChange={(e) => setClauseRef(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              <textarea
                placeholder="Write your note, compliance query, or site observation..."
                rows={3}
                aria-label="Note text"
              value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Palette className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  {(['yellow', 'mint', 'sky', 'rose', 'lavender'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-4 h-4 rounded-full ${COLOR_STYLES[color].accent} border border-slate-300 transition-transform ${
                        selectedColor === color ? 'scale-125 ring-2 ring-amber-600' : ''
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleSaveNote}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Pin Note</span>
                </button>
              </div>
            </div>
          )}

          {/* Sticky Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mx-auto text-amber-700 dark:text-amber-300">
                  <StickyNote className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  No Sticky Notes in Session
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                  Select any byelaw text with your cursor to highlight and pin a note, or click below to write a note.
                </p>
                <button
                  onClick={() => setIsComposing(true)}
                  className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Note</span>
                </button>
              </div>
            ) : (
              filteredNotes.map((item) => {
                const style = COLOR_STYLES[item.color] || COLOR_STYLES.yellow;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border ${style.border} ${style.bg} shadow-xs space-y-2 relative transition-all group`}
                  >
                    {/* Pin tab */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <Pin className="w-3 h-3 text-amber-700 flex-shrink-0 dark:text-amber-300" />
                        {item.clauseRef ? (
                          <span
                            onClick={() => onJumpToClause?.(item.clauseRef!)}
                            className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded cursor-pointer hover:underline ${style.badge}`}
                            title="Jump to byelaw clause"
                          >
                            {item.clauseRef}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${style.badge}`}>
                            General Note
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 flex items-center gap-0.5 dark:text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.createdAt}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyNote(item)}
                          className="text-slate-600 hover:text-slate-700 p-0.5 rounded dark:text-slate-400"
                          title="Copy note"
                        >
                          {copiedNoteId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteNote(item.id)}
                          className="text-slate-600 hover:text-rose-600 p-0.5 rounded dark:text-slate-400"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Excerpt if present */}
                    {item.selectedText && (
                      <blockquote className="text-[11px] text-slate-600 dark:text-slate-300 italic border-l-2 border-slate-300 dark:border-slate-700 pl-2 leading-relaxed">
                        "{item.selectedText}"
                      </blockquote>
                    )}

                    {/* Note body */}
                    {item.note && (
                      <p className={`text-xs ${style.text} leading-relaxed font-medium`}>
                        {item.note}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>Tip: Select text with mouse to annotate</span>
            <button
              onClick={() => handleStartAnnotating()}
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
            >
              + Quick Note
            </button>
          </div>
        </div>
      )}
    </>
  );
};
