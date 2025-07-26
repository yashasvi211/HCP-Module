# server/hcp_agent.py

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
    - If the query is a detailed description of a meeting, call, or interaction with a person (e.g., 'Met with Dr. Smith...'), it is a 'log'.
    - If the query is a short, direct command to change, update, or modify a previous entry (e.g., 'change the name to...', 'update the sentiment...'), it is an 'edit'.
    - If the query asks a question about past data (e.g., 'who', 'what', 'when'), it is a 'query'.
    - Otherwise, classify as 'unknown'.
    """
    intent: Literal["log", "edit", "query", "unknown"] = Field(
        description="The user's intent. Must be one of: 'log', 'edit', 'query', or 'unknown'."
    )

class HcpInteraction(BaseModel):
    """Extracts structured details from a user's log entry."""
    hcp_name: Optional[str] = Field(description="The full name of the Healthcare Professional mentioned.")
    interaction_type: Optional[str] = Field(description="The type of interaction, e.g., 'Call', 'Meeting', 'Email'.")
    sentiment: Optional[str] = Field(description="The inferred sentiment of the interaction.")
    topics_discussed: Optional[str] = Field(description="A summary of the main topics discussed.")
    materials_shared: Optional[str] = Field(description="Any materials, like brochures or studies, that were shared.")
    samples_distributed: Optional[str] = Field(description="Any product samples that were distributed.")
    outcomes: Optional[str] = Field(description="Key outcomes or agreements from the interaction.")
    follow_up_actions: Optional[str] = Field(description="Specific follow-up actions that were mentioned.")


class EditInstruction(BaseModel):
    """Instruction to edit a specific field of a previously logged interaction."""
    field_to_update: str = Field(description="The specific database field to modify, e.g., 'hcp_name', 'sentiment'.")
    new_value: str = Field(description="The new value to set for the specified field.")

class SqlQuery(BaseModel):
    """A valid MySQL query that can be executed on the database."""
    query: str = Field(description="A complete, executable MySQL query.")

# --- Graph State Definition ---
class AgentState(TypedDict):
    raw_text: str
    chat_history: List[BaseMessage]
    intent: Literal["log", "edit", "query", "unknown"]
    log_details: Optional[dict]
    edit_details: Optional[dict]
    sql_query: Optional[str]

# --- LLM Initialization ---
llm = ChatGroq(model="llama3-8b-8192", temperature=0, api_key=GROQ_API_KEY, timeout=20.0)

# --- Graph Nodes ---

def router_node(state: AgentState) -> dict:
    """Determines the user's intent."""
    print("--- 🧠 Router: Determining user intent... ---")
    router_llm = llm.with_structured_output(RouteQuery)
    messages = state["chat_history"] + [("human", state["raw_text"])]
    route = router_llm.invoke(messages)
    print(f"--- Intent determined: {route.intent} ---")
    return {"intent": route.intent}

def extraction_node(state: AgentState) -> dict:
    """Extracts structured data for a new log entry."""
    print("--- 🔬 Extractor: Extracting details for new log... ---")
    extractor_llm = llm.with_structured_output(HcpInteraction)
    # **FIXED**: Use the full conversation history for extraction to ensure context is always used.
    messages = state["chat_history"] + [("human", state["raw_text"])]
    details = extractor_llm.invoke(messages)
    return {"log_details": details.dict()}

def edit_node(state: AgentState) -> dict:
    """Extracts edit instructions from the user's query."""
    print("--- ✍️ Editor: Extracting edit instructions... ---")
    editor_llm = llm.with_structured_output(EditInstruction)
    messages = state["chat_history"] + [("human", state["raw_text"])]
    details = editor_llm.invoke(messages)
    return {"edit_details": details.dict()}

def query_planner_node(state: AgentState) -> dict:
    """Generates a SQL query to answer the user's question."""
    print("--- 🗺️ Planner: Generating SQL query... ---")
    
    prompt = f"""
    You are a MySQL expert. Given the database schema below and a user question, generate a valid MySQL query to answer it.
    Only query the `extracted_data` table. Do not query other tables.

    Schema:
    CREATE TABLE extracted_data (
      `id` int NOT NULL AUTO_INCREMENT,
      `log_id` int NOT NULL,
      `hcp_name` varchar(255) DEFAULT NULL,
      `interaction_type` varchar(100) DEFAULT NULL,
      `sentiment` varchar(50) DEFAULT NULL,
      `topics_discussed` text,
      `outcomes` text,
      `follow_up_actions` text,
      `materials_shared` text,
      `samples_distributed` text,
      `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    );

    User Question: {state['raw_text']}
    
    Respond ONLY with the SQL query.
    """
    sql_generator_llm = llm.with_structured_output(SqlQuery)
    result = sql_generator_llm.invoke(prompt)
    print(f"--- Generated SQL: {result.query} ---")
    return {"sql_query": result.query}

# --- Graph Definition ---
def _create_agent_app():
    workflow = StateGraph(AgentState)
    workflow.add_node("router", router_node)
    workflow.add_node("extractor", extraction_node)
    workflow.add_node("editor", edit_node)
    workflow.add_node("planner", query_planner_node)
    
    workflow.set_entry_point("router")

    def decide_next_step(state: AgentState):
        """Determines the next node based on the intent."""
        return state.get("intent", "unknown")

    workflow.add_conditional_edges(
        "router",
        decide_next_step,
        {
            "log": "extractor",
            "edit": "editor",
            "query": "planner",
            "unknown": END, 
        }
    )
    
    workflow.add_edge("extractor", END)
    workflow.add_edge("editor", END)
    workflow.add_edge("planner", END)

    return workflow.compile()

_agent_app = _create_agent_app()

def run_intelligent_agent(raw_text: str, chat_history: List = []) -> AgentState:
    """The main function our server calls."""
    inputs = {"raw_text": raw_text, "chat_history": chat_history}
    final_state = _agent_app.invoke(inputs)
    return final_state
