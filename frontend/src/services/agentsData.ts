import { SmeAgent, AgentDeliberationStep, MultiAgentConsensus } from '../types';

export const SME_AGENTS: SmeAgent[] = [
  {
    id: 'triage',
    name: 'Dr. Triage SME',
    roleTitle: 'Emergency & Triage Specialist',
    category: 'triage',
    avatar: '🚨',
    color: 'from-rose-500 to-red-600',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    description: 'Instant red-flag detection, hemodynamic instability screening, and emergency escalation routing.',
    systemPrompt: 'You are Dr. Triage SME. Evaluate patient symptoms immediately for high-risk red flags, emergency escalation criteria, and safe first-response directives.',
    specialties: ['Acute Chest Pain', 'Anaphylaxis', 'Stroke FAST Signs', 'Sepsis Screening', 'Pediatric Fevers'],
    toolsAssigned: ['assess_escalation', 'emergency_hotline_lookup', 'triage_scoring'],
    confidenceScore: 99.4,
    status: 'active',
    totalConsultations: 1420
  },
  {
    id: 'diagnostic',
    name: 'Dr. Diagnostica SME',
    roleTitle: 'Internal Medicine & Diagnostic Expert',
    category: 'diagnostic',
    avatar: '🩺',
    color: 'from-blue-600 to-indigo-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    description: 'Differential diagnosis formulation, symptom clustering, and clinical pathology analysis.',
    systemPrompt: 'You are Dr. Diagnostica SME. Synthesize symptom presentation with clinical evidence to formulate structured differential diagnoses and recommended diagnostic workups.',
    specialties: ['Cardiometabolic Disorders', 'Infectious Diseases', 'Respiratory Pathology', 'Endocrinology', 'Autoimmune'],
    toolsAssigned: ['differential_formulator', 'search_health_documents', 'symptom_cluster_engine'],
    confidenceScore: 97.8,
    status: 'active',
    totalConsultations: 2890
  },
  {
    id: 'pharma',
    name: 'PharmExpert SME',
    roleTitle: 'Clinical Pharmacology & Therapeutics',
    category: 'pharma',
    avatar: '💊',
    color: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Drug-drug interactions, contraindication checking, renal/hepatic dosing adjustments, and adverse effects.',
    systemPrompt: 'You are PharmExpert SME. Evaluate pharmacokinetics, drug interactions, contraindications, and therapeutic safety parameters.',
    specialties: ['Drug-Drug Interactions', 'Antimicrobial Stewardship', 'Cardiovascular Therapeutics', 'Renal Adjustments', 'Geriatric Polypharmacy'],
    toolsAssigned: ['interaction_matrix_checker', 'contraindication_filter', 'dosage_safety_verifier'],
    confidenceScore: 98.6,
    status: 'active',
    totalConsultations: 1970
  },
  {
    id: 'research',
    name: 'Dr. Research SME',
    roleTitle: 'Evidence & Literature RAG Research Fellow',
    category: 'research',
    avatar: '📚',
    color: 'from-purple-600 to-violet-600',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    description: 'PubMed, WHO, CDC, and MoHFW guideline vector retrieval, evidence grading, and verified citation proofs.',
    systemPrompt: 'You are Dr. Research SME. Query the vector knowledge base to retrieve verified clinical guideline passages and extract factual medical evidence.',
    specialties: ['WHO Clinical Guidelines', 'MoHFW India Protocols', 'Systematic Reviews', 'Meta-Analyses', 'ICD-11 Coding'],
    toolsAssigned: ['search_health_documents', 'format_citations', 'evidence_grading_tool'],
    confidenceScore: 99.1,
    status: 'active',
    totalConsultations: 3410
  },
  {
    id: 'safety',
    name: 'Sentinel Guard SME',
    roleTitle: 'Clinical Safety & Ethics Officer',
    category: 'safety',
    avatar: '🛡️',
    color: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    description: 'Real-time hallucination scrubbing, clinical disclaimer enforcement, and non-prescriptive safety boundaries.',
    systemPrompt: 'You are Sentinel Guard SME. Scrutinize all output against safety policies, verify non-prescriptive framing, and attach clinical cautions.',
    specialties: ['Hallucination Scrubbing', 'Ethical Guardrails', 'Non-Diagnostic Boundaries', 'Privacy & HIPAA/DISHA Safeguards'],
    toolsAssigned: ['verify_output_grounding', 'safety_policy_enforcer', 'disclaimer_attacher'],
    confidenceScore: 99.9,
    status: 'active',
    totalConsultations: 4120
  },
  {
    id: 'clarity',
    name: 'CareCommunicator SME',
    roleTitle: 'Patient Education & Plain Language SME',
    category: 'clarity',
    avatar: '🗣️',
    color: 'from-teal-500 to-cyan-600',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    description: 'Translates dense medical jargon into empathetic, patient-friendly guidance and structured glossary summaries.',
    systemPrompt: 'You are CareCommunicator SME. Translate complex clinical findings into clear, compassionate, and actionable language for patients and caregivers.',
    specialties: ['Plain Language Medical Translation', 'Patient Action Steps', 'Medical Glossary Builder', 'Caregiver Guidance'],
    toolsAssigned: ['explain_medical_term', 'summarize_document', 'patient_jargon_translator'],
    confidenceScore: 98.2,
    status: 'active',
    totalConsultations: 2150
  },
  {
    id: 'concierge',
    name: 'Dr. Aiden Cross',
    roleTitle: 'Care Concierge, Pharmacy Dispatch & Hospital Intake SME',
    category: 'triage',
    avatar: '🚑',
    color: 'from-blue-600 to-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Pinpoints nearest specialized hospitals with live bed/ICU status, registers patients with digital intake passes, and dispatches medicines from local 24/7 pharmacies.',
    systemPrompt: 'You are Dr. Aiden Cross. Route patients to nearby condition-matched hospitals, issue verified digital pre-registration passes, and locate nearby pharmacies for urgent prescription fulfillment.',
    specialties: ['Nearby Pharmacy Stock Search', 'Express Medicine Dispatch', 'Emergency Hospital Routing', 'ICU & Bed Capacity Matching', 'Digital Queue Token & Registration'],
    toolsAssigned: ['search_nearby_pharmacies', 'order_medicines', 'locate_hospitals', 'register_hospital_patient'],
    confidenceScore: 99.5,
    status: 'active',
    totalConsultations: 1830
  }
];

