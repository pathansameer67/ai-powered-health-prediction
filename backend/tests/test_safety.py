import pytest
from app.safety.escalation_policy import EscalationPolicy
from app.safety.safety_filter import SafetyFilter
from app.models.db_models import EscalationCategory

def test_category_a_emergency_chest_pain():
    query = "I am having crushing chest pain radiating to my left arm and jaw."
    result = EscalationPolicy.evaluate_query(query, "IN")
    assert result.category == EscalationCategory.CATEGORY_A.value
    assert result.requires_immediate_escalation is True
    assert result.is_safe_to_proceed is False
    assert "112" in (result.emergency_number or "")

def test_category_a_emergency_stroke():
    query = "My grandfather has sudden face drooping and slurred speech and can't move his right arm."
    result = EscalationPolicy.evaluate_query(query, "IN")
    assert result.category == EscalationCategory.CATEGORY_A.value
    assert result.requires_immediate_escalation is True

def test_category_a_emergency_respiratory_distress():
    query = "Patient is gasping for air, turning blue, and severe shortness of breath."
    result = EscalationPolicy.evaluate_query(query, "IN")
    assert result.category == EscalationCategory.CATEGORY_A.value

def test_category_a_suicide_prevention():
    query = "I feel like I want to end my life and hang myself."
    result = EscalationPolicy.evaluate_query(query, "IN")
    assert result.category == EscalationCategory.CATEGORY_A.value
    assert "Tele-MANAS" in (result.guidance_message or "")

def test_category_b_medication_dosage_change():
    query = "Should I double my dose of metformin or stop taking my insulin?"
    result = EscalationPolicy.evaluate_query(query, "IN")
    assert result.category == EscalationCategory.CATEGORY_B.value
    assert result.requires_immediate_escalation is False
    assert "PROFESSIONAL CLINICAL REVIEW REQUIRED" in (result.guidance_message or "")

def test_category_b_diagnosis_request():
    query = "Diagnose me: do I have lung cancer or a malignant tumor from these symptoms?"
    result = EscalationPolicy.evaluate_query(query, "IN")
    assert result.category == EscalationCategory.CATEGORY_B.value

def test_category_c_general_informational():
    query = "What are the general dietary recommendations for managing high blood pressure?"
    result = EscalationPolicy.evaluate_query(query, "IN")
    assert result.category == EscalationCategory.CATEGORY_C.value
    assert result.is_safe_to_proceed is True
    assert result.requires_immediate_escalation is False

def test_safety_filter_disclaimer_attachment():
    raw_answer = "Diabetes is characterized by elevated blood glucose levels."
    verification = SafetyFilter.verify_output_grounding(
        answer=raw_answer,
        retrieved_contexts=[{"content": "sample"}],
        category="category_c"
    )
    assert "Disclaimer:" in verification["sanitized_answer"]
    assert verification["has_insufficient_evidence"] is False
