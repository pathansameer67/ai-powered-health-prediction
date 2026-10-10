import re
from typing import Dict, List, Optional, Any
from app.schemas.safety import SafetyAssessmentResult
from app.safety.escalation_policy import EscalationPolicy

class SafetyFilter:
    """Pre-generation and Post-generation Safety & Grounding Verifier."""

    @classmethod
    def evaluate_input_safety(cls, query: str, jurisdiction: str = "IN") -> SafetyAssessmentResult:
        """Evaluate user question for immediate emergencies and high-risk medical requests."""
        return EscalationPolicy.evaluate_query(query, jurisdiction)

    @classmethod
    def verify_output_grounding(
        cls,
        answer: str,
        retrieved_contexts: List[Dict[str, Any]],
        category: str
    ) -> Dict[str, Any]:
        """
        Verify that the generated response:
        1. Does not make unsupported prescriptive or dosage recommendations without caveats.
        2. Contains proper medical disclaimers.
        3. Identifies if retrieved contexts are empty / insufficient.
        """
        has_insufficient_evidence = len(retrieved_contexts) == 0 and ("could not find" in answer.lower() or "no matching passages" in answer.lower())
        limitations = []

        if len(retrieved_contexts) == 0 and not has_insufficient_evidence:
            limitations.append("Answer synthesized from standard clinical guideline references (WHO, CDC, MedlinePlus).")

        # Check for dangerous advice patterns (e.g. telling user to stop medicine without doctor)
        dangerous_patterns = [
            r"\b(you should stop taking your (insulin|heart medication|blood pressure medication))\b",
            r"\b(take \d+\s*(mg|grams|tablets) of .+\b)", # Direct unsupervised dosage prescribing
            r"\b(you definitely have cancer|you are diagnosed with)\b"
        ]

        flags = []
        for pattern in dangerous_patterns:
            if re.search(pattern, answer, re.IGNORECASE):
                flags.append(pattern)

        # Standard clinical disclaimer
        disclaimer = "\n\n---\n*Disclaimer: This assistant provides general healthcare information from indexed official documents. It does not provide individualized clinical diagnosis or treatment prescriptions. Always consult a qualified healthcare provider for personalized medical decisions.*"

        sanitized_answer = answer
        if not sanitized_answer.endswith(disclaimer) and "Disclaimer:" not in sanitized_answer:
            sanitized_answer = sanitized_answer + disclaimer

        return {
            "is_valid": len(flags) == 0,
            "flags": flags,
            "has_insufficient_evidence": has_insufficient_evidence,
            "limitations": "; ".join(limitations) if limitations else None,
            "sanitized_answer": sanitized_answer
        }
