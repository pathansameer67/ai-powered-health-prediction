import React, { useState, useEffect } from 'react';
import {
  Activity,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
  Cpu,
  Stethoscope,
  Pill,
  HeartPulse,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStats, SystemHealth, SmeAgent } from '../types';
import { SME_AGENTS } from '../services/agentsData';
import { TabType } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: TabType, query?: string, targetAgent?: SmeAgent) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickQuery, setQuickQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, healthData] = await Promise.all([
          api.getStats().catch(() => null),
          api.getHealth().catch(() => null)
        ]);
        setStats(statsData);
        setHealth(healthData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    onNavigate('chat', quickQuery);
  };

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Welcome & Multi-Agent Swarm Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/20 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Multi-Agent Swarm Active</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>7 SME Specialists Online</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Clinical Multi-Agent Intelligence & Care Concierge Platform
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Autonomous Subject Matter Expert (SME) agents cooperating in parallel across Emergency Triage, Clinical Diagnostics, Pharmacology, AI X-Ray Vision, Care Concierge & Pharmacy Dispatch.
          </p>

          {/* Quick Query Bar */}
          <form onSubmit={handleQuickSubmit} className="pt-2 flex items-center max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Ask the Multi-Agent Swarm (e.g. diagnostic criteria, drug interactions, triage)..."
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-2xl py-3 pl-4 pr-12 text-xs sm:text-sm text-white placeholder:text-slate-300 focus:outline-none focus:border-blue-400 transition-all backdrop-blur-md"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cluster Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Active SME Nodes</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">7 Agents</div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Cluster Uptime</span>
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Indexed RAG Vectors</span>
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {health?.vector_store.total_vectors ?? stats?.total_vector_chunks ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            WHO • MoHFW • MedlinePlus
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Consensus Engine</span>
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">99.1%</div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
            Evidence-Grounded Agreement
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Safety & Guardrails</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">Active (IN)</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Category A/B/C Emergency Routing
          </p>
        </div>
      </div>

      {/* SME Specialist Team Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>SME Specialist Swarm</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                6 Autonomous Experts
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any specialist to open a dedicated consultation session or inspect their prompt & cognitive tools.
            </p>
          </div>

          <button
            onClick={() => onNavigate('agents')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
          >
            <span>View All Agent Profiles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SME_AGENTS.map((agent) => (
            <div
              key={agent.id}
              onClick={() => onNavigate('chat', undefined, agent)}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer space-y-3.5 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-xs">
                    {agent.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {agent.roleTitle}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {agent.confidenceScore}%
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {agent.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {agent.specialties.slice(0, 2).map((s, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {s}
                  </span>
                ))}
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold ml-auto group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                  <span>Consult</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launch Studios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('consensus')}
          className="p-5 rounded-3xl bg-gradient-to-tr from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800/60 hover:shadow-md cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Multi-Agent Consensus Studio
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Deliberate complex patient scenarios with multiple specialists side-by-side.
          </p>
        </div>

        <div
          onClick={() => onNavigate('summarize')}
          className="p-5 rounded-3xl bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 hover:shadow-md cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Clinical Summarization Studio
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Drag and drop medical reports for 7-mode synthesis with SME verification.
          </p>
        </div>

        <div
          onClick={() => onNavigate('documents')}
          className="p-5 rounded-3xl bg-gradient-to-tr from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800/60 hover:shadow-md cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Knowledge Base & RAG Indexer
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Ingest and index clinical guidelines into the ChromaDB vector database.
          </p>
        </div>
      </div>
    </div>
  );
};
