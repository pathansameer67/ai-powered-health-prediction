import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  FileText,
  Building2,
  ShieldAlert,
  Settings,
  Users,
  Layers,
  Cpu,
  Scan,
  Truck
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'chat'
  | 'xray'
  | 'concierge'
  | 'agents'
  | 'consensus'
  | 'documents'
  | 'summarize'
  | 'sources'
  | 'safety'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  documentCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, documentCount = 0 }) => {
  const menuSections = [
    {
      title: 'Multi-Agent Swarm',
      items: [
        { id: 'dashboard' as TabType, label: 'Swarm Overview', icon: LayoutDashboard },
        { id: 'chat' as TabType, label: 'Multi-Agent Chat', icon: MessageSquare, badge: 'Live RAG' },
        { id: 'xray' as TabType, label: 'AI X-Ray Studio', icon: Scan, badge: 'Vision AI' },
        { id: 'concierge' as TabType, label: 'Pharma & Hospital Pass', icon: Truck, badge: 'Agent #7' },
        { id: 'agents' as TabType, label: 'SME Specialists', icon: Users, badge: '7 Agents' },
        { id: 'consensus' as TabType, label: 'Consensus Studio', icon: Layers, badge: 'Panel' },
      ]
    },
    {
      title: 'Clinical Knowledge & Tools',
      items: [
        { id: 'documents' as TabType, label: 'Knowledge Base', icon: BookOpen, count: documentCount },
        { id: 'summarize' as TabType, label: 'Summarizer Studio', icon: FileText, badge: '7 Modes' },
        { id: 'sources' as TabType, label: 'Verified Sources', icon: Building2 },
      ]
    },
    {
      title: 'Safety & Governance',
      items: [
        { id: 'safety' as TabType, label: 'Safety & Guardrails', icon: ShieldAlert },
        { id: 'settings' as TabType, label: 'Engine & Settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col justify-between py-4 px-3.5 transition-colors duration-200 flex-shrink-0">
      <div className="space-y-4 overflow-y-auto">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50 font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Clinical Multi-Agent Notice */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1 shadow-sm mt-3">
        <div className="flex items-center space-x-1.5 text-slate-900 dark:text-slate-200 font-bold text-[11px]">
          <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Multi-Agent RAG v2.5</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          Grounds deliberation in official health guidelines (WHO • MoHFW). Always consult a licensed physician.
        </p>
      </div>
    </aside>
  );
};
