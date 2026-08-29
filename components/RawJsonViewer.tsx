'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Search, Code } from 'lucide-react';

interface RawJsonViewerProps {
  json: unknown;
  metadata?: unknown;
}

export const RawJsonViewer: React.FC<RawJsonViewerProps> = ({ json, metadata }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fullPayload = {
    metadata,
    extractedData: json,
  };

  const jsonString = JSON.stringify(fullPayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter lines if search term is provided
  const lines = jsonString.split('\n');
  const filteredLines = searchTerm.trim()
    ? lines.filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : lines;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/80 border-b border-slate-800">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left group"
        >
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 group-hover:text-indigo-300">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-white">
                Structured Raw JSON Response
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Normalized schema payload containing all extracted fields & HTTP response metadata
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keys/values..."
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
            />
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 transition-all active:scale-95 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-800">
          <pre className="text-slate-300 leading-relaxed">
            {searchTerm.trim() ? (
              filteredLines.map((line, idx) => (
                <div key={idx} className="hover:bg-slate-900/60 px-1 py-0.5 rounded">
                  {highlightSyntax(line)}
                </div>
              ))
            ) : (
              lines.map((line, idx) => (
                <div key={idx} className="hover:bg-slate-900/40 px-1">
                  <span className="inline-block w-8 select-none text-slate-600 text-right pr-3">
                    {idx + 1}
                  </span>
                  {highlightSyntax(line)}
                </div>
              ))
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

// Syntax Highlighting Helper
function highlightSyntax(line: string) {
  // Key regex
  if (line.includes(':')) {
    const parts = line.split(':');
    const key = parts[0];
    const val = parts.slice(1).join(':');

    return (
      <>
        <span className="text-indigo-400">{key}</span>:
        <span className="text-emerald-300">{val}</span>
      </>
    );
  }
  return <span className="text-slate-300">{line}</span>;
}
