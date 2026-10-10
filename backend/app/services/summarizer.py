import time
from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.db_models import Document, DocumentChunk
from app.agents.groq_client import GroqClientWrapper

class DocumentSummarizer:
    """Healthcare Document Summarization Engine with 7 clinical & patient-centered modes."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_client = GroqClientWrapper()

    async def summarize(
        self,
        document_id: str,
        mode: str = "detailed",
        target_question: Optional[str] = None,
        compare_document_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        start_time = time.time()

        # Fetch document and chunks
        result = await self.db.execute(select(Document).where(Document.id == document_id))
        doc = result.scalar_one_or_none()
        if not doc:
            raise ValueError(f"Document {document_id} not found.")

        chunks_res = await self.db.execute(
            select(DocumentChunk).where(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index)
        )
        chunks = chunks_res.scalars().all()

        if not chunks:
            raise ValueError("Document has no indexed text chunks available for summarization.")

        # Combine text for length-aware processing
        full_text = "\n\n".join([f"[Page {c.page_number or 1}] {c.content}" for c in chunks[:25]])
        
        # Build prompt based on mode
        prompt = self._build_prompt(
            mode=mode,
            doc_title=doc.title,
            publisher=doc.publisher or "Health Document",
            text=full_text,
            target_question=target_question
        )

        system_instruction = (
            "You are a clinical document summarization expert. "
            "Preserve factual medical accuracy, units of measurement, dates, and uncertainty. "
            "Never invent laboratory values or clinical claims not in the source text. "
            "Distinguish between facts stated in the document and generated explanations. "
            "Cite the page numbers provided in brackets [Page X] when summarizing statements."
        )

        response_text = await self.ai_client.generate_chat_completion(
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ]
        )

        # Extract key points and glossary if applicable
        key_points = self._extract_key_points(response_text)
        medical_terms = self._extract_medical_terms(full_text[:2000])

        source_citations = [
            {
                "citation_id": f"doc-{doc.id[:6]}",
                "document_title": doc.title,
                "publisher": doc.publisher,
                "total_pages": doc.total_pages,
                "trust_tier": doc.trust_tier
            }
        ]

        processing_time = round(time.time() - start_time, 2)

        return {
            "document_id": doc.id,
            "document_title": doc.title,
            "mode": mode,
            "summary": response_text,
            "key_points": key_points,
            "medical_terms_explained": medical_terms,
            "source_citations": source_citations,
            "clinical_caution": (
                "Caution: This summary is generated for informational reference. It must not be used as an independent "
                "diagnostic report or prescription substitute. Please consult a qualified medical professional."
            ),
            "processing_time_sec": processing_time
        }

    def _build_prompt(
        self,
        mode: str,
        doc_title: str,
        publisher: str,
        text: str,
        target_question: Optional[str] = None
    ) -> str:
        base_context = f"Document Title: {doc_title}\nSource: {publisher}\n\nDocument Excerpt:\n{text}\n\n"

        if mode == "quick":
            return base_context + "Provide a 3-4 sentence high-level executive summary of this health document, highlighting the central medical condition, key takeaway, and intended audience."

        elif mode == "section_by_section":
            return base_context + "Provide a structured, section-by-section breakdown of this document with page references where indicated. Include subheadings and bullet points for each section."

        elif mode == "key_points":
            return base_context + "Extract the key clinical and health points as a bulleted list. Highlight specific numbers, vital signs, dosages mentioned, timelines, and important diagnostic criteria."

        elif mode == "plain_language":
            return base_context + "Provide a plain-language explanation of this medical document written for patients and families. Explain complex medical terminology simply, without losing critical safety warnings."

        elif mode == "question_focused" and target_question:
            return base_context + f"Analyze this document specifically to answer this targeted question:\n'{target_question}'\nState clearly what the document says about it, citing relevant page numbers."

        elif mode == "comparison":
            return base_context + "Synthesize the main medical recommendations and guidelines in this document, highlighting points of certainty vs areas where clinical debate exists."

        else: # detailed
            return base_context + "Provide a comprehensive, detailed clinical summary of this document. Structure it with: 1. Overview & Objectives, 2. Clinical Findings / Health Guidelines, 3. Notable Risks / Precautions, 4. Page-referenced Evidence."

    def _extract_key_points(self, summary_text: str) -> List[str]:
        lines = [line.strip().lstrip("-*•0123456789. ") for line in summary_text.split("\n") if line.strip().startswith(("-", "*", "•", "1.", "2.", "3.", "4."))]
        return lines[:6] if lines else [summary_text[:150] + "..."]

    def _extract_medical_terms(self, text: str) -> Dict[str, str]:
        # Predefined common terms dictionary for high-utility patient reference
        common_glossary = {
            "hypertension": "High blood pressure (persistently elevated force of blood against artery walls)",
            "hypotension": "Low blood pressure below normal ranges",
            "hyperglycemia": "Elevated level of glucose (sugar) in the bloodstream",
            "hypoglycemia": "Abnormally low blood sugar level",
            "tachycardia": "Abnormally rapid heart rate (over 100 beats per minute at rest)",
            "bradycardia": "Abnormally slow heart rate (under 60 beats per minute at rest)",
            "dyspnea": "Shortness of breath or difficulty breathing",
            "etiology": "The cause, set of causes, or manner of causation of a disease",
            "prognosis": "The likely outcome or course of a medical condition",
            "contraindication": "A specific situation in which a drug or procedure should not be used because it may be harmful",
            "myocardial infarction": "Heart attack caused by blocked blood flow to the heart muscle",
            "cerebrovascular": "Relating to the brain and its blood vessels"
        }
        found_terms = {}
        text_lower = text.lower()
        for term, definition in common_glossary.items():
            if term in text_lower:
                found_terms[term.title()] = definition
        return found_terms
