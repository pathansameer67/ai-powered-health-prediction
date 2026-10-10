import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  Activity,
  ListOrdered,
  ListFilter,
  HelpCircle,
  BookOpen,
  SplitSquareVertical,
  Upload,
  ArrowUpCircle,
  FileCheck,
  Loader2,
  X,
  History,
  Trash2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem, SummarizeResponse } from '../types';

interface SavedSummaryRecord {
  id: string;
  timestamp: string;
  documentTitle: string;
  mode: string;
  result: SummarizeResponse;
}

export const SummarizePage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('detailed');
  const [targetQuestion, setTargetQuestion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<SavedSummaryRecord[]>([]);

  // Upload & Drag State
  const [docSourceType, setDocSourceType] = useState<'upload' | 'library'>('upload');
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }
      return docs;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  useEffect(() => {
    fetchDocs();
    try {
      const saved = JSON.parse(localStorage.getItem('aegis_summary_history') || '[]');
      setSummaryHistory(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveSummaryRecord = (summaryRes: SummarizeResponse, title: string, mode: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('aegis_summary_history') || '[]');
      const newEntry: SavedSummaryRecord = {
        id: `sum-${Date.now()}`,
        timestamp: new Date().toISOString(),
        documentTitle: title,
        mode: mode,
        result: summaryRes
      };
      const filtered = existing.filter((e: any) => e.documentTitle !== title || e.mode !== mode);
      const updated = [newEntry, ...filtered].slice(0, 25);
      localStorage.setItem('aegis_summary_history', JSON.stringify(updated));
      setSummaryHistory(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSummaryRecord = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = summaryHistory.filter((s) => s.id !== id);
    setSummaryHistory(updated);
    localStorage.setItem('aegis_summary_history', JSON.stringify(updated));
  };

  const loadSummaryRecord = (record: SavedSummaryRecord) => {
    setResult(record.result);
    setSelectedMode(record.mode);
    setShowHistoryModal(false);
  };

  const modes = [
    { id: 'quick', label: 'Quick Summary', desc: '3-4 sentence high-level executive takeaway', icon: Zap },
    { id: 'detailed', label: 'Detailed Clinical', desc: 'Comprehensive medical findings, symptoms & evidence', icon: Activity },
    { id: 'section_by_section', label: 'Section Breakdown', desc: 'Deep header-by-header summary with page references', icon: ListOrdered },
    { id: 'key_points', label: 'Key Points & Values', desc: 'Bulleted clinical metrics, diagnostic cutoffs & units', icon: ListFilter },
    { id: 'plain_language', label: 'Plain Language (Patient-Friendly)', desc: 'Translates complex medical jargon into easy-to-understand terms', icon: HelpCircle },
    { id: 'question_focused', label: 'Question-Focused', desc: 'Targeted summary directly answering your specific clinical question', icon: BookOpen },
    { id: 'comparison', label: 'Guideline Synthesis', desc: 'Synthesizes points of clinical consensus and recommendations', icon: SplitSquareVertical },
  ];

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
      setError(`Unsupported file format '.${ext}'. Please drop a PDF, DOCX, TXT, or MD file.`);
      return;
    }
    setDroppedFile(file);
    setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    setError(null);
    setUploadSuccessMsg(null);
  };

  const handleUploadAndSelect = async () => {
    if (!droppedFile) return;
    setUploading(true);
    setError(null);
    setUploadSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', droppedFile);
    if (customTitle.trim()) {
      formData.append('title', customTitle.trim());
    }
    formData.append('trust_tier', 'private_upload');
    formData.append('publisher', 'Summarization Upload');

    try {
      const newDoc = await api.uploadDocument(formData);
      await fetchDocs();
      setSelectedDocId(newDoc.id);
      setUploadSuccessMsg(`✓ "${newDoc.title}" indexed & ready for summarization!`);
      setDroppedFile(null);
      setCustomTitle('');
    } catch (err: any) {
      setError(err.message || 'Failed to upload and index document');
    } finally {
      setUploading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedDocId) {
      setError('Please select or upload a document to summarize.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.summarizeDocument({
        document_id: selectedDocId,
        mode: selectedMode,
        target_question: selectedMode === 'question_focused' ? targetQuestion : undefined
      });
      setResult(data);
      const title = data.document_title || currentSelectedDoc?.title || 'Clinical Document';
      saveSummaryRecord(data, title, selectedMode);
    } catch (e: any) {
      setError(e.message || 'Summarization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const currentSelectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6 relative"
    >
      {/* Full Page Drag Over Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-600/20 backdrop-blur-xs border-4 border-dashed border-blue-500 rounded-3xl flex items-center justify-center p-8 pointer-events-none animate-in fade-in">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-blue-400 shadow-2xl text-center space-y-3">
            <Upload className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Drop Document Here to Summarize
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PDF, Word DOCX, TXT, or MD will be instantly staged
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Clinical Summarization Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag and drop any clinical report or select indexed health guidelines for instant 7-mode synthesis.
          </p>
        </div>

        {/* History Action Button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex-shrink-0 cursor-pointer"
        >
          <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Recent Summaries</span>
          {summaryHistory.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-bold">
              {summaryHistory.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Config Panel */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          {/* Step 1: Document Selection / Drag Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                1. Provide Medical Document
              </label>
              {currentSelectedDoc && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700/50 truncate max-w-[140px]">
                  Active: {currentSelectedDoc.title}
                </span>
              )}
            </div>

            {/* Segmented Option Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDocSourceType('upload')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  docSourceType === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Drag & Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setDocSourceType('library')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  docSourceType === 'library'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>From Library ({documents.length})</span>
              </button>
            </div>

            {/* Drag & Drop Upload Zone */}
            {docSourceType === 'upload' && (
              <div className="space-y-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-slate-900'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                  />

                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                      <ArrowUpCircle className={`w-5 h-5 ${isDragging ? 'animate-bounce' : ''}`} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isDragging ? 'Drop file here immediately' : 'Drag & drop clinical file here'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      or <span className="text-blue-600 dark:text-blue-400 font-semibold underline">browse files</span> (.pdf, .docx, .txt)
                    </p>
                  </div>
                </div>

                {/* Selected File Stage Card */}
                {droppedFile && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-slate-950 border border-blue-200 dark:border-blue-700/50 space-y-2.5 animate-in fade-in">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {droppedFile.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {formatFileSize(droppedFile.size)} • Ready to ingest
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDroppedFile(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Document title (optional)..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    />

                    <button
                      type="button"
                      onClick={handleUploadAndSelect}
                      disabled={uploading}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Extracting & Indexing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload & Set for Summary</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {uploadSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* Library Selector */}
            {docSourceType === 'library' && (
              <div className="space-y-1.5">
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {documents.length === 0 ? (
                    <option value="">No documents indexed yet — upload one above</option>
                  ) : (
                    documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.publisher || d.trust_tier})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Step 2: Mode Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
              2. Choose Summarization Mode
            </label>
            <div className="space-y-2">
              {modes.map((m) => {
                const isSelected = selectedMode === m.id;
                const Icon = m.icon;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-600/20 dark:border-blue-500/50 dark:text-blue-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span>{m.label}</span>
                      </div>
                      {isSelected && <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug pl-5.5">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedMode === 'question_focused' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-700 dark:text-blue-300">Specific Clinical Question</label>
              <input
                type="text"
                value={targetQuestion}
                onChange={(e) => setTargetQuestion(e.target.value)}
                placeholder="e.g. What are the fasting plasma glucose thresholds?"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-blue-300 dark:border-blue-500/40 rounded-2xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleSummarize}
            disabled={loading || !selectedDocId}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Synthesizing Document...' : 'Generate Clinical Summary'}</span>
          </button>

          {/* Quick Bottom Drag Drop Helper */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 text-center text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-1.5"
          >
            <ArrowUpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>Drop new PDF/DOCX here anytime to ingest & summarize</span>
          </div>
        </div>

        {/* Right Summary Output Panel */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          {result ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{result.document_title}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    <span className="capitalize text-blue-600 dark:text-blue-400 font-bold">{result.mode.replace('_', ' ')} Mode</span>
                    <span>• Processed in {result.processing_time_sec}s</span>
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {result.key_points && result.key_points.length > 0 && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/25 space-y-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                    Key Clinical Takeaways
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                    {result.key_points.map((pt, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Structured Summary Output
                </span>
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {result.summary}
                </div>
              </div>

              {result.medical_terms_explained && Object.keys(result.medical_terms_explained).length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Plain-Language Medical Glossary
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(result.medical_terms_explained).map(([term, def]: [string, string]) => (
                      <div key={term} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-blue-700 dark:text-blue-300">{term}</span>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">{def}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{result.clinical_caution}</span>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No summary generated yet</p>
              <p className="max-w-sm mx-auto">
                Drag and drop a medical file on the left or choose from the library, pick your mode, and click Generate Clinical Summary.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Drag Bottom Dropzone Bar */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          setDocSourceType('upload');
          fileInputRef.current?.click();
        }}
        className="cursor-pointer p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50/20 dark:hover:bg-blue-900/20 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Drag & Drop Bottom Zone:
            </span>{' '}
            <span className="text-slate-500 dark:text-slate-400">
              Drop any clinical .PDF, .DOCX, .TXT, or .MD document anywhere on this page to stage for instant summary.
            </span>
          </div>
        </div>
        <button
          type="button"
          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-xs"
        >
          Browse File
        </button>
      </div>

      {/* Summary History Drawer */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col p-4 sm:p-5 space-y-4 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Recent Summaries
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {summaryHistory.length} saved document syntheses
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
              {summaryHistory.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No past summaries saved
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto">
                    Summarize any medical document to automatically archive results.
                  </p>
                </div>
              ) : (
                summaryHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadSummaryRecord(item)}
                    className="group p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/20 dark:hover:bg-slate-900 transition-all cursor-pointer space-y-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.documentTitle}
                      </span>
                      <button
                        onClick={(e) => deleteSummaryRecord(e, item.id)}
                        title="Delete record"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug italic">
                      "{item.result?.summary?.slice(0, 120)}..."
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 capitalize">
                        {item.mode.replace('_', ' ')}
                      </span>
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
