import {
  DocumentItem, DocumentDetail, TrustedSource, SummarizeResponse,
  SystemStats, SystemHealth, ChatMessage, User
} from '../types';

const API_BASE = '/api/v1';

function readErrorDetail(payload: any, fallback: string): string {
  const detail = payload?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join('; ');
  }
  return fallback;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Failed to login');
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to get current user');
    return res.json();
  },

  // Chat
  async sendChatMessage(payload: {
    query: string;
    conversation_id?: string;
    selected_document_id?: string;
    filter_trust_tier?: string;
    jurisdiction?: string;
  }): Promise<{
    conversation_id: string;
    message_id: string;
    query: string;
    answer: string;
    citations: any[];
    tools_used: any[];
    escalation_category: string;
    escalation_guidance?: string;
    has_insufficient_evidence: boolean;
    limitations?: string;
    follow_up_suggestions: string[];
    created_at: string;
  }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Chat request failed' }));
      throw new Error(readErrorDetail(err, 'Chat request failed'));
    }
    return res.json();
  },

  async listConversations(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/chat/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation detail');
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  // Documents
  async listDocuments(trustTier?: string): Promise<DocumentItem[]> {
    const url = trustTier ? `${API_BASE}/documents?trust_tier=${trustTier}` : `${API_BASE}/documents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentDetail> {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document detail');
    return res.json();
  },

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(readErrorDetail(err, 'Upload failed'));
    }
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async reprocessDocument(id: string): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}/reprocess`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reprocess document');
    return res.json();
  },

  // Summarization
  async summarizeDocument(payload: {
    document_id: string;
    mode: string;
    target_question?: string;
  }): Promise<SummarizeResponse> {
    const res = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Summarization failed' }));
      throw new Error(readErrorDetail(err, 'Summarization failed'));
    }
    return res.json();
  },

  // Sources
  async listSources(): Promise<TrustedSource[]> {
    const res = await fetch(`${API_BASE}/sources`);
    if (!res.ok) throw new Error('Failed to fetch sources');
    return res.json();
  },

  // System
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/system/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/system/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getSafetyPolicy(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/safety-policy`);
    if (!res.ok) throw new Error('Failed to fetch safety policy');
    return res.json();
  },

  // AI X-Ray Vision & Medical Imaging
  async getXRayPresets(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/xray/presets`);
    if (!res.ok) throw new Error('Failed to fetch X-Ray preset cases');
    return res.json();
  },

  async analyzeXRay(formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE}/xray/analyze`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'X-Ray analysis failed' }));
      throw new Error(readErrorDetail(err, 'X-Ray analysis failed'));
    }
    return res.json();
  },

  // Care Concierge, Pharmacy Dispatch & Hospital Admissions (Dr. Aiden Cross)
  async searchPharmacies(payload: {
    location?: string;
    latitude?: number;
    longitude?: number;
    medicine_query?: string;
  }): Promise<import('../types').Pharmacy[]> {
    const res = await fetch(`${API_BASE}/concierge/pharmacies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to search pharmacies' }));
      throw new Error(readErrorDetail(err, 'Failed to search pharmacies'));
    }
    return res.json();
  },

  async orderMedicines(payload: import('../types').MedicineOrderRequest): Promise<import('../types').MedicineOrderResponse> {
    const res = await fetch(`${API_BASE}/concierge/order-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit medicine order' }));
      throw new Error(readErrorDetail(err, 'Failed to submit medicine order'));
    }
    return res.json();
  },

  async searchHospitals(payload: {
    location?: string;
    latitude?: number;
    longitude?: number;
    symptoms?: string;
    emergency_only?: boolean;
  }): Promise<import('../types').Hospital[]> {
    const res = await fetch(`${API_BASE}/concierge/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to find hospitals' }));
      throw new Error(readErrorDetail(err, 'Failed to find hospitals'));
    }
    return res.json();
  },

  async registerPatientAtHospital(payload: import('../types').PatientRegistrationRequest): Promise<import('../types').PatientRegistrationResponse> {
    const res = await fetch(`${API_BASE}/concierge/register-patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to register at hospital' }));
      throw new Error(readErrorDetail(err, 'Failed to register at hospital'));
    }
    return res.json();
  },

  async runAutoPilotConcierge(payload: import('../types').AutoPilotActionRequest): Promise<import('../types').AutoPilotActionResponse> {
    const res = await fetch(`${API_BASE}/concierge/auto-pilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Autonomous AI dispatch failed' }));
      throw new Error(readErrorDetail(err, 'Autonomous AI dispatch failed'));
    }
    return res.json();
  }
};


