'use client';

import React, { useState } from 'react';
import { Search, Loader2, Settings2, Cookie, Globe, X } from 'lucide-react';

interface ProfileFormProps {
  onSubmit: (url: string, options: { cookiesOverride?: string }) => void;
  isLoading: boolean;
  initialUrl?: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  onSubmit,
  isLoading,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cookiesOverride, setCookiesOverride] = useState('');
  const [prevInitialUrl, setPrevInitialUrl] = useState(initialUrl);

  // Sync state if initialUrl changes externally during render
  if (initialUrl !== prevInitialUrl) {
    setPrevInitialUrl(initialUrl);
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }

  const triggerSubmit = () => {
    const target = url.trim();
    if (!target) return;
    onSubmit(target, {
      cookiesOverride: cookiesOverride.trim() || undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSubmit();
  };

  const handleClear = () => {
    setUrl('');
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-2xl space-y-3">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Input Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste LinkedIn profile URL or ID (e.g. https://www.linkedin.com/in/debangic/)..."
              className="w-full pl-11 pr-10 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
              disabled={isLoading}
              required
            />
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={triggerSubmit}
            disabled={isLoading || !url.trim()}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-w-[150px] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scrape Profile</span>
              </>
            )}
          </button>
        </div>

        {/* Options & Settings Toggle Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showAdvanced ? 'Hide HTTP Cookie Settings' : 'Advanced HTTP Options (LinkedIn Session Cookies)'}</span>
          </button>
        </div>

        {/* Advanced HTTP Settings Drawer */}
        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Cookie className="w-4 h-4 text-amber-400" />
              <span>LinkedIn Session Cookies Injection (`Cookie` Header)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              LinkedIn protects private profile endpoints with an auth-wall (HTTP 999). To scrape live private profile details, paste your session cookie (e.g. <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">li_at=AQED...</code>) here or set <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">LINKEDIN_COOKIE_LI_AT</code> & <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">LINKEDIN_COOKIE_JSESSIONID</code> in your <code className="text-indigo-300">.env</code> file.
            </p>
            <textarea
              rows={2}
              value={cookiesOverride}
              onChange={(e) => setCookiesOverride(e.target.value)}
              placeholder="Paste session cookies here (e.g. li_at=AQED...; JSESSIONID=...)"
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}
      </form>
    </div>
  );
};
