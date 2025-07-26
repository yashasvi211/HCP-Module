# server/main.py

import os
import mysql.connector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, List
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq

from hcp_agent import run_intelligent_agent

# --- Database and LLM Config ---
db_config = { 'host': 'localhost', 'user': 'root', 'password': '00000000', 'database': 'crm_db' }
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "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")
llm = ChatGroq(model="llama3-8b-8192", temperature=0, api_key=GROQ_API_KEY, timeout=20.0)

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    user_id: int
    text: str
    current_log_id: Optional[int] = None

# --- FastAPI Application ---
app = FastAPI(title="AI-First CRM Backend (With Query)", version="6.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Helper Function ---
def sanitize_data(data_dict: Dict) -> Dict:
    return {k: ("NA" if v is None or v == "" else v) for k, v in data_dict.items()}

# --- API Endpoint ---
@app.post("/api/v1/chat")
def handle_chat(request: ChatRequest):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        chat_history = []
        if request.current_log_id:
            cursor.execute("SELECT raw_text FROM interaction_logs WHERE id = %s", (request.current_log_id,))
            if log_entry := cursor.fetchone():
                chat_history.append(HumanMessage(content=log_entry['raw_text']))
        
        agent_result = run_intelligent_agent(request.text, chat_history)
        intent = agent_result.get("intent")
        
        # --- Logic for QUERY Intent ---
        if intent == "query":
            print("--- Action: Querying database ---")
            sql_query = agent_result.get("sql_query")
            if not sql_query:
                raise HTTPException(status_code=400, detail="AI failed to generate a database query.")
            
            cursor.execute(sql_query)
            db_results = cursor.fetchall()
            
            summary_prompt = f"""
            Based on the following data from the database, please provide a friendly, natural language answer to the user's original question.
            
            Original Question: "{request.text}"
            Database Results: {db_results}
            
            Answer:
            """
            ai_message = llm.invoke(summary_prompt).content
            
            conn.close()
            return { "message": "Query successful!", "ai_message": ai_message }

        # --- Logic for LOG and EDIT Intents (Delete and Re-create) ---
        elif intent in ["log", "edit"]:
            full_conversation_text = f"{chat_history[0].content if chat_history else ''}\n\n{request.text}"
            
            log_details = agent_result.get("log_details") or agent_result.get("edit_details")
            if not log_details:
                 # This case can happen if the edit node fails to extract details
                 raise HTTPException(status_code=400, detail="AI could not extract details for the log/edit operation.")

            sanitized_data = sanitize_data(log_details)

            cursor.execute("INSERT INTO interaction_logs (user_id, raw_text) VALUES (%s, %s)", (request.user_id, full_conversation_text))
            new_log_id = cursor.lastrowid
            
            insert_query = """
                INSERT INTO extracted_data (log_id, hcp_name, interaction_type, sentiment, topics_discussed, outcomes, follow_up_actions, materials_shared, samples_distributed)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                new_log_id, sanitized_data.get('hcp_name'), sanitized_data.get('interaction_type'),
                sanitized_data.get('sentiment'), sanitized_data.get('topics_discussed'), sanitized_data.get('outcomes'),
                sanitized_data.get('follow_up_actions'), sanitized_data.get('materials_shared'), sanitized_data.get('samples_distributed')
            ))

            if request.current_log_id:
                cursor.execute("DELETE FROM extracted_data WHERE log_id = %s", (request.current_log_id,))
                cursor.execute("DELETE FROM interaction_logs WHERE id = %s", (request.current_log_id,))

            cursor.execute("SELECT * FROM extracted_data WHERE log_id = %s", (new_log_id,))
            final_data = cursor.fetchone()
            
            conn.commit()
            cursor.close()
            conn.close()

            if not final_data:
                 raise HTTPException(status_code=404, detail="Could not find the interaction record after processing.")

            return { "message": "Action completed!", "log_id": new_log_id, "data_sent_to_db": final_data }
        
        # **FIXED**: Added an else block to handle the 'unknown' intent gracefully.
        else:
            conn.close()
            raise HTTPException(status_code=400, detail="Could not understand request. Please try rephrasing as a detailed log, an edit command, or a question.")

    except Exception as e:
        print(f"--- ❌ ERROR: {e} ---")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {e}")