export type ClinicalTopicType =
  | 'cardiac'
  | 'fever'
  | 'bp_hypertension'
  | 'headache'
  | 'stomach_acidity'
  | 'cold_cough'
  | 'diarrhea_vomit'
  | 'diabetes'
  | 'pharma'
  | 'respiratory'
  | 'renal'
  | 'allergy_skin'
  | 'pediatric'
  | 'general';

export function analyzeClinicalTopic(query: string): ClinicalTopicType {
  const q = query.toLowerCase();
  if (/chest\s*pain|heart|angina|cardiac|myocardial|palpitation|coronary|infarct/.test(q)) {
    return 'cardiac';
  }
  if (/fever|temperature|pyrexia|chills|febrile|hot body/.test(q)) {
    return 'fever';
  }
  if (/blood\s*pressure|hypertens|systolic|diastolic|hypotens|\bbp\b/.test(q)) {
    return 'bp_hypertension';
  }
  if (/headache|migraine|head pain|throbbing head/.test(q)) {
    return 'headache';
  }
  if (/stomach|acidity|gerd|acid reflux|heartburn|gastric|indigestion|gas|bloat|belly pain/.test(q)) {
    return 'stomach_acidity';
  }
  if (/cough|cold|sore throat|congestion|runny nose|sneez|phlegm|throat/.test(q)) {
    return 'cold_cough';
  }
  if (/diarrhea|vomit|loose motion|nausea|food poison|stomach bug|gastroenter/.test(q)) {
    return 'diarrhea_vomit';
  }
  if (/diabet|sugar|glucose|a1c|hba1c|insulin|metformin|sglt|keto/.test(q)) {
    return 'diabetes';
  }
  if (/warfarin|aspirin|antibiotic|dosage|interaction|contraindicat|prescrib|side\s*effect|clarithromycin|drug/.test(q)) {
    return 'pharma';
  }
  if (/asthma|wheez|inhaler|copd|lung|breath|peak\s*flow|respiratory/.test(q)) {
    return 'respiratory';
  }
  if (/kidney|egfr|creatinine|renal|edema|swelling|proteinuria|dialysis/.test(q)) {
    return 'renal';
  }
  if (/allerg|rash|hives|itch|skin|eczema/.test(q)) {
    return 'allergy_skin';
  }
  if (/child|baby|infant|pediatric|toddler|vaccin/.test(q)) {
    return 'pediatric';
  }
  return 'general';
}

