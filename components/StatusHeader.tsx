'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, FileCode } from 'lucide-react';

interface StatusHeaderProps {
  cookiesConfigured: boolean;
  onOpenSettings?: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  cookiesConfigured,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                ProfileExtract<span className="text-indigo-400">.ai</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                HTTP Engine v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Server-to-Server Direct HTTP Profile Scraping & Data Extraction Utility
            </p>
          </div>
        </div>

        {/* Right Status Actions & Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div
            onClick={onOpenSettings}
            className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-900/80 hover:bg-slate-800/80 transition-all duration-200"
            style={{
              borderColor: cookiesConfigured
                ? 'rgba(34, 197, 94, 0.3)'
                : 'rgba(234, 179, 8, 0.3)',
            }}
          >
            {cookiesConfigured ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 group-hover:text-slate-100">
                  Cookies Active
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 group-hover:text-slate-100">
                  No Auth Cookies (Mock Preview Active)
                </span>
              </>
            )}
          </div>

          <a
            href="#readme-guide"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-all"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="font-medium hidden md:inline">Documentation</span>
          </a>
        </div>
      </div>
    </header>
  );
};
