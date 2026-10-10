import React from 'react';
import { X, AlertOctagon, ShieldAlert, Phone, HeartPulse, Brain, Wind } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-500/40 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Emergency Medical Helplines</h3>
              <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">Pan-India & International Directory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* India 112 Priority Card */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">🇮🇳</span>
                <span className="font-bold text-slate-900 dark:text-rose-200 text-sm">Pan-India Unified Emergency</span>
              </div>
              <a
                href="tel:112"
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-sm flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>112</span>
              </a>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
              Single emergency helpline operational across all 28 states and 8 UTs for immediate Ambulance, Police, and Fire response.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-rose-100 dark:border-slate-800 space-y-0.5">
                <span className="text-slate-500 block text-[10px]">Ambulance Hotline</span>
                <a href="tel:108" className="font-bold text-rose-600 dark:text-rose-400 hover:underline block text-xs">
                  108 / 102 (Free)
                </a>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-rose-100 dark:border-slate-800 space-y-0.5">
                <span className="text-slate-500 block text-[10px]">Tele-MANAS (Mental Health)</span>
                <a href="tel:14416" className="font-bold text-blue-600 dark:text-blue-400 hover:underline block text-xs">
                  14416 (24x7 Toll-Free)
                </a>
              </div>
            </div>
          </div>

          {/* International Helplines */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span>🇺🇸</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">United States</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">Emergency: <b className="text-slate-900 dark:text-white">911</b></p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">Suicide & Crisis: <b className="text-slate-900 dark:text-white">988</b></p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5">
                <span>🇬🇧</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">United Kingdom</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">Emergency: <b className="text-slate-900 dark:text-white">999</b></p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">NHS Non-Emergency: <b className="text-slate-900 dark:text-white">111</b></p>
            </div>
          </div>

          {/* Warning Signs Checklist */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              When to seek instant hospital emergency care:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <HeartPulse className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span>Crushing chest pain</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <Brain className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>FAST stroke signs</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <Wind className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                <span>Severe breathing difficulty</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              This AI assistant is an educational knowledge retrieval system and cannot provide acute emergency interventions.
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-white transition-colors"
          >
            I Understand / Close
          </button>
        </div>
      </div>
    </div>
  );
};
