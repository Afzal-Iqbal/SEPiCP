from typing import TypedDict, List, Dict, Any

class GraphState(TypedDict, total=False):
    question: str
    chunks: List[Dict[str, Any]]
    max_similarity: float
    refused: bool
    answer: str
    citations: List[Dict[str, Any]]
    suggested_topics: List[str]
    verification_passed: bool
    retry_count: int
    api_key: str
    provider: str
    model_name: str
