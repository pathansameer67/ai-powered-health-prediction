# 🏥 AegisHealth AI: Clinical Multi-Agent Intelligence & Care Concierge Platform

> An enterprise-grade, multi-agent clinical diagnostic, medical imaging (AI X-Ray), and real-time healthcare concierge ecosystem. Built with FastAPI, Groq LLM, ChromaDB RAG, and React 18 / TypeScript.

---

## 🚀 Key Highlights & Capabilities

### 1. 🤖 7 Specialized Autonomous Clinical AI Agents
1. **🚨 Dr. Triage SME (Emergency & Triage Specialist)**
   - Instant hemodynamic instability screening, acute stroke (FAST), anaphylaxis, and life-threatening red flags.
2. **🩺 Dr. Diagnostica SME (Internal Medicine & Diagnostic Expert)**
   - Differential diagnosis formulation, symptom clustering, pathology analysis, and lab workup planning.
3. **💊 PharmExpert SME (Clinical Pharmacology & Therapeutics)**
   - Drug-drug interaction checking, hepatic/renal dose adjustment, contraindication filters, and OTC guidance.
4. **📚 Dr. Research SME (Evidence & Literature RAG Fellow)**
   - Dense vector retrieval over verified WHO, CDC, and MoHFW clinical guidelines with citation proofs.
5. **🛡️ Sentinel Guard SME (Clinical Safety & Ethics Officer)**
   - Real-time hallucination scrubbing, non-diagnostic ethical guardrails, and HIPAA/DISHA data protection.
6. **🗣️ CareCommunicator SME (Patient Education & Plain Language)**
   - Jargon translation into empathetic 5-section patient action plans, warning signs, and glossary terms.
7. **🚑 Dr. Aiden Cross (Autonomous Care Concierge & Direct Dispatcher SME)**
   - **⚡ 1-Click Autonomous Auto-Pilot:** Accepts natural language requests (e.g. *"Alex Morgan has acute chest pain, register at nearest emergency hospital"* or *"Send Dolo 650 & ORS to my location"*), deduces clinical urgency, and directly executes hospital registration or medicine dispatch without manual forms.
   - **Local Pharmacy Stock Search & Ordering:** Live inventory lookup for prescription and OTC medicines from nearby 24/7 pharmacies with express 20-minute delivery or store pickup.
   - **Condition-Matched Hospital Pinpointing:** Real-time discovery of nearby trauma centers, multi-specialty hospitals with live Bed & ICU availability counters and emergency wait times.
   - **Digital Patient Pre-Registration Pass:** One-click pre-registration generating instant Queue Tokens (`#EMERGENCY-XX` / `#OPD-XXX`), assigned department/room, triage priority level, and verification hashes.

---

### 2. 🩻 AI X-Ray Vision & Medical Imaging Studio
- Supports Chest X-Ray (CXR), Bone Fracture, Spine, and Dental Orthopantomogram (OPG) modalities.
- Multi-agent radiologic consensus report featuring anatomical findings, abnormality bounding markers, and plain-language patient summaries.

---

### 3. 🛡️ 3-Tier Clinical Safety Escalation Architecture
- **Category A (Immediate Emergency):** Intercepts red-flag emergencies (e.g. crushing chest pain, anaphylaxis) with emergency hotline routing (108 / 112 / 911) and first-aid instructions.
- **Category B (Red-Flag Urgent Warning):** Highlights critical doctor consultation banners with exact clinical questions for healthcare providers.
- **Category C (Safe General Health Guidance):** Provides clear, evidence-backed self-care guidance for common everyday issues (fever, BP tracking, cold, gastritis).

---

## 🏗️ Tech Stack

- **Backend:** Python 3.11+, FastAPI, Uvicorn, ChromaDB, Groq Cloud API (`llama-3.3-70b-versatile`), Pydantic v2.
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Lucide Icons, Glassmorphic UI.
- **Storage & State:** ChromaDB Vector Store, In-Memory SQLite, LocalStorage persistence for pharmacy orders and digital passes.

---

## 🏃 Getting Started

### 1. Run the Backend API
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Run the Frontend App
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 Hackathon Team & Responsibilities
- **Member 1 (Full-Stack Architect):** React 18 UI, Glassmorphic design system, Care Concierge frontend studios.
- **Member 2 (Multi-Agent & LLM Engineer):** 7-agent deliberation consensus engine, prompt orchestration, Groq integration.
- **Member 3 (RAG & Data Pipeline Engineer):** ChromaDB hybrid semantic search, guideline ingestion, source registry.
- **Member 4 (Vision & Clinical Safety Engineer):** AI X-Ray vision pipeline, 3-tier safety matrix, digital queue token generator.
