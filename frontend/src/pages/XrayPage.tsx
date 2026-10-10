import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Sparkles,
  Upload,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Activity,
  RotateCcw,
  Eye,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  History,
  Trash2,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  X,
  Stethoscope,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { XRayAnalysisResponse, XRayPreset } from '../types';
import { FormattedClinicalContent } from '../components/common/FormattedClinicalContent';

interface SavedXRayRecord {
  id: string;
  timestamp: string;
  title: string;
  bodyPart: string;
  urgency: string;
  result: XRayAnalysisResponse;
}

export const XrayPage: React.FC = () => {
  const [presets, setPresets] = useState<XRayPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-cxr-pneumonia');
  const [bodyPart, setBodyPart] = useState<string>('chest');
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    '46-year-old female presenting with 4-day productive cough with rust-colored sputum, fever (102°F), and right-sided pleuritic chest pain.'
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<XRayAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Image Viewer Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [invertContrast, setInvertContrast] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [showRoiOverlay, setShowRoiOverlay] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState(false);

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [xrayHistory, setXrayHistory] = useState<SavedXRayRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch presets from API
    api.getXRayPresets()
      .then((data) => {
        setPresets(data);
        if (data.length > 0 && !result) {
          // Auto load first preset
          handleLoadPreset(data[0].id, data[0].thumbnail, data[0].clinical_notes, data[0].body_part);
        }
      })
      .catch((err) => {
        console.error('Could not load presets:', err);
      });

    try {
      const saved = JSON.parse(localStorage.getItem('aegis_xray_history') || '[]');
      setXrayHistory(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveXRayRecord = (res: XRayAnalysisResponse, title: string, part: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('aegis_xray_history') || '[]');
      const newEntry: SavedXRayRecord = {
        id: `xray-${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: title,
        bodyPart: part,
        urgency: res.urgency_level,
        result: res
      };
      const filtered = existing.filter((e: any) => e.title !== title);
      const updated = [newEntry, ...filtered].slice(0, 20);
      localStorage.setItem('aegis_xray_history', JSON.stringify(updated));
      setXrayHistory(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteXRayRecord = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = xrayHistory.filter((x) => x.id !== id);
    setXrayHistory(updated);
    localStorage.setItem('aegis_xray_history', JSON.stringify(updated));
  };

  const loadXRayRecord = (record: SavedXRayRecord) => {
    setResult(record.result);
    setBodyPart(record.bodyPart);
    if (record.result.image_preview_url) {
      setPreviewUrl(record.result.image_preview_url);
    }
    setShowHistoryModal(false);
  };

  const handleLoadPreset = async (presetId: string, thumb: string, notes: string, part: string) => {
    setSelectedPresetId(presetId);
    setUploadedFile(null);
    setPreviewUrl(thumb);
    setClinicalNotes(notes);
    setBodyPart(part);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('preset_id', presetId);
      formData.append('clinical_notes', notes);
      formData.append('body_part', part);

      const data = await api.analyzeXRay(formData);
      setResult(data);
      const title = presets.find((p) => p.id === presetId)?.title || 'Preset X-Ray Case';
      saveXRayRecord(data, title, part);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze preset scan');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'dcm'].includes(ext || '')) {
      setError(`Unsupported file format '.${ext}'. Please drop a medical JPG, PNG, WebP, or DICOM image.`);
      return;
    }

    setUploadedFile(file);
    setSelectedPresetId('');
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      } else if (selectedPresetId) {
        formData.append('preset_id', selectedPresetId);
      } else if (previewUrl) {
        formData.append('image_base64', previewUrl);
      }

      formData.append('body_part', bodyPart);
      formData.append('clinical_notes', clinicalNotes);
      formData.append('analysis_mode', 'standard');

      const data = await api.analyzeXRay(formData);
      setResult(data);
      const title = uploadedFile ? uploadedFile.name : `X-Ray (${bodyPart.toUpperCase()})`;
      saveXRayRecord(data, title, bodyPart);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze radiograph');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const text = `AEGISHEALTH AI — RADIOLOGY REPORT\n\nSCAN ID: ${result.scan_id}\nVIEW: ${result.anatomical_view}\nURGENCY: ${result.urgency_level.toUpperCase()}\n\nIMPRESSION:\n${result.impression}\n\nFINDINGS:\n${Object.entries(result.findings).map(([k, v]) => `• ${k}: ${v}`).join('\n')}\n\nRECOMMENDATIONS:\n${result.recommendations.map((r) => `• ${r}`).join('\n')}\n\nPATIENT SUMMARY:\n${result.plain_language_explanation}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bodyParts = [
    { id: 'chest', label: 'Chest (CXR)' },
    { id: 'bone_joint', label: 'Bone / Fracture' },
    { id: 'spine', label: 'Spine / Vertebrae' },
    { id: 'abdomen', label: 'Abdomen (KUB)' },
    { id: 'dental', label: 'Dental / Panorex' },
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6 relative"
    >
      {/* Full Page Drag Over Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-indigo-600/20 backdrop-blur-xs border-4 border-dashed border-indigo-500 rounded-3xl flex items-center justify-center p-8 pointer-events-none animate-in fade-in">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-400 shadow-2xl text-center space-y-3">
            <Scan className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Drop X-Ray Radiograph Here
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              DICOM, PNG, or JPG will be staged for AI Vision Analysis
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 flex items-center space-x-1">
              <Scan className="w-3.5 h-3.5" />
              <span>Multi-Agent Radiology Vision</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Diagnostic Imaging & Triage
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI X-Ray Vision Diagnostic Studio
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Upload or drop any medical X-Ray (Chest, Orthopedic, Spine, Dental) for systematic multi-agent radiographic interpretation, red-flag screening, and plain-language patient explanations.
          </p>
        </div>

        {/* History Action Button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex-shrink-0 cursor-pointer"
        >
          <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Scan History</span>
          {xrayHistory.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
              {xrayHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* Preset Demo Scenarios */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Interactive Demo X-Ray Cases (One-Click Testing)</span>
          </span>
          <span className="text-[11px] text-slate-400">Select any clinical case to load scan & history</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id && !uploadedFile;
            return (
              <div
                key={preset.id}
                onClick={() => handleLoadPreset(preset.id, preset.thumbnail, preset.clinical_notes, preset.body_part)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 group ${
                  isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0 relative">
                  <img
                    src={preset.thumbnail}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {preset.title}
                  </span>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {preset.body_part.toUpperCase()} • {preset.urgency}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Scanner & Right Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (5 cols): Image Viewer & Upload Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            {/* Viewport Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>Radiographic Viewer</span>
              </span>

              {/* Quick Image Adjustment Tools */}
              <div className="flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => setInvertContrast(!invertContrast)}
                  title="Invert Contrast (Bone / Negative Mode)"
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    invertContrast
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Bone Contrast
                </button>
                <button
                  type="button"
                  onClick={() => setShowRoiOverlay(!showRoiOverlay)}
                  title="Toggle ROI Annotation Box"
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    showRoiOverlay
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  ROI
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  title="Zoom In"
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  title="Zoom Out"
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setInvertContrast(false);
                  }}
                  title="Reset View"
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Screen */}
            <div className="relative aspect-4/3 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group shadow-inner">
              {previewUrl ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                  <img
                    src={previewUrl}
                    alt="X-Ray Scan"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      filter: invertContrast ? 'invert(1) contrast(1.4) brightness(0.9)' : 'contrast(1.15)',
                      transition: 'transform 0.15s ease-out, filter 0.2s ease-out'
                    }}
                    className="max-w-full max-h-full object-contain select-none"
                  />

                  {/* Simulated Radiologic ROI Box */}
                  {showRoiOverlay && result && result.detected_abnormalities.length > 0 && (
                    <div className="absolute top-1/4 right-1/4 w-28 h-28 border-2 border-dashed border-red-500 bg-red-500/10 rounded-xl pointer-events-none animate-pulse flex flex-col justify-between p-1.5">
                      <span className="text-[9px] font-mono font-bold bg-red-600 text-white px-1 py-0.5 rounded shadow-xs w-max">
                        ROI-1
                      </span>
                      <span className="text-[8px] font-mono text-red-200 bg-slate-900/80 px-1 py-0.5 rounded truncate">
                        {result.detected_abnormalities[0]}
                      </span>
                    </div>
                  )}

                  {/* Scan Watermark & Specimen Meta */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center space-x-2">
                    <span className="text-emerald-400 font-bold">● LIVE RADIOGRAPH</span>
                    <span>•</span>
                    <span>{bodyPart.toUpperCase()}</span>
                    <span>•</span>
                    <span>Zoom {Math.round(zoomLevel * 100)}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-500">
                  <Scan className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-xs">No X-Ray image selected</p>
                </div>
              )}
            </div>

            {/* Input & Upload Controls */}
            <form onSubmit={handleRunAnalysis} className="space-y-3 pt-1">
              {/* Body Part Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Anatomical Region
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {bodyParts.map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => setBodyPart(bp.id)}
                      className={`py-1.5 px-2 rounded-xl text-center font-bold text-[11px] transition-all ${
                        bodyPart === bp.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Drop Zone Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-950/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {uploadedFile ? uploadedFile.name : 'Upload Your X-Ray File'}
                    </span>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WebP, or DICOM</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                  Browse
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.dcm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {/* Clinical Notes Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Clinical Presentation / Patient History
                </label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter clinical symptoms, mechanism of injury, cough duration, fever, etc."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Scan className="w-4 h-4 animate-spin" />
                    <span>Multi-Agent Radiology Board Deliberating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze X-Ray with AI Multi-Agent Board</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col (7 cols): Findings & Multi-Agent Radiology Report */}
        <div className="lg:col-span-7 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              {/* Report Header Bar */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Radiology Report: {result.scan_id}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                        {result.consensus_score}% Consensus
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Projection: {result.anatomical_view} • Region: {result.body_part.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Status & Copy */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      result.urgency_level === 'urgent' || result.urgency_level === 'emergency'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : result.urgency_level === 'moderate'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    }`}
                  >
                    {result.urgency_level} Priority
                  </span>

                  <button
                    onClick={handleCopyReport}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Copy Report"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Multi-Agent Radiologist Opinions Accordion */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Multi-Agent Specialist Deliberation Board ({result.agent_opinions.length} Agents)</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    ✓ Verified Consensus
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.agent_opinions.map((agent) => (
                    <div
                      key={agent.agent_id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span>{agent.avatar}</span>
                          <span>{agent.agent_name}</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                          {agent.confidence}% Conf
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{agent.role_title}</span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{agent.assessment}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Structured 5-Section Report Content */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
                {/* 1. Executive Impression */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                  <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider block">
                    📋 Executive Diagnostic Impression
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {result.impression}
                  </p>
                </div>

                {/* 2. Key Anatomical Findings */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider block">
                    🔍 Systematic Anatomical Observations
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(result.findings).map(([area, desc]) => (
                      <div
                        key={area}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs space-y-0.5"
                      >
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[11px]">
                          {area}
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Actionable Next Steps & Clinical Correlation */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider block">
                    💡 Actionable Next Steps & Clinical Correlation
                  </span>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="flex items-start space-x-2 text-[11px] text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Critical Red Flags */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚠️ Warning Signs (When to Seek Emergency Care)</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-amber-900 dark:text-amber-200">
                    {result.warning_signs.map((ws, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span>•</span>
                        <span>{ws}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. Plain-Language Explanation */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                    📖 Medical Translation Made Simple for Patients
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.plain_language_explanation}
                  </p>
                </div>

                {/* Medical Glossary Terms */}
                {Object.keys(result.medical_terms_explained).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                      Radiology Glossary
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(result.medical_terms_explained).map(([t, d]) => (
                        <div
                          key={t}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-[11px] space-y-0.5"
                        >
                          <span className="font-bold text-indigo-700 dark:text-indigo-300">{t}</span>
                          <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-snug">{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Scan className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No active X-Ray analysis
              </p>
              <p className="max-w-md mx-auto leading-relaxed">
                Choose one of the demo cases above or upload an X-Ray image on the left, add clinical notes, and click "Analyze X-Ray with AI Multi-Agent Board".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Slide-over Drawer */}
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
                    Scan History
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {xrayHistory.length} saved imaging analyses
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
              {xrayHistory.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Scan className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No past scans saved
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto">
                    Analyze any X-Ray to automatically archive results.
                  </p>
                </div>
              ) : (
                xrayHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadXRayRecord(item)}
                    className="group p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/20 dark:hover:bg-slate-900 transition-all cursor-pointer space-y-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.title}
                      </span>
                      <button
                        onClick={(e) => deleteXRayRecord(e, item.id)}
                        title="Delete scan"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug italic">
                      "{item.result?.impression}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 uppercase">
                          {item.bodyPart}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.urgency}
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
