import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, RefreshCw, Send, Sparkles, SquareStop, User } from 'lucide-react';
import { Markdown } from './ui/Markdown';
import { useProject } from '../context/ProjectContext';
import { OCCUPANCY_LABELS } from '../domain';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  source?: string;
  isError?: boolean;
}

const HISTORY_KEY = 'up_byelaws_chat_history';
const MAX_PERSISTED = 40;

export const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Welcome to the **Uttar Pradesh Building Construction & Development Byelaws 2025** Regulatory Copilot.\n\nI provide authoritative guidance on statutory planning standards across all 22 Development Authorities—covering permissible FAR, setback geometries, structural safety under NBC 2016, compoundable deviation thresholds, and environmental buffers.\n\nHow can I assist your architectural or development compliance review today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'gemini-3.8-flash',
    },
  ]);
  const { project } = useProject();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // The conversation used to be lost the moment the user switched tabs.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      /* ignore unreadable history */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_PERSISTED)));
    } catch {
      /* quota — the conversation stays in memory */
    }
  }, [messages]);

  // Cancel any in-flight request if the tab is closed mid-answer.
  useEffect(() => () => abortRef.current?.abort(), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    "What are the setbacks for a 250 sqm residential plot?",
    "Explain the formula for Purchasable FAR fee calculation.",
    "Is stilt parking or basement parking counted in FAR?",
    "What are the self-certification rules for plots up to 100 sqm?",
    "What are the mandatory EWS/LIG reservation and shelter fee rules?",
    "When is a Fire Safety Certificate mandatory?",
  ];

  // Give the model the project the rest of the portal is working on, so "my plot"
  // means something concrete instead of the model guessing.
  const projectBrief = useMemo(
    () =>
      [
        'Context — the site the user currently has loaded in this portal:',
        `- Occupancy: ${OCCUPANCY_LABELS[project.occupancy]}`,
        `- Plot area: ${project.plotArea} sqm, frontage ${project.plotFrontage} m`,
        `- Abutting road: ${project.roadWidth} m${project.isCornerPlot ? ' (corner plot)' : ''}`,
        `- Proposed height: ${project.buildingHeight} m, built-up ${project.proposedBuiltUpArea} sqm`,
        `- Setbacks provided: front ${project.frontSetbackProvided} m, rear ${project.rearSetbackProvided} m, sides ${project.side1Provided} / ${project.side2Provided} m`,
        `- Parking: ${project.parkingBaysProvided} ECS; RWH ${project.hasRWH ? 'yes' : 'no'}; solar ${project.hasSolarHeating ? 'yes' : 'no'}; green rating ${project.greenRating}`,
        'Answer with reference to these figures when the question is about "my plot" or "this project".',
      ].join('\n'),
    [project],
  );

  const stopGenerating = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: `${projectBrief}\n\nQuestion: ${query}`,
          conversationHistory: history,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `The service returned ${res.status}.`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply || 'No answer was returned.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: data.source,
        },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'model',
          isError: true,
          text: `${err instanceof Error ? err.message : 'The AI service could not be reached.'}\n\nEvery rule, table and calculation still works offline — try the **Byelaws Code**, **FAR & Fees**, **2D Setbacks** or **Zoning Matrix** tabs.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden dark:bg-[#161617] dark:border-white/[0.10]">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 dark:bg-black">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold">UP Byelaws 2025 AI Consultant</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Grounded in TMPR8 PDF
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Instant answers, clause citations, and compliance guidance
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'welcome',
                role: 'model',
                text: "Chat cleared. Ask any question about the Uttar Pradesh Building Construction and Development Byelaws 2025!",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded dark:text-slate-500 dark:bg-slate-800"
          title="Restart Chat"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Suggested Prompts Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2.5 overflow-x-auto flex space-x-2 scrollbar-none text-xs dark:bg-white/[0.04] dark:border-white/[0.10]">
        <span className="text-slate-500 font-semibold flex items-center gap-1 whitespace-nowrap pl-1 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Suggested:</span>
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(prompt)}
            className="whitespace-nowrap bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 px-3 py-1 rounded-full text-slate-700 transition-colors shadow-2xs dark:bg-[#161617] dark:border-white/[0.10] dark:text-slate-300"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-slate-800 text-white dark:bg-slate-800'
                    : 'bg-emerald-600 text-white shadow'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none dark:bg-black'
                    : m.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-500/30'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none dark:bg-[#161617] dark:text-slate-100 dark:border-white/[0.10]'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-line">{m.text}</div>
                ) : (
                  <Markdown content={m.text} />
                )}
                <div
                  className={`text-[10px] mt-2 flex items-center justify-between ${
                    isUser ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.source && (
                    <span className="text-emerald-600 font-medium">
                      Source: UP Byelaws 2025 ({m.source})
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 p-2 bg-white rounded-lg border w-fit dark:text-slate-400 dark:bg-[#161617]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Consulting Uttar Pradesh Byelaws 2025 text...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200 dark:bg-[#161617] dark:border-white/[0.10]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about UP Byelaws 2025 (e.g., setbacks, purchasable FAR, fire NOC, basements)..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors dark:bg-white/[0.04] dark:border-white/[0.14]"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stopGenerating}
              className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <SquareStop className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Send</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
