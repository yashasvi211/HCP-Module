# server/main.py

import mysql.connector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict

# Import the LangGraph agent function from our other file
from hcp_agent import run_extraction_agent, ExtractedHCPInteraction

# --- Database Configuration ---
db_config = {
    'host': 'localhost',
    'user': 'root', 
    'password': '00000000', 
    'database': 'crm_db'
}

# --- Pydantic Models for API requests ---
class InteractionLogRequest(BaseModel):
    user_id: int
    text: str

class ExtractedDataUpdateRequest(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    sentiment: Optional[str] = None
    topics_discussed: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None

# --- FastAPI Application ---
app = FastAPI(
    title="AI-First CRM Backend (Live)",
    description="API using a LangGraph agent to log and update HCP interactions.",
    version="2.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Function to handle empty fields ---
# This function ensures any empty or null values are replaced with "NA".
def sanitize_data(data_dict: Dict) -> Dict:
    """Iterates through a dictionary and replaces None or empty strings with 'NA'."""
    sanitized = {}
    for key, value in data_dict.items():
        if value is None or (isinstance(value, str) and not value.strip()):
            sanitized[key] = "NA"
        else:
            sanitized[key] = value
    return sanitized

# --- API Endpoints ---
@app.post("/api/v1/log_interaction")
def log_interaction(request: InteractionLogRequest):
    """
    Receives interaction text, runs the LangGraph agent to extract data,
    and saves both the raw log and the extracted data to the database.
    """
    try:
        # Step 1: Run the LangGraph agent to get structured data.
        extracted_data_model = run_extraction_agent(request.text)
        extracted_data_dict = extracted_data_model.model_dump()
        
        # Step 2: Sanitize the extracted data before saving.
        sanitized_data = sanitize_data(extracted_data_dict)

        # Step 3: Connect to the database and save everything.
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Save the raw log
        insert_log_query = "INSERT INTO interaction_logs (user_id, raw_text) VALUES (%s, %s)"
        cursor.execute(insert_log_query, (request.user_id, request.text))
        log_id = cursor.lastrowid

        # Save the sanitized extracted data
        insert_extracted_query = """
            INSERT INTO extracted_data
            (log_id, hcp_name, interaction_type, sentiment, topics_discussed, outcomes, follow_up_actions, materials_shared, samples_distributed)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_extracted_query, (
            log_id,
            sanitized_data['hcp_name'],
            sanitized_data.get('interaction_type', 'Meeting'),
            sanitized_data['sentiment'],
            sanitized_data['topics_discussed'],
            sanitized_data['outcomes'],
            sanitized_data['follow_up_actions'],
            sanitized_data['materials_shared'],
            sanitized_data['samples_distributed']
        ))

        conn.commit()
        cursor.close()
        conn.close()

        # Return the original extracted data to the frontend (before sanitization)
        return {
            "message": "Interaction logged successfully!",
            "log_id": log_id,
            "data_sent_to_db": extracted_data_dict
        }

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {e}")


@app.put("/api/v1/update_interaction/{log_id}")
def update_interaction(log_id: int, request: ExtractedDataUpdateRequest):
    """
    Updates an existing interaction record in the extracted_data table.
    """
    try:
        # Sanitize the incoming request data before updating.
        update_data_dict = request.model_dump()
        sanitized_data = sanitize_data(update_data_dict)

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        update_query = """
            UPDATE extracted_data SET
                hcp_name = %s, interaction_type = %s, sentiment = %s,
                topics_discussed = %s, outcomes = %s, follow_up_actions = %s,
                materials_shared = %s, samples_distributed = %s
            WHERE log_id = %s
        """
        cursor.execute(update_query, (
            sanitized_data['hcp_name'],
            sanitized_data['interaction_type'],
            sanitized_data['sentiment'],
            sanitized_data['topics_discussed'],
            sanitized_data['outcomes'],
            sanitized_data['follow_up_actions'],
            sanitized_data['materials_shared'],
            sanitized_data['samples_distributed'],
            log_id
        ))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"No interaction found with log_id: {log_id}")

        conn.commit()
        cursor.close()
        conn.close()

        return {"message": f"Interaction {log_id} updated successfully!"}

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {e}")
