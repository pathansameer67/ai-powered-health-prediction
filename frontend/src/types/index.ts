export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
}

export interface Citation {
  citation_id: string;
  document_id: string;
  document_title: string;
  publisher?: string;
  page_number?: number;
  heading?: string;
  snippet: string;
  source_url?: string;
  publication_date?: string;
  trust_tier: 'trusted_knowledge' | 'private_upload';
  relevance_score?: number;
}

export interface ToolInvocation {
  tool_name: string;
  arguments: Record<string, any>;
  status: string;
  result_summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  tools_used?: ToolInvocation[];
  escalation_category?: 'category_a' | 'category_b' | 'category_c';
  escalation_guidance?: string;
  has_insufficient_evidence?: boolean;
  follow_up_suggestions?: string[];
  created_at: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  trust_tier: 'trusted_knowledge' | 'private_upload';
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  status_message?: string;
  total_pages: number;
  total_chunks: number;
  publisher?: string;
  source_url?: string;
  publication_date?: string;
  version?: string;
  jurisdiction?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  page_number?: number;
  heading?: string;
  content: string;
  token_count?: number;
}

export interface DocumentDetail extends DocumentItem {
  chunks: DocumentChunk[];
}

export interface TrustedSource {
  id: string;
  name: string;
  organization: string;
  website_url?: string;
  description?: string;
  is_approved: boolean;
  category: string;
  jurisdiction: string;
  created_at: string;
}

export interface SummarizeResponse {
  document_id: string;
  document_title: string;
  mode: string;
  summary: string;
  key_points: string[];
  medical_terms_explained: Record<string, string>;
  source_citations: any[];
  clinical_caution: string;
  processing_time_sec: number;
}

export interface SmeAgent {
  id: string;
  name: string;
  roleTitle: string;
  category: 'triage' | 'diagnostic' | 'pharma' | 'research' | 'safety' | 'clarity';
  avatar: string;
  color: string;
  badgeBg: string;
  description: string;
  systemPrompt: string;
  specialties: string[];
  toolsAssigned: string[];
  confidenceScore: number;
  status: 'active' | 'deliberating' | 'standby';
  totalConsultations: number;
}

export interface AgentDeliberationStep {
  agentId: string;
  agentName: string;
  roleTitle: string;
  color: string;
  status: 'analyzing' | 'retrieving' | 'verifying' | 'completed' | 'escalated';
  thought: string;
  timestamp: string;
  evidenceCited?: string[];
  confidence: number;
}

export interface MultiAgentConsensus {
  consensusScore: number;
  deliberationSummary: string;
  keyAgreements: string[];
  differingPerspectives?: string[];
  unifiedRecommendation: string;
  participatingAgents: string[];
  clinicalCaution: string;
  processingTimeSec: number;
}

export interface SystemStats {
  total_documents: number;
  trusted_documents: number;
  private_documents: number;
  total_conversations: number;
  total_messages: number;
  total_vector_chunks: number;
  total_escalations: number;
}

export interface SystemHealth {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  database: string;
  vector_store: {
    status: string;
    total_vectors: number;
    backend: string;
  };
  llm_service: {
    provider: string;
    model: string;
    fallback_model: string;
    api_key_configured: boolean;
  };
  safety_subsystem: {
    status: string;
    jurisdiction: string;
    emergency_number: string;
  };
}

export interface RadiologicAgentOpinion {
  agent_id: string;
  agent_name: string;
  role_title: string;
  avatar: string;
  confidence: number;
  assessment: string;
}

export interface XRayAnalysisResponse {
  scan_id: string;
  body_part: string;
  anatomical_view: string;
  urgency_level: 'normal' | 'low' | 'moderate' | 'urgent' | 'emergency';
  escalation_category: string;
  confidence_score: number;
  consensus_score: number;
  impression: string;
  findings: Record<string, string>;
  detected_abnormalities: string[];
  recommendations: string[];
  warning_signs: string[];
  plain_language_explanation: string;
  medical_terms_explained: Record<string, string>;
  agent_opinions: RadiologicAgentOpinion[];
  image_preview_url?: string;
  created_at: string;
}

export interface XRayPreset {
  id: string;
  title: string;
  body_part: string;
  view: string;
  thumbnail: string;
  clinical_notes: string;
  impression: string;
  urgency: string;
  abnormalities_count: number;
}

export interface MedicineItem {
  id: string;
  name: string;
  generic_name: string;
  dosage: string;
  form: string;
  price_inr: number;
  prescription_required: boolean;
  in_stock: boolean;
  quantity_available: number;
  category: string;
  manufacturer: string;
  indications: string;
  quantity?: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance_km: number;
  rating: number;
  total_reviews: number;
  is_open_24x7: boolean;
  estimated_delivery_mins: number;
  delivery_fee_inr: number;
  phone: string;
  lat: number;
  lng: number;
  available_medicines: MedicineItem[];
}

export interface MedicineOrderRequest {
  pharmacy_id: string;
  patient_name: string;
  patient_phone: string;
  delivery_address: string;
  items: { medicine_id: string; quantity: number }[];
  delivery_mode: 'express_delivery' | 'store_pickup';
  prescription_notes?: string;
  payment_method?: string;
}

export interface MedicineOrderResponse {
  order_id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  pharmacy_phone: string;
  patient_name: string;
  patient_phone: string;
  delivery_address: string;
  delivery_mode: string;
  items: Array<{
    medicine_id: string;
    name: string;
    dosage: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }>;
  subtotal_inr: number;
  delivery_fee_inr: number;
  taxes_inr: number;
  total_amount_inr: number;
  order_status: string;
  estimated_arrival_mins: number;
  tracking_id: string;
  created_at: string;
  agent_note: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  address: string;
  distance_km: number;
  rating: number;
  total_beds: number;
  available_beds: number;
  icu_available: number;
  emergency_wait_time_mins: number;
  specialties: string[];
  trauma_level: string;
  phone: string;
  lat: number;
  lng: number;
  accepting_emergency: boolean;
  match_score: number;
  match_reasons: string[];
}

export interface PatientRegistrationRequest {
  hospital_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  contact_number: string;
  emergency_contact: string;
  symptoms: string;
  chief_complaint?: string;
  medical_history?: string;
  is_emergency?: boolean;
}

export interface PatientRegistrationResponse {
  registration_id: string;
  queue_token: string;
  hospital_id: string;
  hospital_name: string;
  hospital_address: string;
  emergency_hotline: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  triage_priority: string;
  assigned_department: string;
  assigned_room: string;
  estimated_consultation_time: string;
  digital_pass_qr_code: string;
  registration_status: string;
  created_at: string;
  instructions: string[];
  agent_intake_summary: string;
}

export interface AutoPilotDeliberationStep {
  step: number;
  title: string;
  detail: string;
  status: string;
}

export interface AutoPilotActionRequest {
  prompt: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_phone?: string;
  emergency_contact?: string;
  delivery_address?: string;
  latitude?: number;
  longitude?: number;
}

export interface AutoPilotActionResponse {
  action_type: 'medicine_order' | 'hospital_registration' | 'dual_dispatch';
  agent_name: string;
  deliberation_steps: AutoPilotDeliberationStep[];
  intent_summary: string;
  target_facility: string;
  medicine_order?: MedicineOrderResponse;
  hospital_registration?: PatientRegistrationResponse;
  clinical_advisory: string;
  created_at: string;
}


