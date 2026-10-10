import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User as UserIcon,
  BookOpen,
  Wrench,
  Copy,
  Check,
  AlertCircle,
  Filter,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  Terminal,
  Zap,
  Info,
  History,
  Trash2,
  Plus,
  Search,
  MessageSquare,
  Clock,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, Citation, DocumentItem, SmeAgent, AgentDeliberationStep } from '../types';
import { SME_AGENTS, generateAgentDeliberation } from '../services/agentsData';
import { EscalationBanner } from '../components/chat/EscalationBanner';
import { CitationModal } from '../components/chat/CitationModal';
import { FormattedClinicalContent } from '../components/common/FormattedClinicalContent';

interface ChatPageProps {
  initialQuery?: string;
  targetAgent?: SmeAgent | null;
  onOpenEmergencyModal: () => void;
}

interface SavedConversation {
  id: string;
  title: string;
  message_count?: number;
  updated_at: string;
  created_at?: string;
  preview?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  initialQuery,
  targetAgent,
  onOpenEmergencyModal
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [filterTrustTier, setFilterTrustTier] = useState<string>('');
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // History State
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [conversationsList, setConversationsList] = useState<SavedConversation[]>([]);
  const [searchHistory, setSearchHistory] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // Multi-Agent State
  const [activeAgentId, setActiveAgentId] = useState<string>(
    targetAgent ? targetAgent.id : 'all'
  );
  const [expandedDeliberationId, setExpandedDeliberationId] = useState<string | null>(null);
  const [deliberationHistory, setDeliberationHistory] = useState<Record<string, AgentDeliberationStep[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sentInitialQuery = useRef<string | null>(null);

  const fetchConversations = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.listConversations();
      // Merge with local storage if any
      const localSaved = JSON.parse(localStorage.getItem('aegis_chat_history') || '[]');
      const mergedMap = new Map<string, SavedConversation>();
      
      (res || []).forEach((c: any) => {
        mergedMap.set(c.id, {
          id: c.id,
          title: c.title || 'Clinical Consultation',
          message_count: c.message_count || 1,
          updated_at: c.updated_at || c.created_at || new Date().toISOString()
        });
      });

      localSaved.forEach((c: any) => {
        if (!mergedMap.has(c.id)) {
          mergedMap.set(c.id, c);
        }
      });

      const list = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setConversationsList(list);
    } catch (e) {
      console.warn('Could not fetch remote conversations, using local storage:', e);
      const localSaved = JSON.parse(localStorage.getItem('aegis_chat_history') || '[]');
      setConversationsList(localSaved);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (targetAgent) {
      setActiveAgentId(targetAgent.id);
    }
  }, [targetAgent]);

  useEffect(() => {
    api.listDocuments().then(setDocuments).catch(console.error);
    fetchConversations();
  }, []);

  useEffect(() => {
    if (messages.length === 0 && !initialQuery) {
      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content:
            "👋 Welcome to the Multi-Agent Clinical Intelligence Studio.\n\n" +
            "Our autonomous team of 6 Clinical SME Specialists (Emergency Triage, Diagnostics, Pharmacology, Evidence Research, Safety, and Patient Clarity) cooperate in real-time to analyze your cases with verified RAG citations and safety guardrails.\n\n" +
            "You can choose Autonomous Multi-Agent Deliberation or consult a specialized SME directly using the selector above.",
          citations: [],
          tools_used: [],
          escalation_category: 'category_c',
          follow_up_suggestions: [
            "What are the diagnostic thresholds for diabetes according to WHO?",
            "What should I do if my BP reading is 140/90?",
            "I have a fever of 101 F and body chills, what safe steps should I take?"
          ],
          created_at: new Date().toISOString()
        }
      ]);
    }
  }, [initialQuery, messages.length]);

  useEffect(() => {
    if (initialQuery && sentInitialQuery.current !== initialQuery) {
      sentInitialQuery.current = initialQuery;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const currentSmeAgent = SME_AGENTS.find((a) => a.id === activeAgentId);

  const saveLocalHistoryRecord = (convId: string, firstQuery: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('aegis_chat_history') || '[]');
      const filtered = existing.filter((c: any) => c.id !== convId);
      const newRecord: SavedConversation = {
        id: convId,
        title: firstQuery.length > 45 ? firstQuery.slice(0, 45) + '...' : firstQuery,
        preview: firstQuery,
        message_count: 2,
        updated_at: new Date().toISOString()
      };
      const updated = [newRecord, ...filtered].slice(0, 30);
      localStorage.setItem('aegis_chat_history', JSON.stringify(updated));
      setConversationsList(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      const formattedQuery =
        activeAgentId === 'all'
          ? q
          : `[Targeted SME Consultation with ${currentSmeAgent?.name} (${currentSmeAgent?.roleTitle})]: ${q}`;

      const response = await api.sendChatMessage({
        query: formattedQuery,
        conversation_id: conversationId,
        selected_document_id: selectedDocId || undefined,
        filter_trust_tier: filterTrustTier || undefined,
        jurisdiction: 'IN'
      });

      setConversationId(response.conversation_id);
      saveLocalHistoryRecord(response.conversation_id, q);

      // Generate deliberation steps trace
      const steps = generateAgentDeliberation(q, response.tools_used);
      setDeliberationHistory((prev) => ({
        ...prev,
        [response.message_id]: steps
      }));
      setExpandedDeliberationId(response.message_id);

      const assistantMessage: ChatMessage = {
        id: response.message_id,
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        tools_used: response.tools_used,
        escalation_category: response.escalation_category as any,
        escalation_guidance: response.escalation_guidance,
        has_insufficient_evidence: response.has_insufficient_evidence,
        follow_up_suggestions: response.follow_up_suggestions,
        created_at: response.created_at
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error processing request: ${err.message || 'Unable to connect to multi-agent cluster.'}`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      setLoading(true);
      setShowHistoryDrawer(false);
      setConversationId(convId);

      const convDetail = await api.getConversation(convId);
      if (convDetail && convDetail.messages && convDetail.messages.length > 0) {
        const mappedMessages: ChatMessage[] = convDetail.messages.map((m: any) => ({
          id: m.id || `msg-${Math.random()}`,
          role: m.role,
          content: m.content,
          citations: m.citations || [],
          tools_used: m.tools_used || [],
          escalation_category: m.escalation_category,
          escalation_guidance: m.escalation_guidance,
          has_insufficient_evidence: m.has_insufficient_evidence,
          created_at: m.created_at || new Date().toISOString()
        }));
        setMessages(mappedMessages);

        // Reconstruct deliberation for last assistant message if any
        const lastAssistant = [...mappedMessages].reverse().find((m) => m.role === 'assistant');
        if (lastAssistant) {
          const steps = generateAgentDeliberation(convDetail.title || 'Consultation', lastAssistant.tools_used);
          setDeliberationHistory({ [lastAssistant.id]: steps });
        }
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId).catch(() => {});
    } catch (err) {
      // Ignore API delete error for local fallback
    }

    const updated = conversationsList.filter((c) => c.id !== convId);
    setConversationsList(updated);
    localStorage.setItem('aegis_chat_history', JSON.stringify(updated));

    if (conversationId === convId) {
      handleResetChat();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setInputQuery('');
    setDeliberationHistory({});
  };

  const filteredHistory = conversationsList.filter((c) =>
    (c.title || '').toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] max-w-5xl mx-auto px-4 py-3 sm:py-4 space-y-3 relative">
      {/* Top Multi-Agent Orchestration & Scope Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm transition-colors">
        {/* Left: SME Selector & History Toggle */}
        <div className="flex items-center space-x-2">
          {/* History Button */}
          <button
            onClick={() => setShowHistoryDrawer(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
            title="View Past Saved Conversations"
          >
            <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>History</span>
            {conversationsList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-bold">
                {conversationsList.length}
              </span>
            )}
          </button>

          <button
            onClick={handleResetChat}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold transition-all border border-blue-200 dark:border-blue-800/60"
            title="Start a Fresh Chat Session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* SME Selector */}
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 hidden sm:block" />
            <select
              value={activeAgentId}
              onChange={(e) => setActiveAgentId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-blue-500 cursor-pointer max-w-[210px] sm:max-w-xs truncate"
            >
              <option value="all">⚡ Autonomous Swarm (All 6 SME Agents)</option>
              {SME_AGENTS.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.avatar} {agent.name} — {agent.roleTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scope Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={filterTrustTier}
            onChange={(e) => setFilterTrustTier(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="">All Tiers</option>
            <option value="trusted_knowledge">🏛️ Verified Guidelines</option>
            <option value="private_upload">📁 Patient Uploads</option>
          </select>

          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none max-w-[120px] sm:max-w-[150px] truncate cursor-pointer"
          >
            <option value="">All Documents</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const steps = deliberationHistory[msg.id];
          const isDeliberationOpen = expandedDeliberationId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center flex-shrink-0 shadow-md text-white mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm transition-all ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-md dark:shadow-xl'
                }`}
              >
                {/* Multi-Agent Deliberation Trace Bar */}
                {!isUser && steps && steps.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 space-y-2.5">
                    <div
                      onClick={() =>
                        setExpandedDeliberationId(isDeliberationOpen ? null : msg.id)
                      }
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                          <Cpu className="w-3.5 h-3.5 text-blue-500" />
                          <span>Multi-Agent Deliberation Trace ({steps.length} SME Specialists)</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                        <span>{isDeliberationOpen ? 'Hide Trace' : 'View Trace'}</span>
                        {isDeliberationOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>

                    {/* Step Cards when expanded */}
                    {isDeliberationOpen && (
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                        {steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>{step.agentName}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({step.roleTitle})
                                </span>
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                                {step.confidence}% Conf
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                              {step.thought}
                            </p>
                            {step.evidenceCited && step.evidenceCited.length > 0 && (
                              <div className="flex items-center space-x-1 text-[10px] text-slate-400 pt-0.5">
                                <BookOpen className="w-3 h-3 text-purple-400" />
                                <span>Cited: {step.evidenceCited.join(' • ')}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Escalation Warning */}
                {!isUser && msg.escalation_category && (
                  <EscalationBanner
                    category={msg.escalation_category}
                    guidance={msg.escalation_guidance}
                    onOpenEmergencyModal={onOpenEmergencyModal}
                  />
                )}

                {/* Insufficient Evidence Warning */}
                {!isUser && msg.has_insufficient_evidence && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>No approved literature was found for this specific query in the library.</span>
                  </div>
                )}

                {/* Main Message Content */}
                {isUser ? (
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>
                ) : (
                  <FormattedClinicalContent content={msg.content} />
                )}

                {/* Citations Grid */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Verified Evidence Passages ({msg.citations.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((c) => (
                        <div
                          key={c.citation_id}
                          onClick={() => setActiveCitation(c)}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-900 transition-all cursor-pointer space-y-1 group shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              [{c.citation_id}] {c.document_title}
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                              P.{c.page_number || 1}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                            "{c.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tools Executed Trace */}
                {!isUser && msg.tools_used && msg.tools_used.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                    {msg.tools_used.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center space-x-1"
                        title={t.result_summary}
                      >
                        <Wrench className="w-2.5 h-2.5 text-blue-500" />
                        <span>{t.tool_name}()</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Follow-up Suggestions */}
                {!isUser && msg.follow_up_suggestions && msg.follow_up_suggestions.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      Suggested Next Inquiries
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.follow_up_suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(sug)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition-all text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy & Timestamp Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="flex items-center space-x-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3 text-xs text-slate-500 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Cpu className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                SME Specialist Agents Deliberating...
              </div>
              <div className="text-[10px] text-slate-400">
                Retrieving vector knowledge & verifying safety guardrails
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={
            activeAgentId === 'all'
              ? 'Ask the Multi-Agent Clinical Swarm a medical question...'
              : `Consult ${currentSmeAgent?.name} directly (${currentSmeAgent?.roleTitle})...`
          }
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl py-3.5 pl-4 pr-12 text-xs sm:text-sm text-slate-900 dark:text-white shadow-lg focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="absolute right-2 top-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 shadow-md shadow-blue-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Citation Modal */}
      {activeCitation && (
        <CitationModal citation={activeCitation} onClose={() => setActiveCitation(null)} />
      )}

      {/* Slide-over Conversation History Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col p-4 sm:p-5 space-y-4 animate-in slide-in-from-right duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Consultation History
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {conversationsList.length} saved sessions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Action */}
            <button
              onClick={() => {
                handleResetChat();
                setShowHistoryDrawer(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Consultation</span>
            </button>

            {/* Search History */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                placeholder="Search past consultations..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {searchHistory ? 'No matching conversations' : 'No past conversations yet'}
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                    Ask a medical question to save your consultation history automatically.
                  </p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const isActive = conversationId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => loadConversation(item.id)}
                      className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                        isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700/60 shadow-xs'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {item.title}
                        </span>
                        <button
                          onClick={(e) => handleDeleteConversation(e, item.id)}
                          title="Delete session"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(item.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
