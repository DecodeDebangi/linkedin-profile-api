'use client';

import React, { useState, useRef } from 'react';
import { StatusHeader } from '@/components/StatusHeader';
import { ProfileForm } from '@/components/ProfileForm';
import { ProfileView } from '@/components/ProfileView';
import { RawJsonViewer } from '@/components/RawJsonViewer';
import { ScrapeResponse } from '@/types/profile';
import {
  Loader2,
  AlertCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleExtract = async (
    targetUrl: string,
    options: { cookiesOverride?: string } = {}
  ) => {
    if (!targetUrl || !targetUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setUrl(targetUrl);

    try {
      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (options.cookiesOverride) {
        reqHeaders['Authorization'] = `Bearer ${options.cookiesOverride}`;
      }

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          url: targetUrl,
        }),
      });

      const data: ScrapeResponse = await res.json();

      if (!res.ok && !data.data) {
        setError(data.error || `Server responded with HTTP ${res.status}`);
        setResponse(null);
      } else {
        setResponse(data);
        if (data.error) {
          setError(data.error);
        }

        // Auto scroll to extracted results section
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to communicate with extraction API.';
      setError(message);
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <StatusHeader
        cookiesConfigured={Boolean(response?.metadata?.cookiesConfigured)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Hero Banner Title */}
        <div className="space-y-3 text-center max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next.js App Router Direct Scraper Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Structured Data Profile Extraction Utility
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Direct HTTP server-to-server extraction engine for LinkedIn profile payloads. Extract structured JSON schema containing experience, education, skills, certifications, and languages without headless browsers.
          </p>
        </div>

        {/* Input Form Card */}
        <ProfileForm onSubmit={handleExtract} isLoading={isLoading} initialUrl={url} />

        {/* Loading Progress State */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4 shadow-2xl animate-pulse">
            <div className="inline-flex p-3 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100">Scraping & Mapping Profile Payload</h3>
              <p className="text-xs text-indigo-300 font-mono">Executing server-to-server direct HTTP fetch & DOM parsing...</p>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {error && !isLoading && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300">Extraction Error</span>
              <p className="mt-0.5 text-slate-300">{error}</p>
            </div>
          </div>
        )}

        {/* Extracted Profile Dashboard */}
        {response && response.data && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in duration-300 pt-4">
            {/* Formatted Visual Card View */}
            <ProfileView data={response.data} metadata={response.metadata} />

            {/* Collapsible Raw JSON Viewer */}
            <RawJsonViewer json={response.data} />
          </div>
        )}

        {/* Interactive Documentation Section */}
        <section id="readme-guide" className="pt-8 border-t border-slate-800/80 space-y-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">
              Technical Architecture & Developer Documentation
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                01
              </div>
              <h4 className="font-bold text-sm text-slate-200">Direct HTTP Server Request</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilizes Next.js App Router server endpoints with custom <code className="text-indigo-300">User-Agent</code>, <code className="text-indigo-300">Accept-Language</code>, and <code className="text-indigo-300">Sec-Fetch</code> headers to fetch payloads without heavy browser instances.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                02
              </div>
              <h4 className="font-bold text-sm text-slate-200">Session Cookie Authentication</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Securely injects authenticated cookies (<code className="text-amber-300">LINKEDIN_COOKIE_LI_AT</code> & <code className="text-amber-300">LINKEDIN_COOKIE_JSESSIONID</code>) supplied via environment variables or form options to bypass public auth-walls on protected social platforms.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                03
              </div>
              <h4 className="font-bold text-sm text-slate-200">Multi-Parser JSON Schema</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parses JSON-LD microdata, OpenGraph meta tags, and DOM trees using <code className="text-emerald-300">cheerio</code> to construct a clean, typed JSON object adhering strictly to the profile schema.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Profile Data Extraction Utility • Built with Next.js App Router, TypeScript & Tailwind CSS</p>
      </footer>
    </div>
  );
}
