# server/main.py

import os
import mysql.connector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, List

# Import the dedicated agent functions
from hcp_agent import run_extraction, run_query_planner, llm

# --- Database and LLM Config ---
db_config = { 'host': 'localhost', 'user': 'root', 'password': '00000000', 'database': 'crm_db' }

# --- Pydantic Models ---
class AiRequest(BaseModel):
    user_id: int
    text: str

class ManualSaveRequest(BaseModel):
    user_id: int
    log_id: Optional[int] = None
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    sentiment: Optional[str] = None
    topics_discussed: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None

# --- FastAPI Application ---
app = FastAPI(title="AI-First CRM Backend (Refactored)", version="7.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Helper Function ---
def sanitize_data(data_dict: Dict) -> Dict:
    return {k: ("NA" if v is None or v == "" else v) for k, v in data_dict.items()}

# --- API Endpoints ---

@app.post("/api/v1/fill_form_with_ai")
def fill_form_with_ai(request: AiRequest):
    """
    Endpoint dedicated to extracting data and creating a new log entry.
    """
    try:
        extracted_data_model = run_extraction(request.text)
        extracted_data_dict = extracted_data_model.model_dump()
        sanitized_data = sanitize_data(extracted_data_dict)

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("INSERT INTO interaction_logs (user_id, raw_text) VALUES (%s, %s)", (request.user_id, request.text))
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

        cursor.execute("SELECT * FROM extracted_data WHERE log_id = %s", (new_log_id,))
        final_data = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()

        return { "message": "Extraction successful!", "log_id": new_log_id, "data_sent_to_db": final_data }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred during extraction: {e}")


@app.post("/api/v1/chat_with_ai")
def chat_with_ai(request: AiRequest):
    """
    Endpoint dedicated to answering questions based on database context.
    """
    try:
        sql_query = run_query_planner(request.text)
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql_query)
        db_results = cursor.fetchall()
        conn.close()

        summary_prompt = f"""
        Based on the following data from the database, please provide a friendly, natural language answer to the user's original question.
        Original Question: "{request.text}"
        Database Results: {db_results}
        Answer:
        """
        ai_message = llm.invoke(summary_prompt).content
        
        return { "message": "Query successful!", "ai_message": ai_message }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred during chat: {e}")


@app.post("/api/v1/save_manual")
def save_manual_interaction(request: ManualSaveRequest):
    """
    Creates or updates an interaction record based on manual form input.
    """
    try:
        data_to_save = request.model_dump(exclude={'user_id', 'log_id'})
        sanitized_data = sanitize_data(data_to_save)
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        log_id = request.log_id
        
        if log_id:
            update_query = """
                UPDATE extracted_data SET
                hcp_name=%s, interaction_type=%s, sentiment=%s, topics_discussed=%s, outcomes=%s, 
                follow_up_actions=%s, materials_shared=%s, samples_distributed=%s
                WHERE log_id = %s
            """
            cursor.execute(update_query, (*sanitized_data.values(), log_id))
        else:
            raw_text_create = "Manual form creation"
            cursor.execute("INSERT INTO interaction_logs (user_id, raw_text) VALUES (%s, %s)", (request.user_id, raw_text_create))
            log_id = cursor.lastrowid
            insert_query = """
                INSERT INTO extracted_data (log_id, hcp_name, interaction_type, sentiment, topics_discussed, outcomes, follow_up_actions, materials_shared, samples_distributed)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (log_id, *sanitized_data.values()))

        cursor.execute("SELECT * FROM extracted_data WHERE log_id = %s", (log_id,))
        final_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()

        return { "message": "Save successful!", "log_id": log_id, "data_sent_to_db": final_data }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save manual interaction: {e}")
