import re
from typing import Dict, List, Tuple, Optional
from app.models.db_models import EscalationCategory
from app.schemas.safety import SafetyAssessmentResult
from app.core.config import settings

# Structured Clinical Triggers for Category A (Emergency)
EMERGENCY_TRIGGERS: List[Dict[str, any]] = [
    {
        "pattern": r"\b(chest\s+pain|crushing\s+(chest\s+)?pain|pain\s+radiating\s+to\s+(the\s+)?(left\s+)?(arm|jaw|back)|heart\s+attack|myocardial\s+infarction)\b",
        "description": "Suspected Acute Coronary Syndrome / Heart Attack",
        "keywords": ["chest pain", "heart attack"]
    },
    {
        "pattern": r"\b(can'?t\s+breathe|cannot\s+breathe|severe\s+(shortness\s+of\s+breath|dyspnea|breathlessness)|gasping\s+for\s+air|turning\s+blue|choking|asphyxiation)\b",
        "description": "Acute Respiratory Distress / Severe Airway Obstruction",
        "keywords": ["severe shortness of breath", "choking", "cannot breathe"]
    },
    {
        "pattern": r"\b(face\s+drooping|arm\s+weakness|slurred\s+speech|sudden\s+numbness|stroke|transient\s+ischemic\s+attack|tia)\b",
        "description": "Suspected Acute Stroke (FAST signs)",
        "keywords": ["face drooping", "slurred speech", "stroke"]
    },
    {
        "pattern": r"\b(kill\s+myself|suicide|end\s+my\s+life|want\s+to\s+die|hang\s+myself|slit\s+(my\s+)?(wrists|throat)|overdose\s+on\s+pills\s+intentionally)\b",
        "description": "Immediate Self-Harm / Crisis Intervention",
        "keywords": ["suicide", "self-harm"]
    },
    {
        "pattern": r"\b(unconscious|passed\s+out|loss\s+of\s+consciousness|fainted\s+and\s+not\s+waking\s+up|unresponsive)\b",
        "description": "Loss of Consciousness / Unresponsive Patient",
        "keywords": ["unconscious", "unresponsive"]
    },
    {
        "pattern": r"\b(uncontrolled\s+bleeding|gushing\s+blood|arterial\s+bleed|severe\s+hemorrhage|coughing\s+up\s+large\s+amounts\s+of\s+blood)\b",
        "description": "Severe Hemorrhage / Uncontrolled Bleeding",
        "keywords": ["uncontrolled bleeding", "gushing blood"]
    },
    {
        "pattern": r"\b(pesticide|poison|bleach|snake\s+bite|scorpion\s+sting|toxic\s+chemical|ingested\s+chemical|drank\s+chemical)\b",
        "description": "Acute Poisoning / Toxic Ingestion / Venomous Bite",
        "keywords": ["poison", "snake bite", "toxic ingestion", "pesticide"]
    },
    {
        "pattern": r"\b(anaphylaxis|throat\s+swelling|severe\s+allergic\s+reaction|tongue\s+swollen\s+cannot\s+swallow)\b",
        "description": "Acute Anaphylactic Shock",
        "keywords": ["anaphylaxis", "throat swelling"]
    }
]

# Structured Clinical Triggers for Category B (Professional Review Required)
PROFESSIONAL_REVIEW_TRIGGERS: List[Dict[str, any]] = [
    {
        "pattern": r"\b(should\s+i\s+(stop\s+taking|change\s+my\s+dose|double\s+my\s+dose|replace\s+my\s+medication)|how\s+many\s+mg\s+should\s+i\s+take|prescribe\s+me|prescribe\s+medication)\b",
        "description": "Medication Dosage or Prescription Adjustment",
        "keywords": ["dose change", "prescription change"]
    },
    {
        "pattern": r"\b(diagnose\s+me|do\s+i\s+have\s+(cancer|tumor|diabetes|hypertension|covid|hiv)|is\s+this\s+a\s+tumor|interpret\s+my\s+(mri|ct\s+scan|biopsy|blood\s+report|ecg|lab\s+result)|what\s+disease\s+do\s+i\s+have)\b",
        "description": "Individual Clinical Diagnosis or Diagnostic Imaging/Lab Interpretation",
        "keywords": ["diagnosis request", "lab interpretation"]
    },
    {
        "pattern": r"\b(pregnant.*(bleeding|cramps|fever)|pregnancy.*(bleeding|pain|complication)|(infant|newborn|baby).*(high\s+fever|lethargy|refusing\s+to\s+drink))\b",
        "description": "High-Risk Obstetric or Pediatric Clinical Symptoms",
        "keywords": ["pregnancy bleeding", "infant high fever"]
    },
    {
        "pattern": r"\b(severe\s+adverse\s+reaction|severe\s+side\s+effect|rash\s+spreading\s+all\s+over|liver\s+enzymes\s+elevated|toxic\s+reaction)\b",
        "description": "Suspected Adverse Drug Reaction / Organ Toxicity",
        "keywords": ["adverse reaction", "drug toxicity"]
    },
    {
        "pattern": r"\b(my\s+symptoms\s+are\s+getting\s+worse|worsening\s+pain|lump\s+getting\s+bigger)\b",
        "description": "Progressive or Worsening Chronic Symptoms",
        "keywords": ["worsening symptoms", "growing lump"]
    }
]

