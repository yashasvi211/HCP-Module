import os
from typing import TypedDict, Optional, Literal, List
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END

# --- Environment Setup ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
if GROQ_API_KEY == "your_groq_api_key_here":
    print("⚠️ WARNING: GROQ_API_KEY not found in environment. Using placeholder.")

# --- Pydantic Models for Structured Output ---

class RouteQuery(BaseModel):
    """
    Categorize the user's query based on its content.
    - If the query describes a meeting, call, or interaction with a person (e.g., 'Met with Dr. Smith...'), classify it as 'log'.
    - If the query gives a command to change, update, or modify a previous entry (e.g., 'change the name to...', 'update the sentiment...'), classify it as 'edit'.
    - Otherwise, classify as 'unknown'.
    """
    intent: Literal["log", "edit", "unknown"] = Field(
        description="The user's intent. Must be one of: 'log', 'edit', or 'unknown'."
    )

class HcpInteraction(BaseModel):
    """
    Use this tool to extract structured details from a user's log entry.
    This tool is best for longer, descriptive sentences that narrate an entire interaction.
    DO NOT use this for short commands like 'change the name'.
    """
    hcp_name: Optional[str] = Field(description="The full name of the Healthcare Professional mentioned.")
    interaction_type: Optional[str] = Field(description="The type of interaction, e.g., 'Call', 'Meeting', 'Email'.")
    sentiment: Optional[str] = Field(description="The inferred sentiment of the interaction.")
    topics_discussed: Optional[str] = Field(description="A summary of the main topics discussed.")
    materials_shared: Optional[str] = Field(description="Any materials, like brochures or studies, that were shared.")
    samples_distributed: Optional[str] = Field(description="Any product samples that were distributed.")
    outcomes: Optional[str] = Field(description="Key outcomes or agreements from the interaction.")
    follow_up_actions: Optional[str] = Field(description="Specific follow-up actions that were mentioned.")

class EditInstruction(BaseModel):
    """
    Use this tool for short, direct commands that modify a single piece of information from a previous interaction.
    This is best for requests like 'change the name to...' or 'update the sentiment'.
    DO NOT use this for long, descriptive logs.
    """
    field_to_update: str = Field(description="The specific database field to modify, e.g., 'hcp_name', 'sentiment'.")
    new_value: str = Field(description="The new value to set for the specified field.")

# --- Graph State Definition ---
class AgentState(TypedDict):
    raw_text: str
    chat_history: List[BaseMessage]
    intent: Literal["log", "edit", "unknown"]
    log_details: Optional[dict]
    edit_details: Optional[dict]

# --- LLM Initialization ---
llm = ChatGroq(
    model="llama3-8b-8192",
    temperature=0,
    api_key=GROQ_API_KEY,
    timeout=20.0
)

# --- Graph Nodes ---
def router_node(state: AgentState) -> dict:
    """Determines the user's intent using the full conversation history."""
    print("--- 🧠 Router: Determining user intent with context... ---")
    router_llm = llm.with_structured_output(RouteQuery)
    messages = state["chat_history"] + [("human", state["raw_text"])]
    route = router_llm.invoke(messages)
    print(f"--- Intent determined: {route.intent} ---")
    return {"intent": route.intent}

def extraction_node(state: AgentState) -> dict:
    """Extracts structured data for a new log entry, now with context."""
    print("--- 🔬 Extractor: Extracting details for new log... ---")
    extractor_llm = llm.with_structured_output(HcpInteraction)
    messages = state["chat_history"] + [("human", state["raw_text"])]
    details = extractor_llm.invoke(messages)
    return {"log_details": details.dict()}

def edit_node(state: AgentState) -> dict:
    """Extracts edit instructions from the user's query using context."""
    print("--- ✍️ Editor: Extracting edit instructions... ---")
    editor_llm = llm.with_structured_output(EditInstruction)
    messages = state["chat_history"] + [("human", state["raw_text"])]
    details = editor_llm.invoke(messages)
    return {"edit_details": details.dict()}

# --- Graph Definition ---
def _create_agent_app():
    workflow = StateGraph(AgentState)
    workflow.add_node("router", router_node)
    workflow.add_node("extractor", extraction_node)
    workflow.add_node("editor", edit_node)
    workflow.set_entry_point("router")

    def decide_next_step(state: AgentState):
        if state["intent"] == "log":
            return "extractor"
        elif state["intent"] == "edit":
            return "editor"
        else:
            return END

    workflow.add_conditional_edges("router", decide_next_step, {
        "extractor": "extractor",
        "editor": "editor"
    })
    
    workflow.add_edge("extractor", END)
    workflow.add_edge("editor", END)

    return workflow.compile()

_agent_app = _create_agent_app()

def run_intelligent_agent(raw_text: str, chat_history: List = []) -> AgentState:
    """The main function our server calls, now accepting chat history."""
    inputs = {"raw_text": raw_text, "chat_history": chat_history}
    final_state = _agent_app.invoke(inputs)
    return final_state