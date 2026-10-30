"use client";

import React from "react";

interface MarkdownMessageProps {
  content: string;
}

// Inline formatting: **bold**, *italic*, `code`
function formatInline(text: string): React.ReactNode[] {
  // Regex matches **bold**, *italic*, or `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      // Auto-tag health badges if exact match
      const lower = inner.toLowerCase();
      if (lower === "normal") {
        return (
          <span key={idx} className="bmi-chip bmi-normal" style={{ fontSize: 10, padding: "1px 6px" }}>
            {inner}
          </span>
        );
      }
      if (lower === "underweight") {
        return (
          <span key={idx} className="bmi-chip bmi-underweight" style={{ fontSize: 10, padding: "1px 6px" }}>
            {inner}
          </span>
        );
      }
      if (lower === "overweight") {
        return (
          <span key={idx} className="bmi-chip bmi-overweight" style={{ fontSize: 10, padding: "1px 6px" }}>
            {inner}
          </span>
        );
      }
      if (lower === "obese") {
        return (
          <span key={idx} className="bmi-chip bmi-obese" style={{ fontSize: 10, padding: "1px 6px" }}>
            {inner}
          </span>
        );
      }
      return <strong key={idx}>{inner}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={idx}
          style={{
            background: "rgba(15, 23, 42, 0.06)",
            padding: "1px 4px",
            borderRadius: 4,
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function parseTable(lines: string[]): React.ReactNode {
  if (lines.length < 1) return null;

  // Split cell values by pipe — handles both | a | b | and | a | b
  const parseRow = (line: string): string[] =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map(cell => cell.trim())
      .filter((_, idx, arr) => !(idx === arr.length - 1 && arr[idx] === ""));

  const isSeparator = (l: string) => /^[\|\s\-:]+$/.test(l.trim());

  // Find header and separator
  const headerCells = parseRow(lines[0]);
  if (headerCells.length === 0) return null;

  // If second line is separator (|---|---|), body starts at 2, else 1
  const startIndex = lines.length > 1 && isSeparator(lines[1]) ? 2 : 1;
  const bodyLines = lines.slice(startIndex).filter(l => !isSeparator(l));
  const bodyRows = bodyLines.map(parseRow).filter(row => row.some(c => c.length > 0));

  return (
    <div className="ai-table-wrap">
      <table className="ai-chat-table">
        <thead>
          <tr>
            {headerCells.map((header, i) => (
              <th key={i}>{formatInline(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{formatInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Detect markdown table (line contains pipe characters — handles both | x | y | and | x | y )
    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <React.Fragment key={`table-${i}`}>
          {parseTable(tableLines)}
        </React.Fragment>
      );
      continue;
    }

    // 2. Heading: ### or ## or #
    if (trimmed.startsWith("### ")) {
      nodes.push(
        <div key={i} style={{ fontSize: 13, fontWeight: 700, margin: "8px 0 4px", color: "var(--ds-text)" }}>
          {formatInline(trimmed.replace(/^###\s+/, ""))}
        </div>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <div key={i} style={{ fontSize: 14, fontWeight: 800, margin: "10px 0 4px", color: "var(--ds-text)" }}>
          {formatInline(trimmed.replace(/^##\s+/, ""))}
        </div>
      );
      i++;
      continue;
    }

    // 3. Bullet points: - or *
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 16, margin: "6px 0", display: "flex", flexDirection: "column", gap: 3 }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 4. Numbered list: 1. 2.
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} style={{ paddingLeft: 18, margin: "6px 0", display: "flex", flexDirection: "column", gap: 3 }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              {formatInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 5. Empty line (spacer)
    if (!trimmed) {
      nodes.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // 6. Regular paragraph
    nodes.push(
      <p key={i} style={{ margin: "3px 0", fontSize: 12.5, lineHeight: 1.55 }}>
        {formatInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="ai-markdown-wrap">{nodes}</div>;
}

