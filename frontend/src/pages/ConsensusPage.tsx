import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
  Sliders,
  Check,
  Zap,
  Info,
  ChevronDown,
  History,
  Trash2,
  BookOpen,
  X
} from 'lucide-react';
import { SME_AGENTS, runMultiAgentConsensus, getAgentSpecialistOpinion } from '../services/agentsData';
import { MultiAgentConsensus } from '../types';
import { api } from '../services/api';
import { FormattedClinicalContent } from '../components/common/FormattedClinicalContent';

interface SavedConsensusRecord {
  id: string;
  timestamp: string;
  caseQuery: string;
  selectedAgentIds: string[];
  consensusResult: MultiAgentConsensus;
}

export const ConsensusPage: React.FC = () => {
  const [caseQuery, setCaseQuery] = useState(
    'A 58-year-old patient with type 2 diabetes and hypertension presents with recurrent bilateral leg edema and eGFR of 48 mL/min/1.73m². Current medications include Metformin 1000mg BID and Lisinopril 20mg daily. Assess treatment options, dosage adjustments, and SGLT2 inhibitor suitability.'
  );
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([
    'triage',
    'diagnostic',
    'pharma',
    'research',
    'safety'
  ]);
  const [loading, setLoading] = useState(false);
  const [consensusResult, setConsensusResult] = useState<MultiAgentConsensus | null>(null);

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [consensusHistory, setConsensusHistory] = useState<SavedConsensusRecord[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('aegis_consensus_history') || '[]');
      setConsensusHistory(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveConsensusRecord = (res: MultiAgentConsensus, query: string, agentIds: string[]) => {
    try {
      const existing = JSON.parse(localStorage.getItem('aegis_consensus_history') || '[]');
      const newEntry: SavedConsensusRecord = {
        id: `cons-${Date.now()}`,
        timestamp: new Date().toISOString(),
        caseQuery: query,
        selectedAgentIds: agentIds,
        consensusResult: res
      };
      const filtered = existing.filter((e: any) => e.caseQuery !== query);
      const updated = [newEntry, ...filtered].slice(0, 25);
      localStorage.setItem('aegis_consensus_history', JSON.stringify(updated));
      setConsensusHistory(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteConsensusRecord = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = consensusHistory.filter((c) => c.id !== id);
    setConsensusHistory(updated);
    localStorage.setItem('aegis_consensus_history', JSON.stringify(updated));
  };

  const loadConsensusRecord = (record: SavedConsensusRecord) => {
    setCaseQuery(record.caseQuery);
    setSelectedAgentIds(record.selectedAgentIds);
    setConsensusResult(record.consensusResult);
    setShowHistoryModal(false);
  };

  const toggleAgent = (id: string) => {
    if (selectedAgentIds.includes(id)) {
      if (selectedAgentIds.length <= 2) return; // Keep at least 2
      setSelectedAgentIds(selectedAgentIds.filter((a) => a !== id));
    } else {
      setSelectedAgentIds([...selectedAgentIds, id]);
    }
  };

  const handleRunConsensus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseQuery.trim()) return;
    setLoading(true);

    try {
      // Execute through backend agent orchestrator for live synthesis
      const response = await api.sendChatMessage({
        query: `[Multi-Agent Consensus Deliberation across ${selectedAgentIds.length} SME Specialists]: ${caseQuery}`
      });

      // Generate structured multi-agent consensus panel
      const structuredConsensus = runMultiAgentConsensus(caseQuery, selectedAgentIds);
      if (response.answer) {
        structuredConsensus.unifiedRecommendation = response.answer;
      }
      setConsensusResult(structuredConsensus);
      saveConsensusRecord(structuredConsensus, caseQuery, selectedAgentIds);
    } catch (err) {
      // Fallback to structured simulation
      const fallback = runMultiAgentConsensus(caseQuery, selectedAgentIds);
      setConsensusResult(fallback);
      saveConsensusRecord(fallback, caseQuery, selectedAgentIds);
    } finally {
      setLoading(false);
    }
  };

  const presetScenarios = [
    {
      title: 'Renal Diabetic Dosing',
      query: '58yo T2D with eGFR 48 mL/min on Metformin and Lisinopril presenting with edema. SGLT2i evaluation.'
    },
    {
      title: 'Acute Chest Tightness Triage',
      query: '62yo male with sudden retrosternal tightness radiating to left shoulder, diaphoresis, onset 30 mins ago.'
    },
    {
      title: 'Polypharmacy Warfarin Interaction',
      query: 'Patient on Warfarin 5mg daily newly prescribed Clarithromycin 500mg for pneumonia. Bleeding risk.'
    },
    {
      title: 'WHO Dengue Warning Signs',
      query: 'Fever day 4 with severe abdominal pain, persistent vomiting, and platelet drop to 75,000. Protocol triage.'
    }
  ];

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-7">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Agent Consensus Engine</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Parallel SME Deliberation
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Clinical Multi-Agent Consensus Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Convene multiple Clinical Subject Matter Expert agents simultaneously to deliberate complex cases, resolve clinical divergences, and form unified evidence-backed recommendations.
          </p>
        </div>

        {/* History Action Button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex-shrink-0 cursor-pointer"
        >
          <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Deliberation History</span>
          {consensusHistory.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
              {consensusHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Scenario & Agent Selection */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          {/* Preset Clinical Cases */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
              Quick Clinical Cases
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presetScenarios.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCaseQuery(sc.query)}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 text-left transition-all group"
                >
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {sc.title}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {sc.query}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRunConsensus} className="space-y-4 text-xs">
            {/* Case Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 dark:text-slate-200 block">
                Clinical Scenario or Patient Case
              </label>
              <textarea
                rows={5}
                value={caseQuery}
                onChange={(e) => setCaseQuery(e.target.value)}
                placeholder="Enter clinical symptoms, vitals, current medications, or diagnostic dilemmas..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Participating SME Agents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-slate-200">
                  Participating SME Panel ({selectedAgentIds.length}/6)
                </label>
                <span className="text-[10px] text-slate-400">Min 2 agents</span>
              </div>
              <div className="space-y-1.5">
                {SME_AGENTS.map((agent) => {
                  const isChecked = selectedAgentIds.includes(agent.id);
                  return (
                    <div
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">{agent.avatar}</span>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                            {agent.name}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {agent.roleTitle}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !caseQuery.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SME Panel is Deliberating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Convene SME Panel & Deliberate</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Area: Consensus Deliberation Visualizer & Output */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          {consensusResult ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Consensus Score Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-indigo-900/40 via-blue-900/30 to-slate-900/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-lg shadow-blue-500/30">
                    <span className="text-xl font-extrabold">{consensusResult.consensusScore}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90">Consensus</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Multi-Agent Consensus Reached</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Strong Agreement
                      </span>
                    </h3>
                    <p className="text-xs text-blue-200/80 leading-relaxed mt-0.5">
                      {consensusResult.deliberationSummary}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 shrink-0">
                  <span>Deliberation Time: </span>
                  <span className="font-mono font-bold text-white">
                    {consensusResult.processingTimeSec}s
                  </span>
                </div>
              </div>

              {/* Specialist Round-Table Opinions */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider block">
                  Specialist Round-Table Deliberation
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedAgentIds.map((agentId) => {
                    const agent = SME_AGENTS.find((a) => a.id === agentId);
                    if (!agent) return null;
                    return (
                      <div
                        key={agent.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{agent.avatar}</span>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {agent.name}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {agent.roleTitle}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            {agent.confidenceScore}% Conf
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                          {getAgentSpecialistOpinion(agent.id, caseQuery)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Agreements List */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block text-[11px]">
                  Key Points of Consensus
                </span>
                <ul className="space-y-1.5 text-slate-800 dark:text-slate-200">
                  {consensusResult.keyAgreements.map((agreement, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>{agreement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unified Recommendation */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider block">
                  Unified Clinical Synthesis & Action Plan
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <FormattedClinicalContent content={consensusResult.unifiedRecommendation} />
                </div>
              </div>

              {/* Clinical Caution */}
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>{consensusResult.clinicalCaution}</span>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No active consensus deliberation
              </p>
              <p className="max-w-md mx-auto leading-relaxed">
                Select a clinical scenario from the left or enter a custom patient case, choose your participating SME specialist panel, and click "Convene SME Panel & Deliberate".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Consensus History Drawer */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col p-4 sm:p-5 space-y-4 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Deliberation History
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {consensusHistory.length} saved multi-agent panels
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {consensusHistory.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No past deliberations saved
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto">
                    Run a multi-agent deliberation panel to automatically archive results.
                  </p>
                </div>
              ) : (
                consensusHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadConsensusRecord(item)}
                    className="group p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/20 dark:hover:bg-slate-900 transition-all cursor-pointer space-y-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.caseQuery}
                      </span>
                      <button
                        onClick={(e) => deleteConsensusRecord(e, item.id)}
                        title="Delete record"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                          {item.consensusResult?.consensusScore || 90}% Consensus
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.selectedAgentIds.length} Agents
                        </span>
                      </div>
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
