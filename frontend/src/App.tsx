import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { AgentsHubPage } from './pages/AgentsHubPage';
import { ConsensusPage } from './pages/ConsensusPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SummarizePage } from './pages/SummarizePage';
import { XrayPage } from './pages/XrayPage';
import { CareNavigatorPage } from './pages/CareNavigatorPage';
import { SourceRegistryPage } from './pages/SourceRegistryPage';
import { SafetyPoliciesPage } from './pages/SafetyPoliciesPage';
import { SettingsPage } from './pages/SettingsPage';
import { EmergencyModal } from './components/common/EmergencyModal';
import { api } from './services/api';
import { SmeAgent } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [initialChatQuery, setInitialChatQuery] = useState<string | undefined>();
  const [targetAgent, setTargetAgent] = useState<SmeAgent | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    api.listDocuments().then((docs) => setDocCount(docs.length)).catch(console.error);
  }, [activeTab]);

  const handleNavigate = (tab: TabType, query?: string, agent?: SmeAgent) => {
    if (query) {
      setInitialChatQuery(query);
    } else {
      setInitialChatQuery(undefined);
    }
    if (agent) {
      setTargetAgent(agent);
    } else {
      setTargetAgent(null);
    }
    setActiveTab(tab);
  };

  const handleDirectConsult = (agent: SmeAgent, promptQuery?: string) => {
    setTargetAgent(agent);
    if (promptQuery) {
      setInitialChatQuery(promptQuery);
    } else {
      setInitialChatQuery(undefined);
    }
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setInitialChatQuery(undefined);
            setTargetAgent(null);
            setActiveTab(tab);
          }}
          documentCount={docCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100/60 dark:bg-slate-950/40">
          {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {activeTab === 'chat' && (
            <ChatPage
              initialQuery={initialChatQuery}
              targetAgent={targetAgent}
              onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
            />
          )}
          {activeTab === 'xray' && <XrayPage />}
          {activeTab === 'concierge' && <CareNavigatorPage />}
          {activeTab === 'agents' && (
            <AgentsHubPage onDirectConsult={handleDirectConsult} />
          )}
          {activeTab === 'consensus' && <ConsensusPage />}
          {activeTab === 'documents' && <DocumentsPage />}
          {activeTab === 'summarize' && <SummarizePage />}
          {activeTab === 'sources' && <SourceRegistryPage />}
          {activeTab === 'safety' && <SafetyPoliciesPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Emergency Hotline Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </div>
  );
};

export default App;
