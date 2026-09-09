import React, { useMemo } from 'react';

/**
 * A small, dependency-free renderer for the subset of Markdown the model actually emits:
 * headings, bold, italics, inline code, fenced code, bullet and numbered lists, tables
 * and blockquotes.
 *
 * The assistant's replies were previously dropped into a `whitespace-pre-line` div, so
 * every answer showed literal `**asterisks**` and pipe-delimited tables as raw text.
 * Everything here is built from React elements — no HTML string is ever parsed or
 * injected, so model output cannot introduce markup.
 */

type Inline = string | React.ReactElement;

function renderInline(text: string, keyPrefix: string): Inline[] {
  // Order matters: code first so its contents are not re-processed.
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/g;
  const out: Inline[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) out.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;

    if (token.startsWith('`')) {
      out.push(
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-slate-800 dark:bg-white/10 dark:text-slate-200">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**')) {
      out.push(<strong key={key} className="font-semibold">{token.slice(2, -2)}</strong>);
    } else {
      out.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}

function splitTableRow(line: string): string[] {
  return line.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

const isTableDivider = (line: string): boolean => /^\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');

export const Markdown: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  const blocks = useMemo(() => {
    const lines = content.split('\n');
    const nodes: React.ReactElement[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Fenced code
      if (line.trimStart().startsWith('```')) {
        const body: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trimStart().startsWith('```')) body.push(lines[i++]);
        i++;
        nodes.push(
          <pre key={key++} className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100 dark:bg-black/60">
            <code>{body.join('\n')}</code>
          </pre>,
        );
        continue;
      }

      // Table
      if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
        const header = splitTableRow(line);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitTableRow(lines[i++]));

        nodes.push(
          <div key={key++} className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  {header.map((cell, c) => (
                    <th key={c} className="border border-slate-200 bg-slate-50 px-2 py-1.5 text-left font-semibold dark:border-white/10 dark:bg-white/[0.06]">
                      {renderInline(cell, `th${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c} className="border border-slate-200 px-2 py-1.5 align-top dark:border-white/10">
                        {renderInline(cell, `td${r}-${c}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }

      // Heading
      const heading = /^(#{1,4})\s+(.*)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        const size = level <= 2 ? 'text-sm' : 'text-[13px]';
        nodes.push(
          <p key={key++} className={`mt-3 mb-1 font-semibold ${size} text-slate-900 dark:text-white`}>
            {renderInline(heading[2], `h${key}`)}
          </p>,
        );
        i++;
        continue;
      }

      // Blockquote
      if (line.trimStart().startsWith('> ')) {
        const body: string[] = [];
        while (i < lines.length && lines[i].trimStart().startsWith('> ')) body.push(lines[i++].trimStart().slice(2));
        nodes.push(
          <blockquote key={key++} className="my-2 border-l-2 border-emerald-500/50 pl-3 text-slate-600 italic dark:text-slate-400">
            {renderInline(body.join(' '), `q${key}`)}
          </blockquote>,
        );
        continue;
      }

      // Lists
      const bullet = /^\s*[-*+]\s+(.*)$/;
      const numbered = /^\s*\d+[.)]\s+(.*)$/;
      if (bullet.test(line) || numbered.test(line)) {
        const ordered = numbered.test(line);
        const items: string[] = [];
        while (i < lines.length && (bullet.test(lines[i]) || numbered.test(lines[i]))) {
          const m = ordered ? numbered.exec(lines[i]) : bullet.exec(lines[i]);
          items.push(m ? m[1] : lines[i]);
          i++;
        }
        const ListTag = ordered ? 'ol' : 'ul';
        nodes.push(
          <ListTag key={key++} className={`my-1.5 space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-slate-400`}>
            {items.map((item, index) => (
              <li key={index}>{renderInline(item, `li${key}-${index}`)}</li>
            ))}
          </ListTag>,
        );
        continue;
      }

      // Paragraph
      if (line.trim() === '') {
        i++;
        continue;
      }
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^\s*([-*+]|\d+[.)]|#{1,4}\s|>)/.test(lines[i]) && !lines[i].trimStart().startsWith('```')) {
        para.push(lines[i++]);
      }
      nodes.push(
        <p key={key++} className="my-1.5 leading-relaxed">
          {renderInline(para.join(' '), `p${key}`)}
        </p>,
      );
    }

    return nodes;
  }, [content]);

  return <div className={className}>{blocks}</div>;
};
