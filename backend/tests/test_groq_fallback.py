from app.agents.groq_client import GroqClientWrapper


def test_local_fallback_uses_retrieved_passages():
    client = GroqClientWrapper()
    client._client = None
    answer = client._local_grounded_fallback([
        {
            "role": "user",
            "content": (
                "User Question: What is the WHO fasting glucose cutoff for diabetes?\n\n"
                "Retrieved Evidence from Knowledge Base:\n"
                "[Passage 1 | Source: WHO Diabetes | Page: 1 | Publisher: WHO]\n"
                "Fasting Plasma Glucose (FPG) >= 126 mg/dL (7.0 mmol/L) after an 8-hour fast."
            )
        }
    ])
    assert "126 mg/dL" in answer
    assert "Healthcare Information Summary" not in answer


def test_local_fallback_summarizes_document_excerpt():
    client = GroqClientWrapper()
    client._client = None
    answer = client._local_grounded_fallback([
        {
            "role": "user",
            "content": (
                "Provide a detailed clinical summary.\n\nDocument Excerpt:\n"
                "Limit daily sodium chloride (salt) intake to less than 5 grams per day. "
                "DASH Diet is rich in fruits, vegetables, and low-fat dairy."
            )
        }
    ])
    assert "5 grams" in answer
    assert "DASH" in answer
