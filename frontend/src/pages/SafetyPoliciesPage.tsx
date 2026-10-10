import React from 'react';
import { AlertOctagon, Stethoscope, BookOpen, ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';

export const SafetyPoliciesPage: React.FC = () => {
  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100/90 dark:bg-blue-500/20 text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Clinical Governance Framework</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Clinical Safety & Escalation Framework
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Deterministic 3-tier rule engine protecting patients with automated emergency detection and non-diagnostic boundaries.
        </p>
      </div>

      <div className="space-y-6">
        {/* Category A Card - RED */}
        <div className="p-6 sm:p-7 rounded-3xl bg-rose-50/80 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-500/40 space-y-4 shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex-shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider">
                    Tier 1 Urgent
                  </span>
                  <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">Category A: Potential Medical Emergency</h3>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300 font-medium pt-0.5">
                  Immediate Acute Danger & Severe Symptom Detection
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-bold">
              <Phone className="w-3.5 h-3.5" />
              <span>112 Immediate Trigger</span>
            </div>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            Automatically triggers when user queries mention acute coronary syndrome (crushing chest pain radiating to arm/jaw), 
            stroke signs (FAST: facial droop, arm weakness, slurred speech), severe dyspnea / respiratory arrest, anaphylaxis, acute poison ingestion, 
            or thoughts of self-harm.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-rose-100 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="font-bold text-rose-700 dark:text-rose-400 block text-[11px] uppercase">Safety Engine Action:</span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                Bypasses standard non-urgent reasoning and immediately surfaces emergency guidance to dial <b>112 (India)</b>, <b>911 (US)</b>, or <b>999 (UK)</b>.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-rose-100 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="font-bold text-rose-700 dark:text-rose-400 block text-[11px] uppercase">Clinical Boundary:</span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                Refuses to delay life-saving medical triage by offering speculative diagnostic interpretations.
              </p>
            </div>
          </div>
        </div>

        {/* Category B Card - YELLOW */}
        <div className="p-6 sm:p-7 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-500/40 space-y-4 shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wider">
                    Tier 2 Review
                  </span>
                  <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">Category B: Professional Doctor Review Required</h3>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium pt-0.5">
                  Personalized Diagnosis, Prescription Changes & Dosage Adjustments
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            Triggers when queries ask the assistant to diagnose personal conditions from complex symptoms, change or adjust prescription medications 
            (e.g., insulin doses, blood pressure medications), interpret definitive pathology/biopsy imaging, or manage high-risk pregnancy issues.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-amber-100 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400 block text-[11px] uppercase">Safety Engine Action:</span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                Provides grounded literature context paired with a prominent clinical advisory stating the AI cannot formulate individual treatment regimens.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-amber-100 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400 block text-[11px] uppercase">Recommendation:</span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                Guides the patient to bring their lab report or question to a certified clinic or primary physician.
              </p>
            </div>
          </div>
        </div>

        {/* Category C Card - BLUE */}
        <div className="p-6 sm:p-7 rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-500/40 space-y-4 shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider">
                    Tier 3 Grounded RAG
                  </span>
                  <h3 className="text-base font-bold text-blue-950 dark:text-blue-200">Category C: General Healthcare Knowledge & Guidance</h3>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300 font-medium pt-0.5">
                  Public Health Guidelines, Preventative Lifestyle & Document Summarization
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            Covers verified diagnostic criteria (e.g. WHO diabetes cutoffs), public nutrition recommendations (e.g. DASH sodium limits), 
            anatomy explanations, patient-friendly medical term definitions, and multi-mode summarization of uploaded reports.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-blue-100 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="font-bold text-blue-700 dark:text-blue-400 block text-[11px] uppercase">Safety Engine Action:</span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                Retrieves verified literature passages, attaches exact page citations, and includes standard educational disclaimers.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-blue-100 dark:border-slate-800 text-xs space-y-1 shadow-xs">
              <span className="font-bold text-blue-700 dark:text-blue-400 block text-[11px] uppercase">Evidence Requirement:</span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                If no matching verified passages exist, the assistant explicitly flags insufficient evidence instead of fabricating facts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
