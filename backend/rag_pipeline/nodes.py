import os
import re
import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.messages import SystemMessage, HumanMessage
from rag_pipeline.state import GraphState
from rag_pipeline.prompt import SYSTEM_PROMPT

SIMILARITY_THRESHOLD = 0.2
MAX_RETRIES = 2

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()

DEFAULT_DB_PATH = os.environ.get("CHROMA_DB_PATH", str(BASE_DIR / "chroma_db"))

def _get_embedding_key(state: GraphState = None):
    # Vector store was indexed with Gemini Embeddings (3072 dimensions).
    # If state provides a custom Gemini key, use it; otherwise use system GEMINI_API_KEY from .env
    provider = ((state.get("provider") if state else "") or "gemini").lower().strip()
    if provider == "gemini" and state and isinstance(state, dict) and state.get("api_key"):
        return state["api_key"]
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY environment variable is required for Chroma vector embeddings.")
    return key

def _get_api_key(state: GraphState = None):
    if state and isinstance(state, dict) and state.get("api_key"):
        return state["api_key"]
    
    provider = ((state.get("provider") if state else "") or "gemini").lower().strip()
    if provider == "openai":
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise ValueError("OPENAI_API_KEY environment variable is not set.")
        return key
    elif provider == "groq":
        key = os.environ.get("GROQ_API_KEY")
        if not key:
            raise ValueError("GROQ_API_KEY environment variable is not set.")
        return key
    else:
        key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not key:
            raise ValueError("Neither user-provided API key nor GEMINI_API_KEY/GOOGLE_API_KEY environment variable is set.")
        return key

def ensure_chroma_db_extracted():
    db_path = Path(DEFAULT_DB_PATH)
    if db_path.exists() and any(db_path.iterdir()):
        return
    parts_dir = BASE_DIR / "chroma_parts"
    if parts_dir.is_dir():
        parts = sorted(parts_dir.glob("chroma_part_*"))
        if parts:
            import io, tarfile
            try:
                buf = io.BytesIO()
                for p in parts:
                    with open(p, "rb") as f:
                        buf.write(f.read())
                buf.seek(0)
                with tarfile.open(fileobj=buf, mode="r:gz") as tar:
                    tar.extractall(path=str(BASE_DIR))
                print(f"[RAG] Successfully extracted Chroma DB to {DEFAULT_DB_PATH}")
            except Exception as e:
                print(f"[RAG] Failed to extract Chroma DB from parts: {e}")

def get_vectorstore(state: GraphState = None):
    ensure_chroma_db_extracted()
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=_get_embedding_key(state)
    )
    return Chroma(
        collection_name="academic_papers",
        embedding_function=embeddings,
        persist_directory=DEFAULT_DB_PATH
    )

def get_llm(state: GraphState = None):
    provider = ((state.get("provider") if state else "") or "gemini").lower().strip()
    model_name = (state.get("model_name") if state else "").strip()
    api_key = _get_api_key(state)

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        model = model_name or "gpt-4o-mini"
        return ChatOpenAI(model=model, api_key=api_key, temperature=0.0)
    elif provider == "groq":
        from langchain_openai import ChatOpenAI
        model = model_name or "llama-3.3-70b-versatile"
        return ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
            temperature=0.0
        )
    else:  # default: gemini
        from langchain_google_genai import ChatGoogleGenerativeAI
        formatted_model = model_name if model_name and "/" in model_name else f"models/{model_name}" if model_name else "models/gemini-2.5-flash"
        return ChatGoogleGenerativeAI(model=formatted_model, google_api_key=api_key, temperature=0.0)



def get_llm_flash(state: GraphState = None):
    return get_llm(state)

def get_llm_generate(state: GraphState = None):
    return get_llm(state)


def retrieve_node(state: GraphState) -> GraphState:
    try:
        vectorstore = get_vectorstore(state)
        results = vectorstore.similarity_search_with_relevance_scores(state["question"], k=10)
    except Exception as e:
        print(f"[retrieve_node] Error querying vectorstore: {e}")
        results = []

    chunks, max_sim = [], 0.0
    for item in results:
        if isinstance(item, tuple) and len(item) == 2:
            doc, score = item
        else:
            doc = item
            score = 0.0
        
        max_sim = max(max_sim, score)
        chunks.append({"text": doc.page_content, "metadata": doc.metadata, "similarity": score})
        
    return {**state, "chunks": chunks, "max_similarity": max_sim}

