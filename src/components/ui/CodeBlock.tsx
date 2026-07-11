"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = "json" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-surface-deep my-4 font-mono text-[11px] leading-relaxed">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-surface-muted/20 text-subtle text-[10px]">
        <span>{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-surface transition-colors py-1 px-2 rounded hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-electric-blue/60 focus-visible:outline-none"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <pre className="p-4 overflow-x-auto text-surface select-all no-scrollbar">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
