import json
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.safety.safety_filter import SafetyFilter
from app.models.db_models import EscalationCategory, Conversation, Message, EscalationLog
from app.tools.implementations import AgentTools
from app.agents.groq_client import GroqClientWrapper
from app.retrieval.citation_manager import CitationManager
from app.schemas.chat import ChatResponse, ToolInvocationLog


class AgentOrchestrator:
    """Controlled, Safe Agent Orchestration Engine with bounded execution loop."""

    def __init__(self, db: AsyncSession, user_id: Optional[str] = None):
        self.db = db
        self.user_id = user_id
        self.tools = AgentTools(db, user_id)
        self.ai_client = GroqClientWrapper()
        self.max_iterations = 4

    async def execute_query(
        self,
        query: str,
        conversation_id: Optional[str] = None,
        selected_document_id: Optional[str] = None,
        filter_trust_tier: Optional[str] = None,
        jurisdiction: str = "IN"
    ) -> ChatResponse:
        created_at = datetime.now(timezone.utc)
        message_id = str(uuid.uuid4())
        tools_executed: List[ToolInvocationLog] = []

        if not conversation_id:
            conv = Conversation(
                user_id=self.user_id,
                title=query[:40] + ("..." if len(query) > 40 else ""),
                selected_document_id=selected_document_id
            )
            self.db.add(conv)
            await self.db.commit()
            await self.db.refresh(conv)
            conversation_id = conv.id

        user_msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=query
        )
        self.db.add(user_msg)

        safety_eval = SafetyFilter.evaluate_input_safety(query, jurisdiction)
        esc_tool = await self.tools.assess_escalation(query, jurisdiction)
        tools_executed.append(ToolInvocationLog(
            tool_name="assess_escalation",
            arguments={"query": query, "jurisdiction": jurisdiction},
            status="success",
            result_summary=f"Triage result: {esc_tool.get('category')} ({'; '.join(esc_tool.get('matched_triggers') or []) or 'no emergency triggers'})"
        ))

        if safety_eval.category == EscalationCategory.CATEGORY_A.value:
            esc_log = EscalationLog(
                conversation_id=conversation_id,
                user_id=self.user_id,
                user_query=query,
                category=safety_eval.category,
                matched_triggers="; ".join(safety_eval.matched_triggers),
                guidance_provided=safety_eval.guidance_message or "",
                emergency_contact=safety_eval.emergency_number
            )
            self.db.add(esc_log)

            msg = Message(
                id=message_id,
                conversation_id=conversation_id,
                role="assistant",
                content=safety_eval.guidance_message or "",
                tools_used_json=json.dumps([t.model_dump() for t in tools_executed]),
                escalation_category=safety_eval.category,
                escalation_guidance=safety_eval.guidance_message,
                has_insufficient_evidence=False
            )
            self.db.add(msg)
            await self.db.commit()

            return ChatResponse(
                conversation_id=conversation_id,
                message_id=message_id,
                query=query,
                answer=safety_eval.guidance_message or "",
                citations=[],
                tools_used=tools_executed,
                escalation_category=safety_eval.category,
                escalation_guidance=safety_eval.guidance_message,
                has_insufficient_evidence=False,
                limitations="This system cannot provide real-time diagnostic emergency interventions.",
                follow_up_suggestions=[
                    "Where is the nearest hospital emergency room?",
                    "What first-aid actions can be taken while waiting for an ambulance?"
                ],
                created_at=created_at
            )

        search_res = await self.tools.search_health_documents(
            query=query,
            top_k=4,
            trust_tier=filter_trust_tier,
            document_id=selected_document_id
        )
        tools_executed.append(ToolInvocationLog(
            tool_name="search_health_documents",
            arguments={"query": query, "top_k": 4, "trust_tier": filter_trust_tier, "document_id": selected_document_id},
            status="success",
            result_summary=f"Found {search_res['count']} candidate healthcare passages."
        ))

        retrieved_passages = search_res.get("passages", [])

        if re.search(r"\b(what is|what's|explain|define|meaning of|term)\b", query, re.IGNORECASE):
            term_match = re.search(r"(?:what is|what's|explain|define|meaning of)\s+([a-zA-Z][a-zA-Z\s-]{2,40})", query, re.IGNORECASE)
            term = term_match.group(1).strip(" ?.") if term_match else query
            explain_res = await self.tools.explain_medical_term(term=term, context=query)
            tools_executed.append(ToolInvocationLog(
                tool_name="explain_medical_term",
                arguments={"term": term},
                status="success",
                result_summary=f"Looked up plain-language context for '{term}'."
            ))
            extra = (explain_res.get("evidence_context") or "").strip()
            if extra and not retrieved_passages:
                retrieved_passages = search_res.get("passages", [])

        if selected_document_id and re.search(r"\bsummar", query, re.IGNORECASE):
            try:
                summary = await self.tools.summarize_document(selected_document_id, mode="quick")
                tools_executed.append(ToolInvocationLog(
                    tool_name="summarize_document",
                    arguments={"document_id": selected_document_id, "mode": "quick"},
                    status="success",
                    result_summary="Generated a focused document summary to support the answer."
                ))
                if summary.get("summary"):
                    retrieved_passages.append({
                        "title": summary.get("document_title"),
                        "publisher": "Document summary",
                        "page_number": 1,
                        "heading": "Summary",
                        "content": summary.get("summary"),
                        "score": 1.0,
                        "document_id": selected_document_id,
                        "trust_tier": "private_upload"
                    })
            except Exception:
                tools_executed.append(ToolInvocationLog(
                    tool_name="summarize_document",
                    arguments={"document_id": selected_document_id},
                    status="error",
                    result_summary="Summarization tool could not complete for the selected document."
                ))

        citations = CitationManager.create_citations(retrieved_passages)
        citation_pack = await self.tools.format_citations(retrieved_passages)
        tools_executed.append(ToolInvocationLog(
            tool_name="format_citations",
            arguments={"passage_count": len(retrieved_passages)},
            status="success",
            result_summary=f"Formatted {len(citations)} evidence citations."
        ))

        context_str = "\n\n".join([
            f"[Passage {idx+1} | Source: {p.get('title')} | Page: {p.get('page_number')} | Publisher: {p.get('publisher')}]\n{p.get('content')}"
            for idx, p in enumerate(retrieved_passages)
        ])

        system_prompt = (
            "You are AegisHealth, an empathetic, expert AI Clinical Assistant and Multi-Agent Health Specialist.\n"
            "You provide comprehensive, helpful, beautifully structured, and easy-to-understand guidance on ANY illness, symptom, medication, or medical question—from common everyday issues (fever, cold, headache, cough, sore throat, stomach ache, blood pressure, acid reflux, allergies, diarrhea, rashes, fatigue) to chronic conditions.\n\n"
            "CRITICAL INSTRUCTION: You MUST always answer the user's question directly, empathetically, and comprehensively. NEVER refuse, apologize, or say 'the passages do not contain information about this'. If retrieved document passages are relevant to the question, incorporate and cite them with [cite-1]. If no passages or unrelated passages are provided, immediately provide standard, authoritative clinical guideline knowledge (WHO, CDC, MedlinePlus, AHA).\n\n"
            "Always structure your answer with EXACTLY these 5 markdown sections:\n\n"
            "### 📋 Direct Answer in Plain Words\n"
            "(Provide a clear, empathetic 2-3 sentence overview answering the question directly in simple, reassuring words)\n\n"
            "### 🔍 What Is Happening & Common Causes\n"
            "(Explain the medical reasons, normal ranges/benchmarks, and standard clinical guidelines in simple bullet points with key numbers/criteria in **bold**)\n\n"
            "### 💡 Safe Home Care & Practical Steps\n"
            "(Provide practical, safe self-care actions like hydration, rest, temperature/symptom monitoring, nutrition, and key questions to ask a healthcare provider)\n\n"
            "### ⚠️ Warning Signs (When to See a Doctor Immediately)\n"
            "(Clear bullet points listing red-flag symptoms or urgent indicators that require prompt medical attention)\n\n"
            "### 📖 Medical Terms Made Simple\n"
            "(Explain 1-2 medical terms used above in friendly everyday language)\n\n"
            "Rules:\n"
            "- Never prescribe specific prescription dosages or state a definitive diagnosis.\n"
            "- Keep language crystal-clear, structured, warm, and easy for any patient or family member to understand."
        )

        user_content = (
            f"User Health Question: {query}\n\n"
            f"Retrieved Library Context (use if relevant, otherwise use standard WHO/CDC/MedlinePlus clinical knowledge):\n{context_str if context_str else 'General clinical knowledge query.'}"
        )

        raw_answer = await self.ai_client.generate_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2
        )

        referenced_citations = []
        for c in citations:
            if f"cite-{c.citation_number}" in raw_answer.lower() or f"[cite-{c.citation_number}]" in raw_answer.lower():
                referenced_citations.append(c)

        if referenced_citations and "### 📚 Citations" not in raw_answer:
            # Build targeted markdown for only the referenced citations
            ref_lines = ["\n\n### 📚 Citations & Verified Sources"]
            for c in referenced_citations:
                ref_lines.append(f"- **[cite-{c.citation_number}] {c.title}** ({c.publisher}), Page {c.page_number}* [{c.trust_tier.replace('_', ' ').title()}]*")
                if c.source_url:
                    ref_lines.append(f"  — [Official Source Link]({c.source_url})")
            ref_lines.append("\n---\n*Disclaimer: This assistant provides general healthcare information. Always consult a qualified healthcare provider for personalized medical decisions.*")
            raw_answer = raw_answer.rstrip() + "\n" + "\n".join(ref_lines)
            active_citations = referenced_citations
        elif "cite-" in raw_answer.lower():
            active_citations = citations
        else:
            active_citations = []

        verification = SafetyFilter.verify_output_grounding(
            answer=raw_answer,
            retrieved_contexts=retrieved_passages if active_citations else [],
            category=safety_eval.category
        )

        final_answer = verification["sanitized_answer"]
        has_insufficient_evidence = verification["has_insufficient_evidence"]
        limitations = verification["limitations"]
        follow_ups = self._generate_follow_ups(query, safety_eval.category, retrieved_passages if active_citations else [])

        assistant_msg = Message(
            id=message_id,
            conversation_id=conversation_id,
            role="assistant",
            content=final_answer,
            citations_json=json.dumps([c.model_dump() for c in active_citations]),
            tools_used_json=json.dumps([t.model_dump() for t in tools_executed]),
            escalation_category=safety_eval.category,
            escalation_guidance=safety_eval.guidance_message,
            has_insufficient_evidence=has_insufficient_evidence
        )
        self.db.add(assistant_msg)
        await self.db.commit()

        return ChatResponse(
            conversation_id=conversation_id,
            message_id=message_id,
            query=query,
            answer=final_answer,
            citations=active_citations,
            tools_used=tools_executed,
            escalation_category=safety_eval.category,
            escalation_guidance=safety_eval.guidance_message if safety_eval.category == EscalationCategory.CATEGORY_B.value else None,
            has_insufficient_evidence=has_insufficient_evidence,
            limitations=limitations,
            follow_up_suggestions=follow_ups,
            created_at=created_at
        )

    def _generate_follow_ups(self, query: str, category: str, passages: List[Dict[str, Any]]) -> List[str]:
        suggestions = []
        if category == EscalationCategory.CATEGORY_B.value:
            suggestions.append("What specific questions should I ask my doctor about these symptoms?")
            suggestions.append("What standard diagnostic tests are typically used for this condition?")
        elif passages:
            suggestions.append("Can you explain the key medical terms mentioned here in plain language?")
            suggestions.append("What preventive measures are recommended in official health guidelines?")
            suggestions.append("Summarize the main points from the cited document.")
        else:
            suggestions.append("What documents in the library cover related health topics?")
            suggestions.append("Can I upload a medical report or document to get a structured summary?")
        return suggestions[:3]
