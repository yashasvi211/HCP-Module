# server/hcp_agent.py

import os
from typing import TypedDict, Optional
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END

# --- Environment Setup ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "get-your-own-api-ke")
if GROQ_API_KEY == "your_groq_api_key_here":
    print("⚠️ WARNING: GROQ_API_KEY not found in environment. Using placeholder.")

# 1. Define the Pydantic model for the data structure we want to extract.
class ExtractedHCPInteraction(BaseModel):
    """Represents the structured data extracted from a user's log entry."""
    hcp_name: str = Field(description="The full name of the Healthcare Professional mentioned.")
    interaction_type: str = Field(description="The type of interaction, e.g., 'Call', 'Meeting', 'Email'.")
    sentiment: str = Field(description="The inferred sentiment of the interaction (e.g., 'Positive', 'Neutral', 'Negative').")
    topics_discussed: str = Field(description="A brief summary of the main topics discussed during the interaction.")
    materials_shared: Optional[str] = Field(description="Any materials, like brochures or studies, that were shared.")
    samples_distributed: Optional[str] = Field(description="Any product samples that were distributed.")
    outcomes: Optional[str] = Field(description="Key outcomes or agreements from the interaction.")
    follow_up_actions: Optional[str] = Field(description="Specific follow-up actions that were mentioned.")

# 2. Define the state for the LangGraph application.
class AgentState(TypedDict):
    raw_text: str
    extracted_data: Optional[ExtractedHCPInteraction]

# 3. Initialize the Groq LLM with a timeout.
# **ADDED**: The `timeout` parameter will cause an error if the LLM call takes longer than 30 seconds.
llm = ChatGroq(
    model="gemma2-9b-it", 
    temperature=0, 
    api_key=GROQ_API_KEY,
    timeout=30.0 
)
structured_llm = llm.with_structured_output(ExtractedHCPInteraction)

# 4. Define the graph's main node.
def extraction_node(state: AgentState) -> dict:
    """
    Takes the raw text from the state and uses the structured LLM
    to extract the required information.
    """
    print("--- 🧠 Calling Groq LLM for data extraction (max 30s) ---")
    raw_text = state["raw_text"]
    try:
        extracted_data = structured_llm.invoke(raw_text)
        print("--- ✅ Groq LLM call complete ---")
        return {"extracted_data": extracted_data}
    except Exception as e:
        print(f"--- ❌ ERROR during LLM call: {e} ---")
        # Return an empty model or raise an exception to be caught by FastAPI
        raise e

# 5. Compile the graph into a runnable application.
def _create_agent_app():
    workflow = StateGraph(AgentState)
    workflow.add_node("extractor", extraction_node)
    workflow.set_entry_point("extractor")
    workflow.add_edge("extractor", END)
    return workflow.compile()

_agent_app = _create_agent_app()

# 6. Define the main function that our FastAPI server will call.
def run_extraction_agent(raw_text: str) -> ExtractedHCPInteraction:
    """
    Invokes the LangGraph agent with the user's raw text and
    returns the final, structured Pydantic object.
    """
    inputs = {"raw_text": raw_text}
    final_state = _agent_app.invoke(inputs)
    return final_state["extracted_data"]
