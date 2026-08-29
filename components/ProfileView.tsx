'use client';

import React, { useState } from 'react';
import {
  ProfileData,
  ScrapeMetadata,
} from '@/types/profile';
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  MapPin,
  Calendar,
  Check,
  Copy,
  Download,
  AlertTriangle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface ProfileViewProps {
  data: ProfileData;
  metadata: ScrapeMetadata;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ data, metadata }) => {
  const [activeTab, setActiveTab] = useState<'experience' | 'education' | 'skills' | 'media'>('experience');
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name.replace(/\s+/g, '_').toLowerCase()}_profile.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Warning / Status Banner */}
      {metadata.isMock && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-2">
              <span>Demonstration / Auth Wall Fallback Preview</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                HTTP {metadata.statusCode}
              </span>
            </div>
            <p className="leading-relaxed text-slate-300">
              {metadata.warningMessage ||
                'Social platforms restrict unauthenticated direct HTTP profile requests. Set LINKEDIN_COOKIE_JSESSIONID in .env or provide session cookie in settings for live payload access.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Profile Banner & Header Card */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        {/* Cover / Banner background */}
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative">
          {data.profileImageUrls?.banner && (
            <img
              src={data.profileImageUrls.banner}
              alt="Profile Banner"
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-950 p-1 border-2 border-slate-700 shadow-2xl overflow-hidden shrink-0">
                {data.profileImageUrls?.avatar ? (
                  <img
                    src={data.profileImageUrls.avatar}
                    alt={data.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                  {data.name}
                </h2>
                <p className="text-sm font-medium text-indigo-300 max-w-2xl leading-relaxed">
                  {data.headline}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 pt-1">
                  {data.location && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {data.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    {metadata.platform.toUpperCase()} Profile
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-2 sm:pt-0">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* About Section */}
          {data.about && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                About / Summary
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {data.about}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('experience')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'experience'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Experience ({data.experience.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'education'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Education & Certifications ({data.education.length + data.certifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'skills'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Skills & Languages ({data.skills.length + data.languages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'media'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Profile Images</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            {data.experience.length === 0 ? (
              <p className="text-xs text-slate-400 p-6 text-center bg-slate-900 rounded-xl border border-slate-800">
                No experience history found in target payload.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {data.experience.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h4 className="text-sm font-bold text-slate-100">
                          {item.title}
                        </h4>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          {item.dates}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                        <span>{item.company}</span>
                        {item.location && (
                          <span className="text-slate-500 font-normal">
                            • {item.location}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {item.description}
                        </p>
                      )}

                      {item.skillsUsed && item.skillsUsed.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.skillsUsed.map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Education & Certifications Tab */}
        {activeTab === 'education' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Education List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Education</span>
              </h4>
              {data.education.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 bg-slate-900 rounded-xl border border-slate-800">
                  No education records found.
                </p>
              ) : (
                data.education.map((edu) => (
                  <div key={edu.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-sm font-bold text-slate-100">{edu.school}</h5>
                      <span className="text-[11px] text-slate-400 font-medium">{edu.dates}</span>
                    </div>
                    <p className="text-xs text-indigo-300 font-medium">{edu.degree}</p>
                    {edu.fieldOfStudy && (
                      <p className="text-xs text-slate-400">Field: {edu.fieldOfStudy}</p>
                    )}
                    {edu.description && (
                      <p className="text-xs text-slate-300 mt-2">{edu.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Certifications List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Certifications</span>
              </h4>
              {data.certifications.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 bg-slate-900 rounded-xl border border-slate-800">
                  No verified certifications found.
                </p>
              ) : (
                data.certifications.map((cert) => (
                  <div key={cert.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-sm font-bold text-slate-100">{cert.name}</h5>
                      <span className="text-[11px] text-amber-400 font-medium">{cert.issueDate}</span>
                    </div>
                    <p className="text-xs text-slate-400">Issuer: {cert.issuer}</p>
                    {cert.credentialId && (
                      <p className="text-[11px] font-mono text-slate-500">ID: {cert.credentialId}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Skills & Languages Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Skills */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Core Competencies & Skills ({data.skills.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-950/80 text-indigo-200 border border-indigo-500/30 rounded-xl hover:bg-indigo-900/50 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            {data.languages.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Languages</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 text-xs font-medium bg-emerald-950/80 text-emerald-200 border border-emerald-500/30 rounded-xl"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media & Assets Tab */}
        {activeTab === 'media' && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Extracted Image URL Payloads</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.profileImageUrls?.avatar && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Avatar Image</span>
                  <img
                    src={data.profileImageUrls.avatar}
                    alt="Avatar"
                    className="w-24 h-24 object-cover rounded-lg border border-slate-800"
                  />
                  <input
                    type="text"
                    readOnly
                    value={data.profileImageUrls.avatar}
                    className="w-full text-[11px] p-2 bg-slate-900 text-slate-400 rounded border border-slate-800 font-mono"
                  />
                </div>
              )}

              {data.profileImageUrls?.banner && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Banner Cover Image</span>
                  <img
                    src={data.profileImageUrls.banner}
                    alt="Banner"
                    className="w-full h-24 object-cover rounded-lg border border-slate-800"
                  />
                  <input
                    type="text"
                    readOnly
                    value={data.profileImageUrls.banner}
                    className="w-full text-[11px] p-2 bg-slate-900 text-slate-400 rounded border border-slate-800 font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
