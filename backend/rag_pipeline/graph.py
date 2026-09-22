from langgraph.graph import StateGraph, END
from rag_pipeline.state import GraphState
from rag_pipeline.nodes import (
    retrieve_node, refuse_node, rerank_node, generate_node, verify_node,
    gate_router, verify_router
)

builder = StateGraph(GraphState)
builder.add_node("retrieve", retrieve_node)
builder.add_node("refuse", refuse_node)
builder.add_node("rerank", rerank_node)
builder.add_node("generate", generate_node)
builder.add_node("verify", verify_node)

builder.set_entry_point("retrieve")
builder.add_conditional_edges("retrieve", gate_router, {"refuse": "refuse", "rerank": "rerank"})
builder.add_edge("rerank", "generate")
builder.add_edge("generate", "verify")
builder.add_conditional_edges("verify", verify_router, {"regenerate": "generate", "end": END})
builder.add_edge("refuse", END)

graph = builder.compile()
