import React from 'react';
import { X, ExternalLink, BookOpen, ShieldCheck, User } from 'lucide-react';
import { Citation } from '../../types';

interface CitationModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Evidence Citation Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Verified Medical Passage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">Document</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{citation.document_title}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">Publisher / Source</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{citation.publisher || 'Verified Health Body'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">Page Location</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Page {citation.page_number || 1}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">Trust Level</span>
            <div className="flex items-center space-x-1 font-semibold text-blue-600 dark:text-blue-400">
              {citation.trust_tier === 'trusted_knowledge' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Official Health Authority</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>Private Upload</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Passage Content */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Extracted Text Passage
          </span>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed max-h-48 overflow-y-auto font-sans">
            "{citation.snippet}"
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          {citation.source_url ? (
            <a
              href={citation.source_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Visit Official Document</span>
            </a>
          ) : (
            <span className="text-xs text-slate-500">Local Verified Indexed Document</span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
