import contextlib
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.mongodb import MongoDBSaver
from app.config import settings

from pymongo import MongoClient

_mongo_client = None
_checkpointer = None

@contextlib.asynccontextmanager
async def get_compiled_graph():
    global _mongo_client, _checkpointer
    if _mongo_client is None:
        # Use serverSelectionTimeoutMS to fail fast if unreachable at cold start
        _mongo_client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=10000)
        _checkpointer = MongoDBSaver(_mongo_client)
    
    yield build_graph().compile(checkpointer=_checkpointer)
from app.graph.state import TravelState
from app.graph.nodes.llm_node import llm_node
from app.graph.nodes.tools_node import tools_node
from app.graph.nodes.memory_node import memory_node
from app.config import settings

def should_continue(state: TravelState):
    if state.get("pending_tool_calls"):
        return "tools_node"
    return "memory_node"

def build_graph():
    workflow = StateGraph(TravelState)
    
    workflow.add_node("llm_node", llm_node)
    workflow.add_node("tools_node", tools_node)
    workflow.add_node("memory_node", memory_node)
    
    workflow.set_entry_point("llm_node")
    
    workflow.add_conditional_edges(
        "llm_node",
        should_continue,
        {
            "tools_node": "tools_node",
            "memory_node": "memory_node"
        }
    )
    
    workflow.add_edge("tools_node", "llm_node")
    workflow.add_edge("memory_node", END)
    
    return workflow