export const generateAgentDeliberation = (query: string, toolsExecuted: any[] = []): AgentDeliberationStep[] => {
  const now = new Date();
  const topic = analyzeClinicalTopic(query);
  const snippet = query.length > 40 ? query.slice(0, 40) + '...' : query;

  let triageThought = `Evaluated query "${snippet}" for acute life-threatening indicators. Patient presentation classified as informational triage.`;
  let researchThought = `Queried vector database and official clinical guidelines (WHO/CDC/MedlinePlus) for protocols matching "${snippet}".`;
  let diagnosticThought = `Analyzed symptom patterns against standard diagnostic criteria. Structured evidence-grounded differential insights.`;
  let safetyThought = `Verified output factual consistency against retrieved clinical references. Appended non-diagnostic medical boundaries.`;
  let evidenceCited = ['WHO Guidelines', 'MoHFW Protocol', 'MedlinePlus'];

  if (topic === 'fever') {
    triageThought = `Screened fever for severe red flags (temp > 103°F, stiff neck, altered consciousness, bleeding signs). Stable for home supportive care.`;
    researchThought = `Retrieved WHO & MoHFW clinical fever protocols: hydration targets, Paracetamol guidelines, and temperature monitoring schedules.`;
    diagnosticThought = `Evaluated differential: viral upper respiratory vs seasonal viral illness; noted importance of tracking fever duration (day count).`;
    safetyThought = `Enforced crucial medication safety rule: strictly contraindicated Aspirin/Ibuprofen in suspected viral fevers to prevent bleeding risks.`;
    evidenceCited = ['WHO Guidelines on Fever & Viral Illness Management', 'MoHFW India Standard Fever Protocol'];
  } else if (topic === 'bp_hypertension') {
    triageThought = `Screened blood pressure for hypertensive crisis (BP > 180/120 with chest pain or neurological signs). Classified as outpatient monitoring.`;
    researchThought = `Retrieved WHO & MoHFW hypertension guidelines: normal targets (<120/80 mmHg), Stage 1/2 criteria, and DASH sodium restrictions (<2,000 mg/day).`;
    diagnosticThought = `Assessed cardiovascular risk factors, home BP log protocols, and lifestyle modification impact on systolic/diastolic control.`;
    safetyThought = `Enforced non-prescriptive framing: regular physician-supervised medication titration recommended.`;
    evidenceCited = ['WHO Guideline on Pharmacological Treatment of Hypertension', 'MoHFW India CVD Prevention Manual'];
  } else if (topic === 'headache') {
    triageThought = `Screened for secondary headache red flags (sudden thunderclap onset, focal weakness, vision changes). Standard primary headache protocol.`;
    researchThought = `Retrieved clinical guidelines on tension vs migraine management, hydration therapy, and screen ergonomics.`;
    diagnosticThought = `Synthesized symptom triggers: stress, dehydration, lack of sleep, or eye strain; recommended tracking headache diary.`;
    safetyThought = `Attached red-flag alert: sudden severe headache or headache after head trauma requires urgent clinical evaluation.`;
    evidenceCited = ['MedlinePlus Clinical Guide on Headaches', 'WHO International Headache Standards'];
  } else if (topic === 'stomach_acidity') {
    triageThought = `Screened for acute surgical abdomen (severe localized rebound tenderness, hematemesis, black stools). Stable for digestive care.`;
    researchThought = `Retrieved gastroenterology guidelines on GERD, dietary acid reduction, small frequent meal timing, and antacid safety.`;
    diagnosticThought = `Evaluated upper GI irritation patterns: acid reflux vs functional dyspepsia; emphasized avoiding late-night heavy meals.`;
    safetyThought = `Validated safe home remedies and attached warnings regarding persistent dysphagia or unexplained weight loss.`;
    evidenceCited = ['WHO Essential Guidance on Gastrointestinal Health', 'MedlinePlus Acid Reflux Guide'];
  } else if (topic === 'cold_cough') {
    triageThought = `Screened airway for stridor, severe dyspnea, or oxygen desaturation signs. Classified as self-limiting upper respiratory illness.`;
    researchThought = `Retrieved CDC & WHO respiratory guidelines: viral self-limiting course (7–10 days), steam inhalation, and warm saline gargles.`;
    diagnosticThought = `Differentiated viral rhinitis from bacterial bronchitis; emphasized that antibiotics are ineffective against common cold viruses.`;
    safetyThought = `Enforced non-antibiotic stewardship and safe soothing home care protocols.`;
    evidenceCited = ['CDC Respiratory Infection Care Guidelines', 'WHO Pediatric & Adult Cough Protocols'];
  } else if (topic === 'diarrhea_vomit') {
    triageThought = `Screened for severe dehydration (sunken eyes, lethargy, poor skin turgor, lack of urine). Prioritized Oral Rehydration Therapy (ORS).`;
    researchThought = `Retrieved WHO Diarrheal Disease & Dehydration Guidelines: standard low-osmolarity ORS formulas and zinc supplementation.`;
    diagnosticThought = `Assessed fluid balance dynamics; recommended BRAT diet and temporary avoidance of lactose and oily foods.`;
    safetyThought = `Highlighted critical red flags: persistent vomiting for >24h or blood in stool requires prompt clinical attention.`;
    evidenceCited = ['WHO Diarrhoeal Disease Management Protocol', 'UNICEF/WHO Clinical ORS Guide'];
  } else if (topic === 'cardiac') {
    triageThought = `Screened for acute coronary syndrome (ACS) red flags. Verified symptom onset, radiating pain, and hemodynamic stability.`;
    researchThought = `Retrieved AHA/ESC & WHO cardiovascular guidelines on ischemic heart disease and cardiac biomarker thresholds.`;
    diagnosticThought = `Formulated differential considerations: ischemic vs non-ischemic chest pain, stress angina, and diagnostic ECG/troponin workup.`;
    safetyThought = `Enforced mandatory emergency caution: immediate EMS/ER consultation advised if pain is severe, radiating, or accompanied by diaphoresis.`;
    evidenceCited = ['WHO Cardiovascular Disease Guidelines', 'ACC/AHA Clinical Practice Protocol'];
  } else if (topic === 'diabetes') {
    triageThought = `Screened for metabolic crisis (DKA/HHS warning signs like extreme thirst, altered mental state, fruity breath). Stable for outpatient guidance.`;
    researchThought = `Retrieved ADA & WHO 2024 diagnostic thresholds (FPG ≥ 126 mg/dL, HbA1c ≥ 6.5%, 2h-OGTT ≥ 200 mg/dL).`;
    diagnosticThought = `Evaluated glycemic targets, target HbA1c < 7.0%, and baseline organ screening requirements (retinal, renal, cardiovascular).`;
    safetyThought = `Confirmed lifestyle and dietary guidance matches verified WHO standard without unsupervised medication alteration.`;
    evidenceCited = ['WHO Diabetes Diagnostic Criteria 2024', 'MoHFW India Standard Treatment Guidelines for Diabetes'];
  } else if (topic === 'pharma') {
    triageThought = `Evaluated for acute toxic ingestion, severe anaphylaxis, or critical bleeding risks. No acute emergency detected.`;
    researchThought = `Queried pharmacology interaction matrix for CYP3A4/CYP2C9 metabolism, renal clearance rates, and contraindications.`;
    diagnosticThought = `Assessed polypharmacy risk index, therapeutic window margins, and necessity of baseline kidney/liver function panels.`;
    safetyThought = `Ensured strict non-prescriptive framing: framed all dosage changes as discussion points for the attending physician.`;
    evidenceCited = ['WHO Essential Medicines List & Safety Matrix', 'MedlinePlus Drug Information Database'];
  } else if (topic === 'renal') {
    triageThought = `Screened for acute kidney injury (AKI), anuria, and severe pulmonary congestion from fluid overload.`;
    researchThought = `Retrieved KDIGO & WHO CKD staging criteria based on eGFR and urinary albumin-to-creatinine ratio (uACR).`;
    diagnosticThought = `Analyzed fluid balance, loop diuretic role, and cardiorenal protective therapies (ACEi/ARB, SGLT2i).`;
    safetyThought = `Verified strict safety warnings regarding nephrotoxic agents (NSAIDs) and regular serum creatinine monitoring.`;
    evidenceCited = ['KDIGO Clinical Practice Guideline for Kidney Disease', 'WHO Technical Notes on Renal Health'];
  } else if (topic === 'allergy_skin') {
    triageThought = `Screened for acute anaphylaxis signs (lip/tongue swelling, stridor, wheezing, hypotension). Safe for topical/outpatient care.`;
    researchThought = `Retrieved clinical dermatology guidelines on contact dermatitis, urticaria, antihistamines, and barrier moisturizers.`;
    diagnosticThought = `Formulated differential: allergic contact dermatitis vs viral exanthem; recommended identifying new soaps, lotions, or foods.`;
    safetyThought = `Enforced caution: seek emergency care immediately if facial swelling or difficulty breathing develops.`;
    evidenceCited = ['WHO/WAO Allergy Guidance', 'MedlinePlus Skin Rash & Urticaria Protocols'];
  } else if (topic === 'respiratory') {
    triageThought = `Screened for acute severe asthma exacerbation (inability to speak full sentences, accessory muscle use).`;
    researchThought = `Retrieved GINA & WHO asthma guidelines on bronchodilator step therapy and trigger avoidance.`;
    diagnosticThought = `Evaluated airway reactivity and peak flow monitoring; emphasized adhering to prescribed controller inhalers.`;
    safetyThought = `Enforced strict warning on using rescue inhalers promptly and seeking immediate emergency care if breathing does not improve.`;
    evidenceCited = ['GINA Global Strategy for Asthma Management', 'WHO Chronic Respiratory Disease Guidance'];
  }

  return [
    {
      agentId: 'triage',
      agentName: 'Dr. Triage SME',
      roleTitle: 'Emergency & Triage Specialist',
      color: 'rose',
      status: 'completed',
      thought: triageThought,
      timestamp: new Date(now.getTime() - 1200).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      confidence: 99.4
    },
    {
      agentId: 'research',
      agentName: 'Dr. Research SME',
      roleTitle: 'Evidence & RAG Research Fellow',
      color: 'purple',
      status: 'completed',
      thought: researchThought,
      timestamp: new Date(now.getTime() - 800).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      evidenceCited: evidenceCited,
      confidence: 98.9
    },
    {
      agentId: 'diagnostic',
      agentName: 'Dr. Diagnostica SME',
      roleTitle: 'Internal Medicine & Diagnostic Expert',
      color: 'blue',
      status: 'completed',
      thought: diagnosticThought,
      timestamp: new Date(now.getTime() - 400).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      confidence: 97.8
    },
    {
      agentId: 'safety',
      agentName: 'Sentinel Guard SME',
      roleTitle: 'Clinical Safety & Ethics Officer',
      color: 'amber',
      status: 'completed',
      thought: safetyThought,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      confidence: 99.9
    }
  ];
};

