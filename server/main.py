# server/main.py

import mysql.connector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, List
from langchain_core.messages import AIMessage, HumanMessage

from hcp_agent import run_intelligent_agent

# --- Database Configuration ---
db_config = {
    'host': 'localhost',
    'user': 'root', 
    'password': '00000000', 
    'database': 'crm_db'
}

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    user_id: int
    text: str
    current_log_id: Optional[int] = None

# --- FastAPI Application ---
app = FastAPI(
    title="AI-First CRM Backend (Stateful)",
    description="API using a LangGraph agent to log AND edit HCP interactions.",
    version="4.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Function ---
def sanitize_data(data_dict: Dict) -> Dict:
    """Replaces None or empty strings with 'NA'."""
    return {k: ("NA" if v is None or v == "" else v) for k, v in data_dict.items()}

# --- API Endpoint ---
@app.post("/api/v1/chat")
def handle_chat(request: ChatRequest):
    """
    Receives user text, provides conversation context to the agent,
    and performs the correct database action.
    """
    print(f"\n--- 🚀 Received chat request for log_id: {request.current_log_id} ---")
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        chat_history = []
        if request.current_log_id:
            print(f"--- Fetching history for log_id: {request.current_log_id} ---")
            cursor.execute("SELECT raw_text FROM interaction_logs WHERE id = %s", (request.current_log_id,))
            log_entry = cursor.fetchone()
            if log_entry:
                chat_history.append(HumanMessage(content=log_entry['raw_text']))
        
        agent_result = run_intelligent_agent(request.text, chat_history)
        intent = agent_result.get("intent")

        log_id_to_return = request.current_log_id
        
        if intent == "log":
            print("--- Action: Inserting new log into database ---")
            log_details = agent_result.get("log_details", {})
            sanitized_data = sanitize_data(log_details)
            cursor.execute("INSERT INTO interaction_logs (user_id, raw_text) VALUES (%s, %s)", (request.user_id, request.text))
            log_id_to_return = cursor.lastrowid
            
            insert_query = """
                INSERT INTO extracted_data (log_id, hcp_name, interaction_type, sentiment, topics_discussed, outcomes, follow_up_actions, materials_shared, samples_distributed)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                log_id_to_return, sanitized_data.get('hcp_name'), sanitized_data.get('interaction_type'),
                sanitized_data.get('sentiment'), sanitized_data.get('topics_discussed'), sanitized_data.get('outcomes'),
                sanitized_data.get('follow_up_actions'), sanitized_data.get('materials_shared'), sanitized_data.get('samples_distributed')
            ))
        
        elif intent == "edit":
            if not log_id_to_return:
                raise HTTPException(status_code=400, detail="Cannot edit. Please start a new interaction first.")

            print(f"--- Action: Updating existing log (id: {log_id_to_return}) ---")
            edit_details = agent_result.get("edit_details", {})
            field = edit_details.get("field_to_update")
            value = edit_details.get("new_value")

            if not field or value is None:
                raise HTTPException(status_code=400, detail="AI failed to determine what to edit.")
            
            cursor.execute("UPDATE interaction_logs SET raw_text = CONCAT(raw_text, %s) WHERE id = %s", (f"\n\nEDIT: {request.text}", log_id_to_return))
            
            update_query = f"UPDATE extracted_data SET {field} = %s WHERE log_id = %s"
            cursor.execute(update_query, (value, log_id_to_return))

        else:
            raise HTTPException(status_code=400, detail="Could not understand request. Please try rephrasing as a detailed log or a direct edit command (e.g., 'change name to...').")

        print(f"--- Fetching final state for log_id: {log_id_to_return} ---")
        cursor.execute("SELECT * FROM extracted_data WHERE log_id = %s", (log_id_to_return,))
        final_data = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()

        if not final_data:
             raise HTTPException(status_code=404, detail="Could not find the interaction record after processing.")

        return {
            "message": "Action completed successfully!",
            "log_id": log_id_to_return,
            "data_sent_to_db": final_data
        }

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {e}")
