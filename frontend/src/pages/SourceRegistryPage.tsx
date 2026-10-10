import React, { useState, useEffect } from 'react';
import { Building2, ExternalLink, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { TrustedSource } from '../types';

export const SourceRegistryPage: React.FC = () => {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listSources().then(setSources).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100/90 dark:bg-blue-500/20 text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Knowledge Grounding</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Approved Knowledge Source Registry
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Official public health organizations, national ministries, and peer-reviewed clinical repositories authorized for assistant retrieval.
        </p>
      </div>

      {loading && (
        <div className="text-xs text-slate-500 dark:text-slate-400 p-8 text-center">Loading approved source registry...</div>
      )}

      {!loading && sources.length === 0 && (
        <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          No approved sources are registered yet. Restart the backend to auto-seed WHO, MoHFW, and MedlinePlus.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div
            key={src.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all space-y-4 shadow-sm dark:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Authority</span>
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{src.name}</h3>
              <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                <Globe className="w-3 h-3" />
                <span>{src.organization} • {src.jurisdiction}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[48px] font-sans">
              {src.description || 'Apex health authority providing validated public health and diagnostic protocols.'}
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] capitalize">{src.category}</span>
              {src.website_url && (
                <a
                  href={src.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px]"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
