from typing import List, Dict, Any

# Tool declarations conforming to standard LLM Function / Tool Calling specs
GROQ_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "search_health_documents",
            "description": "Search indexed trustworthy healthcare documents and medical literature using hybrid semantic and keyword search.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The medical or health search query to retrieve evidence for."
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Number of relevant passages to retrieve (default 4)."
                    },
                    "trust_tier": {
                        "type": "string",
                        "enum": ["trusted_knowledge", "private_upload"],
                        "description": "Optional filter for trusted knowledge vs user uploaded files."
                    },
                    "document_id": {
                        "type": "string",
                        "description": "Optional document ID to restrict search within a single document."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "explain_medical_term",
            "description": "Retrieve authoritative explanation of a clinical or medical term in plain language.",
            "parameters": {
                "type": "object",
                "properties": {
                    "term": {
                        "type": "string",
                        "description": "The medical term or abbreviation to explain."
                    },
                    "context": {
                        "type": "string",
                        "description": "Optional sentence or context where the term appeared."
                    }
                },
                "required": ["term"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_sources",
            "description": "Compare retrieved evidence from two or more healthcare documents on a specific topic or condition.",
            "parameters": {
                "type": "object",
                "properties": {
                    "document_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of document IDs to compare."
                    },
                    "topic": {
                        "type": "string",
                        "description": "The specific health topic or question to compare across sources."
                    }
                },
                "required": ["document_ids", "topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "assess_escalation",
            "description": "Assess if a user's health query indicates an urgent clinical emergency or requires immediate professional review.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The health query to evaluate for emergency and risk status."
                    }
                },
                "required": ["query"]
            }
        }
    }
]
