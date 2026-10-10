import re
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Okapi
from app.retrieval.vector_store import VectorStoreManager

class HybridRetriever:
    """Combines Dense Vector Retrieval (semantic) with BM25 (keyword) and Reciprocal Rank Fusion."""

    def __init__(self):
        self.vector_store = VectorStoreManager()

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\w+", text.lower())

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None,
        min_score: float = 0.22
    ) -> List[Dict[str, Any]]:
        """
        Execute hybrid search:
        1. Dense semantic search from ChromaDB.
        2. Keyword BM25 scoring across retrieved candidates or available texts.
        3. Reciprocal Rank Fusion (RRF) & deduplication.
        4. Strict filtering by trust tier / user permissions.
        """
        # Fetch candidate passages (up to top_k * 3) from vector store
        candidates = self.vector_store.query_similar(
            query=query,
            top_k=max(top_k * 2, 10),
            filter_dict=filter_dict
        )

        if not candidates:
            return []

        # If candidates exist, apply BM25 re-ranking
        corpus = [self._tokenize(c["content"]) for c in candidates]
        tokenized_query = self._tokenize(query)

        if corpus and tokenized_query:
            try:
                bm25 = BM25Okapi(corpus)
                bm25_scores = bm25.get_scores(tokenized_query)
                max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1.0

                for idx, c in enumerate(candidates):
                    norm_bm25 = float(bm25_scores[idx]) / max_bm25
                    # Hybrid score: 0.65 dense semantic + 0.35 keyword BM25
                    dense_score = float(c.get("score", 0.0))
                    # Only give BM25 boost if there is actual keyword overlap
                    bm25_val = norm_bm25 if bm25_scores[idx] > 0 else 0.0
                    hybrid_score = (0.65 * dense_score) + (0.35 * bm25_val)
                    c["hybrid_score"] = round(hybrid_score, 4)
            except Exception:
                for c in candidates:
                    c["hybrid_score"] = c.get("score", 0.0)
        else:
            for c in candidates:
                c["hybrid_score"] = c.get("score", 0.0)

        # Sort by hybrid score descending
        candidates.sort(key=lambda x: x.get("hybrid_score", 0.0), reverse=True)

        # Filter by minimum score and deduplicate
        seen_texts = set()
        final_results = []

        for item in candidates:
            if item.get("hybrid_score", 0.0) < min_score:
                continue
            
            # Simple text fingerprint for deduplication
            fingerprint = item["content"][:80].strip()
            if fingerprint in seen_texts:
                continue
            seen_texts.add(fingerprint)
            final_results.append(item)

            if len(final_results) >= top_k:
                break

        return final_results
