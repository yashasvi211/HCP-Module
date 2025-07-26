# server/hcp_agent.py

import os
from typing import Optional
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field

# --- Environment Setup ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "your-grock-api")

# --- Pydantic Models ---
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

class SqlQuery(BaseModel):
    """A valid MySQL query that can be executed on the database."""
    query: str = Field(description="A complete, executable MySQL query.")

# --- LLM Initialization ---
llm = ChatGroq(model="llama3-8b-8192", temperature=0, api_key=GROQ_API_KEY, timeout=20.0)

# --- Agent Functions ---

def run_extraction(text: str) -> HcpInteraction:
    """
    A dedicated function that ONLY extracts data from text. No routing.
    """
    print("--- 🔬 Running Extraction ---")
    extractor_llm = llm.with_structured_output(HcpInteraction)
    return extractor_llm.invoke(text)

def run_query_planner(question: str) -> str:
    """
    A dedicated function that ONLY generates SQL queries from a question.
    """
    print("--- 🗺️ Running Query Planner ---")
    prompt = f"""
    You are a MySQL expert. Given the database schema below and a user question, generate a valid MySQL query to answer it.
    Only query the `extracted_data` table. Do not query other tables.

    Schema:
    CREATE TABLE extracted_data (
      `id` int NOT NULL AUTO_INCREMENT, `log_id` int NOT NULL, `hcp_name` varchar(255), `interaction_type` varchar(100),
      `sentiment` varchar(50), `topics_discussed` text, `outcomes` text, `follow_up_actions` text,
      `materials_shared` text, `samples_distributed` text, `created_at` timestamp
    );

    User Question: {question}
    Respond ONLY with the SQL query.
    """
    sql_generator_llm = llm.with_structured_output(SqlQuery)
    result = sql_generator_llm.invoke(prompt)
    print(f"--- Generated SQL: {result.query} ---")
    return result.query