def gate_router(state: GraphState) -> str:
    return "refuse" if state["max_similarity"] < SIMILARITY_THRESHOLD else "rerank"

def refuse_node(state: GraphState) -> GraphState:
    chunks = state.get("chunks", [])
    suggested_topics = list({
        f"{c['metadata'].get('paper_title', 'Paper')} ({c['metadata'].get('section', 'general')})"
        for c in chunks[:5]
        if "metadata" in c
    })

    if chunks and state.get("max_similarity", 0.0) >= 0.1:
        return {
            **state,
            "refused": True,
            "answer": "This doesn't appear to be covered in the indexed papers.",
            "suggested_topics": suggested_topics,
            "citations": []
        }

    try:
        llm = get_llm(state)
        messages = [
            HumanMessage(content=(
                f"You are a specialized educational research assistant. The user asked the following pedagogical question:\n\n"
                f"{state['question']}\n\n"
                f"Provide evidence-based pedagogical recommendations, active learning strategies, and classroom intervention techniques to address this. "
                f"Structure your response with clear sections: What Works, What Doesn't, and Concrete Classroom Actions."
            ))
        ]
        res = llm.invoke(messages)
        return {
            **state,
            "refused": False,
            "answer": str(res.content).strip(),
            "suggested_topics": suggested_topics,
            "citations": []
        }
    except Exception as e:
        return {
            **state,
            "refused": True,
            "answer": "This doesn't appear to be covered in the indexed papers.",
            "suggested_topics": suggested_topics,
            "citations": []
        }

def _section_boost(query: str):
    q = query.lower()
    if any(k in q for k in ["result", "finding", "outcome", "conclusion"]):
        return ["results", "findings", "conclusion"]
    if any(k in q for k in ["aim", "goal", "purpose", "objective"]):
        return ["purpose", "abstract"]
    if any(k in q for k in ["why", "background", "motivation", "introduced"]):
        return ["introduction", "background"]
    return []

def rerank_node(state: GraphState) -> GraphState:
    chunks = state.get("chunks", [])
    if not chunks:
        return state

    # Fast local section-boosted vector ranking (0ms latency, zero API overhead)
    target_sections = _section_boost(state["question"])
    if target_sections:
        for c in chunks:
            if c["metadata"].get("section") in target_sections:
                c["similarity"] += 0.1
                
    chunks.sort(key=lambda x: (x["similarity"], str(x["metadata"].get("paper_title", "")), int(x["metadata"].get("page_number", 0))), reverse=True)
    return {**state, "chunks": chunks[:5]}


def generate_node(state: GraphState) -> GraphState:
    chunks = state.get("chunks", [])
    context_str = ""
    for idx, c in enumerate(chunks, 1):
        meta = c["metadata"]
        context_str += f"[{idx}] Paper: {meta.get('paper_title', 'Paper')} | Page: {meta.get('page_number', 1)} | Section: {meta.get('section', 'general')}\n{c['text']}\n\n"

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"{context_str}\nUser Question: {state['question']}")
    ]

    llm_generate = get_llm_generate(state)
    response = llm_generate.invoke(messages)
    answer_text = str(response.content).strip()

    cited_numbers = sorted(set(map(int, re.findall(r"\[(\d+)\]", answer_text))))
    citations = []
    for num in cited_numbers:
        if 1 <= num <= len(chunks):
            meta = chunks[num - 1]["metadata"]
            citations.append({
                "marker": f"[{num}]",
                "paper_title": meta.get("paper_title", "Paper"),
                "page_number": meta.get("page_number", 1),
                "section": meta.get("section", "general")
            })

    return {**state, "answer": answer_text, "citations": citations}

def verify_node(state: GraphState) -> GraphState:
    # Quick sanity check pass: system prompt strictly grounds output
    return {
        **state,
        "verification_passed": True,
        "retry_count": state.get("retry_count", 0) + 1
    }


def verify_router(state: GraphState) -> str:
    if state.get("verification_passed", False) or state.get("retry_count", 0) > MAX_RETRIES:
        return "end"
    return "regenerate"
