import React, { useEffect, useState } from 'react';
import { Database, Cpu, ShieldCheck, RefreshCw, CheckCircle2, Server, Activity } from 'lucide-react';
import { api } from '../services/api';
import { SystemHealth } from '../types';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100/90 dark:bg-blue-500/20 text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Infrastructure Health</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            System Diagnostics & Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry for Groq LLM inference, ChromaDB persistent storage, and emergency safety subsystem.
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Health Checks</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Groq Engine */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Groq LLM Engine</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Inference & Function Calling</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Inference Provider</span>
              <span className="font-bold text-slate-900 dark:text-white">{health?.llm_service.provider || 'Groq Cloud API'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Primary Model</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{health?.llm_service.model || 'openai/gpt-oss-120b'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Fallback Fast Model</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{health?.llm_service.fallback_model || 'qwen/qwen3.8-27b'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">API Key Status</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{health?.llm_service.api_key_configured ? 'Configured & Active' : 'Fallback Local Mode'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ChromaDB Vector Store */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">ChromaDB Vector Store</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Dense Semantic Embeddings</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>

          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Storage Backend</span>
              <span className="font-bold text-slate-900 dark:text-white">{health?.vector_store.backend || 'ChromaDB Local'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Total Indexed Chunks</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{health?.vector_store.total_vectors ?? 0} Chunks</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Collection Status</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{health?.vector_store.status || 'Ready'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Retrieval Pipeline</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Dense Embedding + BM25</span>
            </div>
          </div>
        </div>

        {/* Safety Framework */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Safety Engine</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Multi-Tier Clinical Rules</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Active Jurisdiction</span>
              <span className="font-bold text-slate-900 dark:text-white">India (Pan-India 112)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Emergency Number</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">{health?.safety_subsystem.emergency_number || '112'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Safety Audit Logging</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">SQLite Auditing Enabled</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">User Isolation</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Per-User Sandboxed Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