EMERGENCY_CONTACTS: Dict[str, Dict[str, str]] = {
    "IN": {
        "emergency": "112 (National Emergency Helpline)",
        "ambulance": "108 / 102",
        "suicide_helpline": "Tele-MANAS: 14416 / 1800-891-4416 / Kiran: 1800-599-0019",
        "poison_center": "National Poisons Information Centre (AIIMS): 1800-116-117"
    },
    "US": {
        "emergency": "911 (Emergency Services)",
        "ambulance": "911",
        "suicide_helpline": "988 Suicide & Crisis Lifeline",
        "poison_center": "Poison Control: 1-800-222-1222"
    },
    "UK": {
        "emergency": "999 (Emergency) / 111 (NHS Urgent Advice)",
        "ambulance": "999",
        "suicide_helpline": "Samaritans: 116 123",
        "poison_center": "NHS 111"
    },
    "Global": {
        "emergency": "Local emergency services (112 / 911)",
        "ambulance": "Local hospital emergency room",
        "suicide_helpline": "Befrienders Worldwide (befrienders.org)",
        "poison_center": "Local hospital emergency department"
    }
}

class EscalationPolicy:
    """Multi-tiered Healthcare Safety & Escalation Policy Engine."""

    @staticmethod
    def get_emergency_info(jurisdiction: str = "IN") -> Dict[str, str]:
        return EMERGENCY_CONTACTS.get(jurisdiction.upper(), EMERGENCY_CONTACTS["IN"])

    @staticmethod
    def evaluate_query(query: str, jurisdiction: str = "IN") -> SafetyAssessmentResult:
        query_clean = query.lower().strip()
        matched_triggers: List[str] = []

        # 1. First Tier: Immediate Emergency Check (Category A)
        for trigger in EMERGENCY_TRIGGERS:
            if re.search(trigger["pattern"], query_clean, re.IGNORECASE):
                matched_triggers.append(trigger["description"])

        if matched_triggers:
            contacts = EscalationPolicy.get_emergency_info(jurisdiction)
            is_self_harm = any("Self-Harm" in t for t in matched_triggers)
            
            if is_self_harm:
                guidance = (
                    f"CRITICAL SAFETY ADVISORY: If you or someone you know is in immediate distress or having thoughts of self-harm, "
                    f"please reach out immediately. In India, call Tele-MANAS at 14416 or Kiran at 1800-599-0019 (toll-free, 24/7). "
                    f"For immediate physical danger, call national emergency at {contacts['emergency']}."
                )
            else:
                guidance = (
                    f"POTENTIAL MEDICAL EMERGENCY DETECTED: The symptoms described ({', '.join(matched_triggers)}) "
                    f"require urgent medical evaluation. Please contact emergency services immediately ({contacts['emergency']}) "
                    f"or go to the nearest emergency department / hospital. Do not rely on an AI assistant for emergency care."
                )

            return SafetyAssessmentResult(
                category=EscalationCategory.CATEGORY_A.value,
                is_safe_to_proceed=False,
                requires_immediate_escalation=True,
                escalation_reason=f"Matched Emergency Indicator: {'; '.join(matched_triggers)}",
                guidance_message=guidance,
                emergency_number=contacts["emergency"],
                matched_triggers=matched_triggers,
                jurisdiction=jurisdiction
            )

        # 2. Second Tier: Professional Review Check (Category B)
        for trigger in PROFESSIONAL_REVIEW_TRIGGERS:
            if re.search(trigger["pattern"], query_clean, re.IGNORECASE):
                matched_triggers.append(trigger["description"])

        if matched_triggers:
            guidance = (
                "PROFESSIONAL CLINICAL REVIEW REQUIRED: This query involves individual clinical judgment, diagnostic interpretation, "
                "or medication adjustment. While general medical information from authorized healthcare documents is provided below, "
                "you must consult a licensed physician or specialist before making medical decisions or changing treatment."
            )
            return SafetyAssessmentResult(
                category=EscalationCategory.CATEGORY_B.value,
                is_safe_to_proceed=True,
                requires_immediate_escalation=False,
                escalation_reason=f"Requires Clinical Assessment: {'; '.join(matched_triggers)}",
                guidance_message=guidance,
                matched_triggers=matched_triggers,
                jurisdiction=jurisdiction
            )

        # 3. Third Tier: General Information (Category C)
        return SafetyAssessmentResult(
            category=EscalationCategory.CATEGORY_C.value,
            is_safe_to_proceed=True,
            requires_immediate_escalation=False,
            escalation_reason=None,
            guidance_message="General Educational Health Information. Not a substitute for professional clinical advice.",
            matched_triggers=[],
            jurisdiction=jurisdiction
        )
