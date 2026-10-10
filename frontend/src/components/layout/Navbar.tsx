import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Database, AlertTriangle, Sun, Moon, Cpu, Users } from 'lucide-react';
import { api } from '../../services/api';
import { SystemHealth } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onOpenEmergencyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenEmergencyModal }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (e) {
        console.error('Failed to load health status', e);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
      {/* Brand & Multi-Agent Swarm Title */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/25 text-white">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
              AegisHealth Multi-Agent
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 rounded-full">
              6 SME Swarm
            </span>
          </div>
          <p className="hidden xs:block text-[11px] text-slate-500 dark:text-slate-400">
            Clinical SME Deliberation • WHO & MoHFW Verified RAG
          </p>
        </div>
      </div>

      {/* Real-time Status Badges & Theme Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* SME Swarm Nodes Status */}
        <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-slate-500 dark:text-slate-400">SME Nodes:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">6 Online</span>
        </div>

        {/* Chroma Vector Store Status */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="text-slate-500 dark:text-slate-400">RAG Chunks:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {health?.vector_store.total_vectors ?? '...'}
          </span>
        </div>

        {/* Theme Switcher (Light / Dark) */}
        <div
          className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner"
          role="group"
          aria-label="Theme selector"
        >
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              theme === 'light'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Switch to Light Theme"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Switch to Dark Theme"
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dark</span>
          </button>
        </div>

        {/* Safety Engine Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Safety Active</span>
        </div>

        {/* Emergency Escalation Button */}
        <button
          onClick={onOpenEmergencyModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-700/50 text-rose-700 dark:text-rose-300 transition-all text-xs font-semibold shadow-sm"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
          <span className="hidden xs:inline">Emergency</span>
          <span>112 Helplines</span>
        </button>
      </div>
    </header>
  );
};
