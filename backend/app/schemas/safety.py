from pydantic import BaseModel, Field
from typing import List, Optional

class SafetyAssessmentResult(BaseModel):
    category: str = Field(..., description="category_a (Emergency), category_b (Doctor Review), category_c (Informational)")
    is_safe_to_proceed: bool
    requires_immediate_escalation: bool
    escalation_reason: Optional[str] = None
    guidance_message: Optional[str] = None
    emergency_number: Optional[str] = None
    matched_triggers: List[str] = []
    jurisdiction: str = "IN"

class SafetyPolicySummary(BaseModel):
    category_a_description: str
    category_b_description: str
    category_c_description: str
    emergency_contacts: dict
