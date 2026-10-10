import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  BookOpen,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  Plus,
  CheckCircle2,
  X,
  Search,
  ShieldCheck,
  User
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem, DocumentDetail } from '../types';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docPublisher, setDocPublisher] = useState('');
  const [docSourceUrl, setDocSourceUrl] = useState('');
  const [trustTier, setTrustTier] = useState<'trusted_knowledge' | 'private_upload'>('private_upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const tierParam = filterTier === 'all' ? undefined : filterTier;
      const data = await api.listDocuments(tierParam);
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filterTier]);

  const handleInspectDoc = async (id: string) => {
    try {
      const detail = await api.getDocument(id);
      setSelectedDoc(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document and all its indexed vector chunks?')) return;
    try {
      await api.deleteDocument(id);
      if (selectedDoc?.id === id) setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  const handleReprocess = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.reprocessDocument(id);
      fetchDocuments();
    } catch (err) {
      console.error('Failed to reprocess', err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (docTitle) formData.append('title', docTitle);
    formData.append('trust_tier', trustTier);
    if (docPublisher) formData.append('publisher', docPublisher);
    if (docSourceUrl) formData.append('source_url', docSourceUrl);

    try {
      await api.uploadDocument(formData);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setDocTitle('');
      setDocPublisher('');
      setDocSourceUrl('');
      fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadFile(file);
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      setIsUploadModalOpen(true);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.publisher && d.publisher.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6 relative"
    >
      {/* Drag Over Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-600/20 backdrop-blur-xs border-4 border-dashed border-blue-500 rounded-3xl flex items-center justify-center p-8 pointer-events-none animate-in fade-in">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-blue-400 shadow-2xl text-center space-y-3">
            <Upload className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Drop file to upload & index into library</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">PDF, Word DOCX, TXT, or MD supported</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Healthcare Document Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official public health guidelines (WHO / MoHFW) and your private uploaded medical records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'trusted_knowledge', label: '🏛️ Verified Health Authorities' },
            { id: 'private_upload', label: '📁 Private Uploads' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTier(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filterTier === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/40 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title or publisher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Document Grid & Chunk Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading document repository...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No documents match your filter</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Upload clinical guidelines or private lab reports to begin indexing with vector search.
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              const isTrusted = doc.trust_tier === 'trusted_knowledge';
              return (
                <div
                  key={doc.id}
                  onClick={() => handleInspectDoc(doc.id)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 shadow-sm ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 dark:bg-slate-900 dark:border-blue-500/60 dark:shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-slate-950 border border-blue-100 dark:border-slate-800 text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {doc.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isTrusted
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50'
                                : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/50'
                            }`}
                          >
                            {isTrusted ? 'Verified Source' : 'Private Upload'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {doc.publisher || 'Verified Health Body'} • {doc.original_filename}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleReprocess(doc.id, e)}
                        title="Re-extract and index chunks"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(doc.id, e)}
                        title="Delete document"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <span>Pages: <b className="text-slate-800 dark:text-slate-200 font-semibold">{doc.total_pages}</b></span>
                      <span>Chunks: <b className="text-blue-600 dark:text-blue-400 font-semibold">{doc.total_chunks}</b></span>
                      <span className="uppercase text-[10px] font-mono">{doc.file_type}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="capitalize">{doc.status}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chunk Inspector Panel */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[750px] overflow-y-auto shadow-sm">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Document Structure & Chunks</h3>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">{selectedDoc.chunks.length} Chunks</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Document Title</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.title}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Publisher</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">{selectedDoc.publisher}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Total Pages</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedDoc.total_pages}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Extracted Chunks ({selectedDoc.chunks.length})
                </span>
                <div className="space-y-2">
                  {selectedDoc.chunks.map((chunk) => (
                    <div key={chunk.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400">
                        <span className="font-mono font-semibold">Chunk #{chunk.chunk_index + 1}</span>
                        <span className="text-slate-500 dark:text-slate-400">Page {chunk.page_number || 1}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-[11px]">{chunk.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2.5">
              <Eye className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No document selected</p>
              <p>Click any document card on the left to inspect its indexed text chunks and page metadata.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Healthcare Document</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Index PDF, Word, or text files into vector store</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Document File (.pdf, .docx, .txt, .md)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50 dark:bg-slate-950 transition-all hover:bg-blue-50/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setUploadFile(file);
                        if (!docTitle) setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                  />
                  {uploadFile ? (
                    <div className="flex items-center justify-between text-left">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                            {uploadFile.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        Change
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto" />
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Click or drag file here to upload
                      </p>
                      <p className="text-[11px] text-slate-400">PDF, Word, or Markdown up to 25MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Document Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. WHO Diabetes Diagnostic Protocol 2024"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Trust Category</label>
                  <select
                    value={trustTier}
                    onChange={(e: any) => setTrustTier(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="private_upload">📁 Private Patient Upload</option>
                    <option value="trusted_knowledge">🏛️ Verified Health Authority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Publisher / Source</label>
                  <input
                    type="text"
                    placeholder="e.g. WHO, MoHFW, Hospital"
                    value={docPublisher}
                    onChange={(e) => setDocPublisher(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Source URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://www.who.int/publications/..."
                  value={docSourceUrl}
                  onChange={(e) => setDocSourceUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {uploading ? 'Extracting & Indexing...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
