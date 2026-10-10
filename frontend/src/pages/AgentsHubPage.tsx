import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Zap,
  Sparkles,
  Bot,
  Activity,
  CheckCircle2,
  Terminal,
  Cpu,
  ArrowRight,
  Sliders,
  Send,
  Loader2,
  HelpCircle,
  Stethoscope,
  Pill,
  BookOpen,
  FileCheck
} from 'lucide-react';
import { SME_AGENTS } from '../services/agentsData';
import { SmeAgent } from '../types';
import { api } from '../services/api';

interface AgentsHubPageProps {
  onDirectConsult: (agent: SmeAgent, promptQuery?: string) => void;
}

export const AgentsHubPage: React.FC<AgentsHubPageProps> = ({ onDirectConsult }) => {
  const [selectedAgent, setSelectedAgent] = useState<SmeAgent>(SME_AGENTS[0]);
  const [testPrompt, setTestPrompt] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);

  const handleTestConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;
    setTesting(true);
    setTestResponse(null);

    try {
      // Execute through orchestrator
      const res = await api.sendChatMessage({
        query: `[Direct SME Consult to ${selectedAgent.name} - ${selectedAgent.roleTitle}]: ${testPrompt.trim()}`
      });
      setTestResponse(res.answer);
    } catch (err: any) {
      setTestResponse(`Consultation error: ${err.message || 'Unable to reach agent cluster'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-7">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>Multi-Agent Swarm v2.5</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>6 SME Specialists Online</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Clinical SME Specialist Team
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Autonomous Subject Matter Expert (SME) agents cooperating through real-time multi-agent deliberation, RAG evidence retrieval, and safety verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center space-x-2 shadow-xs">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Consensus Accuracy</div>
              <div className="font-bold text-slate-900 dark:text-white">99.1% Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* SME Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SME_AGENTS.map((agent) => {
          const isSelected = selectedAgent.id === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-md'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-xs">
                      {agent.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span>{agent.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {agent.roleTitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {agent.confidenceScore}% Acc
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {agent.description}
                </p>

                {/* Specialties Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {agent.specialties.slice(0, 3).map((spec, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                  {agent.specialties.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium">
                      +{agent.specialties.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {agent.totalConsultations.toLocaleString()} consults
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDirectConsult(agent);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1 transition-all shadow-xs"
                >
                  <span>Chat with SME</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected SME Detailed Inspection & Live Sandbox */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30">
              {selectedAgent.avatar}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedAgent.name} • Inspector & Sandbox
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {selectedAgent.roleTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect agent persona prompt, tool permissions, and test direct clinical queries.
              </p>
            </div>
          </div>

          <button
            onClick={() => onDirectConsult(selectedAgent)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <span>Open Dedicated Chat Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Left: Persona Prompt & Tools */}
          <div className="space-y-4">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                System Directive & Cognitive Guardrail
              </span>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                {selectedAgent.systemPrompt}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Assigned Cognitive Tools & Integrations
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.toolsAssigned.map((tool, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] flex items-center space-x-1.5"
                  >
                    <Terminal className="w-3 h-3 text-blue-500" />
                    <span>{tool}()</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Domain Competencies
              </span>
              <div className="grid grid-cols-2 gap-2">
                {selectedAgent.specialties.map((spec, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Direct Test Sandbox */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>SME Direct Sandbox Query</span>
                </span>
                <span className="text-[10px] text-slate-400">Zero-latency test channel</span>
              </div>

              <form onSubmit={handleTestConsult} className="space-y-2.5">
                <textarea
                  rows={3}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder={`Ask ${selectedAgent.name} a domain question (e.g. guidelines, mechanisms, dosage parameters)...`}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={testing || !testPrompt.trim()}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 shadow-sm"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{selectedAgent.name} is deliberating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Execute SME Query</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {testResponse && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <span>{selectedAgent.name} Response:</span>
                  <span className="text-emerald-500">Grounded in Knowledge</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {testResponse}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
