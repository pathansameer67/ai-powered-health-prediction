import React from 'react';
import { AlertOctagon, PhoneCall, Stethoscope } from 'lucide-react';

interface EscalationBannerProps {
  category: 'category_a' | 'category_b' | 'category_c';
  guidance?: string;
  onOpenEmergencyModal: () => void;
}

export const EscalationBanner: React.FC<EscalationBannerProps> = ({
  category,
  guidance,
  onOpenEmergencyModal,
}) => {
  if (category === 'category_a') {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-500/60 text-rose-950 dark:text-rose-100 space-y-3 glow-rose animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex-shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
              Immediate Emergency Protocol (Category A)
            </h4>
            <p className="text-xs text-rose-800 dark:text-rose-200/90 font-medium leading-snug">
              Potential acute life-threatening medical situation detected. Please seek emergency medical care immediately.
            </p>
          </div>
        </div>

        {guidance && (
          <p className="text-xs bg-white/80 dark:bg-rose-900/40 p-3 rounded-xl border border-rose-200 dark:border-rose-500/30 leading-relaxed font-sans text-rose-900 dark:text-rose-100">
            {guidance}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={onOpenEmergencyModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/30"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Pan-India Emergency (112) / Helplines</span>
          </button>
        </div>
      </div>
    );
  }

  if (category === 'category_b') {
    return (
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 space-y-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
            Clinical Consultation Required (Category B)
          </h4>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed font-sans">
          {guidance ||
            'This query involves clinical diagnosis or medication decisions. Please consult a licensed medical doctor for personal health evaluation.'}
        </p>
      </div>
    );
  }

  return null;
};