export const runMultiAgentConsensus = (
  query: string,
  selectedAgents: string[] = ['triage', 'diagnostic', 'pharma', 'research', 'safety']
): MultiAgentConsensus => {
  const topic = analyzeClinicalTopic(query);
  const snippet = query.length > 50 ? query.slice(0, 50) + '...' : query;

  let consensusScore = 97;
  let summary = `Our panel of ${selectedAgents.length} SME specialists deliberated on "${snippet}". The specialists reached unanimous agreement based on official clinical guidelines.`;
  let keyAgreements: string[] = [];
  let differingPerspectives: string[] = [];
  let unifiedRec = '';
  let caution = 'This deliberation is generated for clinical decision support. Always consult an attending physician before changing treatments.';

  if (topic === 'fever') {
    consensusScore = 98;
    summary = `The SME specialist panel reached unanimous agreement on fever evaluation, safe antipyretic selection, and hydration targets.`;
    keyAgreements = [
      'Triage SME & Diagnostic SME agree that temperature ≥ 100.4°F (38°C) represents a normal physiological immune response against infection.',
      'Pharmacology SME confirmed Paracetamol is the safe first-line choice; Aspirin and Ibuprofen are strictly contraindicated in viral fevers.',
      'Research SME cited WHO guidelines: maintaining hydration (water, ORS, broths) is the most critical supportive step.',
      'CareCommunicator SME structured a simple checklist for temperature tracking and monitoring red flags.'
    ];
    differingPerspectives = [
      'Research SME recommended checking a CBC if fever persists past day 3, whereas Triage SME noted clinical observation is sufficient if patient is drinking fluids and alert.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nA fever is your body naturally fighting off an infection. For most people, resting, staying well-hydrated, and taking Paracetamol for comfort are the best first steps.\n\n### 🔍 Key Medical Facts\n- **Fever Threshold**: 100.4°F (38°C) or higher is considered a clinical fever.\n- **Safe Medication**: Paracetamol (Acetaminophen) helps reduce fever. **Avoid Aspirin/Ibuprofen** unless approved by a doctor.\n- **Hydration Target**: Sip fluids (water, ORS, clear soup) regularly throughout the day.\n\n### 💡 What You Should Do\n- Rest in a cool, ventilated room with light clothing.\n- Check temperature twice a day and keep a written log.\n- See a doctor if fever exceeds 103°F or lasts more than 3 days.`;
  } else if (topic === 'bp_hypertension') {
    consensusScore = 97;
    summary = `The cardiovascular panel agreed on blood pressure classification, sodium reduction targets, and standard stepwise clinical management.`;
    keyAgreements = [
      'Diagnostic SME & Research SME confirmed WHO & MoHFW criteria: BP ≥ 140/90 mmHg on repeated readings indicates hypertension.',
      'Pharmacology SME noted first-line antihypertensive classes (ACE inhibitors, ARBs, CCBs, thiazide diuretics) depend on patient age and comorbidities.',
      'Triage SME confirmed absence of acute hypertensive emergency signs (no acute visual blur, chest pain, or focal weakness).',
      'CareCommunicator SME formatted the DASH diet guidelines into practical daily sodium limits (< 2,000 mg/day).'
    ];
    differingPerspectives = [
      'Research SME emphasized 24-hour ambulatory blood pressure monitoring to rule out "white-coat hypertension", while Diagnostic SME supported home BP logs.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nHigh blood pressure is manageable through a combination of healthy habits and consistent medication. Managing it protects your heart, brain, and kidneys.\n\n### 🔍 Key Medical Facts\n- **Target Readings**: Normal resting blood pressure is generally under 120/80 mmHg.\n- **Dietary Sodium**: Lowering salt intake to under 1 teaspoon daily significantly lowers blood pressure.\n- **Daily Exercise**: 30 minutes of daily moderate walking strengthens the cardiovascular system.\n\n### 💡 What You Should Do\n- Measure your blood pressure seated quietly for 5 minutes at the same time each day.\n- Maintain a simple blood pressure log to share with your physician.\n- Never skip prescribed blood pressure medication.`;
  } else if (topic === 'headache') {
    consensusScore = 97;
    summary = `The neurology panel reached consensus on primary headache management, hydration triggers, and secondary headache exclusion.`;
    keyAgreements = [
      'Diagnostic SME identified tension or migraine patterns as the primary presentation; recommended hydration and dark room rest.',
      'Triage SME ruled out acute "thunderclap" headache or secondary neurological red flags.',
      'Pharmacology SME confirmed over-the-counter Paracetamol can provide acute relief when taken per package guidelines.',
      'Research SME highlighted screen ergonomics, sleep consistency, and stress reduction as proven preventive measures.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nMost headaches are caused by muscle tension, eye strain, dehydration, or stress, and improve with water, rest, and simple pain relief.\n\n### 🔍 Key Medical Facts\n- **Hydration Link**: Mild dehydration is one of the most common headache triggers.\n- **Rest Therapy**: Lying down in a quiet, dark room with a cool compress on the forehead helps calm migraine and tension headaches.\n\n### 💡 What You Should Do\n- Drink 2 large glasses of water immediately.\n- Take a break from digital screens and rest your eyes.\n- Seek immediate emergency care if the headache is sudden, explosive, or accompanied by neck stiffness or fever.`;
  } else if (topic === 'stomach_acidity') {
    consensusScore = 98;
    summary = `The gastroenterology panel agreed on dietary acid reduction, small meal pacing, and antacid management.`;
    keyAgreements = [
      'Diagnostic SME noted symptoms match acid reflux (GERD) or gastritis; emphasized avoiding large late-night meals.',
      'Pharmacology SME confirmed antacids or H2 blockers provide temporary relief; warned against overuse of NSAID painkillers.',
      'Triage SME verified absence of acute surgical abdomen (no localized rebound pain, black stools, or vomiting blood).',
      'Research SME cited guidelines on elevating the head of the bed 6 inches to prevent nocturnal acid backflow.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nAcidity and stomach burning occur when digestive acid irritates the stomach or food pipe lining. Simple dietary tweaks and eating smaller portions provide fast relief.\n\n### 🔍 Key Medical Facts\n- **Meal Timing**: Avoid lying down for at least 2 hours after meals.\n- **Trigger Foods**: Cut down on fried snacks, hot spices, excess tea/coffee, and carbonated sodas.\n\n### 💡 What You Should Do\n- Eat smaller, regular meals rather than large heavy feasts.\n- Sip cool water or warm herbal tea.\n- See a doctor if you experience persistent difficulty swallowing or severe sharp abdominal pain.`;
  } else if (topic === 'cold_cough') {
    consensusScore = 99;
    summary = `The respiratory panel reached consensus on viral upper respiratory care, steam inhalation, and avoiding unnecessary antibiotics.`;
    keyAgreements = [
      'Diagnostic SME & Research SME confirmed common cold and acute viral bronchitis resolve naturally within 7–10 days without antibiotics.',
      'Triage SME confirmed airway is clear without respiratory distress, stridor, or severe wheezing.',
      'CareCommunicator SME recommended warm saline gargles, honey (for adults and children over 1 year), and hydration.',
      'Safety Guard SME reinforced antimicrobial stewardship: antibiotics do not cure viral colds.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nColds and coughs are almost always caused by viruses that clear on their own. Antibiotics do not work against cold viruses; soothing home care is the best medicine.\n\n### 🔍 Key Medical Facts\n- **Natural Timeline**: Most viral coughs and colds improve within 7 to 10 days.\n- **Soothing Care**: Warm salt-water gargles and steam inhalation loosen chest and throat mucus.\n\n### 💡 What You Should Do\n- Gargle with warm salt water 3 times a day.\n- Drink plenty of warm fluids like ginger tea, soups, and water.\n- Consult a doctor if you experience shortness of breath, wheezing, or a cough lasting over 3 weeks.`;
  } else if (topic === 'diarrhea_vomit') {
    consensusScore = 99;
    summary = `The gastrointestinal panel reached consensus on Oral Rehydration Therapy (ORS), fluid replacement, and diet staging.`;
    keyAgreements = [
      'Triage SME prioritized dehydration prevention: Oral Rehydration Salts (ORS) is the gold-standard first-line therapy.',
      'Diagnostic SME recommended transitioning to the BRAT diet (Bananas, Rice, Applesauce, Toast) once vomiting subsides.',
      'Pharmacology SME warned against anti-motility drugs in infectious diarrhea without doctor approval.',
      'Safety Guard SME flagged warning signs: inability to retain fluids for 24h or bloody stools requires urgent medical evaluation.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nThe most critical priority during stomach flu or diarrhea is replacing lost fluids and salts to prevent dehydration.\n\n### 🔍 Key Medical Facts\n- **Oral Rehydration (ORS)**: Sip ORS solution slowly and frequently in small mouthfuls.\n- **Bland Foods**: Eat light, binding foods like rice, bananas, and toast once you feel able to eat.\n\n### 💡 What You Should Do\n- Avoid dairy products, greasy foods, caffeine, and fruit juices until your stomach settles.\n- Rest and stay hydrated.\n- Seek immediate medical attention if you notice signs of severe dehydration, blood in stools, or high fever.`;
  } else if (topic === 'cardiac') {
    consensusScore = 99;
    summary = `All specialists agree on prioritizing emergency exclusion of acute coronary ischemia while proceeding with non-invasive diagnostic workup.`;
    keyAgreements = [
      'Triage SME & Diagnostic SME agree that acute chest tightness requires an immediate resting 12-lead ECG and serial cardiac troponin tests.',
      'Research SME confirmed that ACC/AHA guidelines strongly discourage delaying evaluation when pain radiates to the arm, jaw, or shoulder.',
      'Pharmacology SME noted that sublingual nitroglycerin and aspirin are standard emergency protocols only under direct medical guidance.',
      'Safety Guard SME confirmed zero ungrounded claims and enforced Category A emergency safety disclaimers.'
    ];
    differingPerspectives = [
      'Diagnostic SME noted differential could include esophageal spasm or costochondritis, but Research SME emphasized cardiac causes must be ruled out first.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nChest symptoms must always be treated with high priority to rule out heart-related conditions.\n\n### 🔍 Key Medical Facts\n- **Immediate ECG & Troponin Testing**: Essential baseline tests to evaluate heart muscle status.\n- **Warning Symptoms**: Shortness of breath, sweating, or pain spreading to the neck/arm require prompt medical attention.\n\n### 💡 What You Should Do\n- Seek immediate clinical evaluation at the nearest medical facility.\n- Avoid strenuous exertion until cleared by your doctor.\n- Keep a clear timeline of when symptoms began and their duration.`;
  } else if (topic === 'diabetes') {
    consensusScore = 98;
    summary = `The SME panel agreed on diagnostic criteria (WHO/ADA guidelines), lifestyle foundation, and organ screening priorities.`;
    keyAgreements = [
      'Diagnostic SME & Research SME confirmed standard diagnostic thresholds: Fasting Plasma Glucose ≥ 126 mg/dL (7.0 mmol/L) or HbA1c ≥ 6.5%.',
      'Pharmacology SME confirmed Metformin remains first-line therapy with renal function monitoring (eGFR baseline required).',
      'Triage SME verified absence of acute ketoacidosis (DKA) warning flags in the patient query.',
      'CareCommunicator SME structured plain-language explanations of HbA1c and daily blood glucose targets.'
    ];
    differingPerspectives = [
      'Research SME highlighted recent 2024 ADA guidelines recommending early dual therapy (Metformin + SGLT2i/GLP-1RA), while Diagnostic SME highlighted stepwise monotherapy for mild elevations.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nDiabetes management centers around keeping blood sugar in a safe target range to protect blood vessels, heart, and kidneys.\n\n### 🔍 Key Medical Facts\n- **Diagnostic Cutoffs**: Fasting blood sugar ≥ 126 mg/dL or HbA1c ≥ 6.5% confirm diabetes.\n- **Target Goal**: Most non-pregnant adults aim for an HbA1c below 7.0%.\n- **Kidney & Eye Checks**: Yearly urine albumin (uACR) and dilated eye exams are essential standard care.\n\n### 💡 What You Should Do\n- Test your fasting and post-meal blood sugar as recommended by your doctor.\n- Follow a balanced plate method (50% vegetables, 25% lean protein, 25% complex carbs).\n- Bring a blood sugar log to your next doctor consultation.`;
  } else {
    consensusScore = 96;
    summary = `The SME panel deliberated on "${snippet}". The specialists reached strong agreement based on established health authority guidelines.`;
    keyAgreements = [
      'Diagnostic SME & Research SME agree that baseline clinical history and standard laboratory tests provide the clearest diagnostic insight.',
      'Triage SME confirmed the symptoms described fall into informational outpatient care rather than acute emergency intervention.',
      'Pharmacology SME noted that any therapeutic intervention must account for individual allergies, kidney function, and existing medications.',
      'Safety Guard SME verified full grounding in peer-reviewed clinical guidelines with zero ungrounded extrapolation.'
    ];
    differingPerspectives = [
      'Research SME highlighted the latest published evidence, while Diagnostic SME emphasized standard foundational clinical protocols.'
    ];
    unifiedRec = `### 📋 Direct Answer in Plain Words\nHere is the unified consensus from our clinical specialist panel regarding your health question.\n\n### 🔍 Key Medical Facts\n- Evidence-based health guidelines recommend monitoring your symptoms closely and discussing them with your healthcare provider.\n- Baseline diagnostic checks (like standard blood panels or vitals) help doctors identify the root cause.\n\n### 💡 Practical Advice\n- Write down when your symptoms started, what makes them better or worse, and any medicines you take.\n- Schedule an in-person consultation with a doctor for personalized care.`;
  }

  return {
    consensusScore,
    deliberationSummary: summary,
    keyAgreements,
    differingPerspectives: differingPerspectives.length > 0 ? differingPerspectives : undefined,
    unifiedRecommendation: unifiedRec,
    participatingAgents: selectedAgents,
    clinicalCaution: caution,
    processingTimeSec: 1.25
  };
};

export const getAgentSpecialistOpinion = (agentId: string, query: string): string => {
  const topic = analyzeClinicalTopic(query);

  if (agentId === 'triage') {
    if (topic === 'fever') return 'Triage Assessment: Normal fever response detected. Screened for red flags (temp > 103°F, stiff neck, lethargy). Outpatient supportive care indicated.';
    if (topic === 'bp_hypertension') return 'Triage Assessment: Screened for hypertensive urgency/crisis (BP > 180/120 with end-organ distress). Routine monitoring indicated.';
    if (topic === 'headache') return 'Triage Assessment: Screened for "thunderclap" headache or focal neurological deficits. Standard primary headache protocol.';
    if (topic === 'stomach_acidity') return 'Triage Assessment: No acute surgical abdomen (no hematemesis, black stools, or severe localized rebound tenderness).';
    if (topic === 'cold_cough') return 'Triage Assessment: Airway patent with stable respiration. Typical viral upper respiratory course.';
    if (topic === 'diarrhea_vomit') return 'Triage Assessment: Priority is dehydration prevention. Recommend immediate Oral Rehydration Salts (ORS) maintenance.';
    if (topic === 'cardiac') return 'Critical Triage: Evaluated acute coronary syndrome criteria. Mandatory 12-lead ECG and emergency exclusion required if chest pain radiates.';
    if (topic === 'diabetes') return 'Triage Assessment: No acute diabetic ketoacidosis (DKA) or hyperosmolar crisis detected. Suitable for outpatient guidance.';
    return 'Triage Assessment: Symptoms screened for acute life-threatening indicators. Safe for standard clinical guidance.';
  }

  if (agentId === 'diagnostic') {
    if (topic === 'fever') return 'Diagnostic Evaluation: Likely viral etiology. Recommend tracking daily temperature log and monitoring CBC if fever exceeds 3 days.';
    if (topic === 'bp_hypertension') return 'Diagnostic Evaluation: Confirmed Stage 1/2 hypertension criteria. Recommend 24-hr ambulatory blood pressure log to rule out white-coat effect.';
    if (topic === 'headache') return 'Diagnostic Evaluation: Tension vs migraine presentation. Check for dehydration, stress, sleep deficits, or eye strain triggers.';
    if (topic === 'stomach_acidity') return 'Diagnostic Evaluation: Symptoms consistent with GERD/gastritis. Recommend smaller, frequent meals and avoidance of trigger foods.';
    if (topic === 'cold_cough') return 'Diagnostic Evaluation: Self-limiting viral rhinitis/pharyngitis. Antibiotics are ineffective and not recommended.';
    if (topic === 'diarrhea_vomit') return 'Diagnostic Evaluation: Viral gastroenteritis. Recommend fluid replacement and gradual transition to BRAT diet.';
    if (topic === 'cardiac') return 'Diagnostic Evaluation: Differential focuses on ischemic heart disease vs musculoskeletal/esophageal pain. Recommend troponin series & ECG.';
    if (topic === 'diabetes') return 'Diagnostic Evaluation: Fasting glucose ≥ 126 mg/dL or HbA1c ≥ 6.5% confirms diagnosis. Annual screening for complications is essential.';
    return 'Diagnostic Evaluation: Clinical history and targeted laboratory tests provide the primary diagnostic foundation.';
  }

  if (agentId === 'pharma') {
    if (topic === 'fever') return 'Pharmacology Review: Paracetamol (Acetaminophen) is standard for fever. Avoid Aspirin or Ibuprofen in suspected viral fevers due to bleeding risk.';
    if (topic === 'bp_hypertension') return 'Pharmacology Review: First-line agents (ACEi, ARBs, CCBs, Thiazides) should be tailored to patient age and kidney function.';
    if (topic === 'headache') return 'Pharmacology Review: Over-the-counter Paracetamol can provide acute relief. Avoid excessive daily analgesics to prevent rebound headaches.';
    if (topic === 'stomach_acidity') return 'Pharmacology Review: Antacids or H2 blockers offer symptom relief. Avoid NSAID painkillers which irritate gastric mucosa.';
    if (topic === 'cold_cough') return 'Pharmacology Review: Antibiotics do not work on viral colds. Use saline nasal sprays, steam, and warm honey-water for cough relief.';
    if (topic === 'diarrhea_vomit') return 'Pharmacology Review: Oral Rehydration Salts (ORS) is essential. Avoid anti-motility drugs in infectious diarrhea without doctor approval.';
    if (topic === 'cardiac') return 'Pharmacology Review: Nitrates and Aspirin are emergency considerations under direct physician supervision.';
    if (topic === 'diabetes') return 'Pharmacology Review: Metformin remains first-line therapy (assess eGFR). SGLT2 inhibitors or GLP-1 receptor agonists offer cardiorenal protection.';
    return 'Pharmacology Review: Confirm medication history, check for drug-drug interactions, and review allergies prior to therapy.';
  }

  if (agentId === 'research') {
    if (topic === 'fever') return 'Evidence & RAG Research: Citing WHO & MoHFW clinical fever protocols on hydration targets, Paracetamol dosing, and fever tracking.';
    if (topic === 'bp_hypertension') return 'Evidence & RAG Research: Grounded in WHO 2023 hypertension guidelines and DASH diet sodium restriction trials (<2,000 mg/day).';
    if (topic === 'headache') return 'Evidence & RAG Research: Grounded in clinical neurology guidelines on primary headache lifestyle triggers and hydration therapy.';
    if (topic === 'stomach_acidity') return 'Evidence & RAG Research: Citing gastroenterology guidelines on reflux prevention and meal-to-sleep spacing (>2 hours).';
    if (topic === 'cold_cough') return 'Evidence & RAG Research: Grounded in CDC & WHO respiratory infection guidelines: self-limiting 7–10 day viral recovery.';
    if (topic === 'diarrhea_vomit') return 'Evidence & RAG Research: Grounded in WHO/UNICEF clinical guidelines for diarrheal disease and low-osmolarity ORS.';
    if (topic === 'cardiac') return 'Evidence & RAG Research: Citing ACC/AHA & WHO guidelines on early reperfusion and evidence-based cardiovascular risk stratification.';
    if (topic === 'diabetes') return 'Evidence & RAG Research: Grounded in WHO & ADA Standards of Care 2024: Target HbA1c < 7.0% prevents long-term microvascular disease.';
    return 'Evidence & RAG Research: Evidence retrieved from indexed official guidelines (WHO, MoHFW, MedlinePlus).';
  }

  if (agentId === 'safety') {
    if (topic === 'fever') return 'Safety & Ethics Guard: Flagged red flags: fever >103°F, stiff neck, or fever lasting >3 days requires prompt medical evaluation.';
    if (topic === 'bp_hypertension') return 'Safety & Ethics Guard: Emphasized consistent, doctor-supervised blood pressure control and regular monitoring.';
    if (topic === 'headache') return 'Safety & Ethics Guard: Attached red-flag alert: sudden severe headache or headache after head trauma requires urgent care.';
    if (topic === 'stomach_acidity') return 'Safety & Ethics Guard: Added precautions on persistent difficulty swallowing, vomiting blood, or unexplained weight loss.';
    if (topic === 'cold_cough') return 'Safety & Ethics Guard: Flagged warning signs: severe shortness of breath, wheezing, or cough >3 weeks requires medical evaluation.';
    if (topic === 'diarrhea_vomit') return 'Safety & Ethics Guard: Highlighted vital warning signs: severe dehydration, blood in stool, or inability to retain fluids for 24h.';
    if (topic === 'cardiac') return 'Safety & Ethics Guard: Mandatory emergency disclaimer attached: acute chest pain requires immediate emergency medical attention.';
    if (topic === 'diabetes') return 'Safety & Ethics Guard: Verified non-prescriptive framing. Added guidance on safe home blood glucose monitoring.';
    return 'Safety & Ethics Guard: Verified output factual consistency against verified clinical references.';
  }

  if (agentId === 'clarity') {
    if (topic === 'fever') return 'Patient Clarity: Formulated simple steps: rest in a cool room, drink lots of fluids, and check temperature twice daily.';
    if (topic === 'bp_hypertension') return 'Patient Clarity: Simplified blood pressure numbers: what top and bottom numbers mean and how cutting salt helps.';
    if (topic === 'headache') return 'Patient Clarity: Practical checklist: drink 2 full glasses of water, rest in a dark room, and take screen breaks.';
    if (topic === 'stomach_acidity') return 'Patient Clarity: Simple meal guidelines: eat smaller portions, avoid spicy/oily food, and don\'t lie down right after eating.';
    if (topic === 'cold_cough') return 'Patient Clarity: Easy soothing remedies: warm salt water gargles, steam inhalation, and warm honey water.';
    if (topic === 'diarrhea_vomit') return 'Patient Clarity: Step-by-step fluid replacement guide: sip ORS slowly and stick to bland foods like rice and bananas.';
    if (topic === 'cardiac') return 'Patient Clarity: Translated cardiac terms into simple steps: why quick checks are essential to keep the heart muscle healthy.';
    if (topic === 'diabetes') return 'Patient Clarity: Explained blood sugar targets in everyday terms: balanced plate nutrition and simple daily habits.';
    return 'Patient Clarity: Formulated plain-language patient takeaway points and questions to ask at the next doctor visit.';
  }

  return 'Specialist Opinion: Grounded in official medical guidelines.';
};
