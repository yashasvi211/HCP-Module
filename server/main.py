import mysql.connector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

# --- Database Configuration ---
# IMPORTANT: Replace with your actual MySQL credentials
db_config = {
    'host': 'localhost',
    'user': 'root', # <-- CHANGE THIS
    'password': '00000000', # <-- CHANGE THIS
    'database': 'crm_db'
}

# --- Pydantic Models ---
class InteractionLogRequest(BaseModel):
    user_id: int
    text: str

class ExtractedDataUpdateRequest(BaseModel):
    hcpName: str
    interactionType: str
    sentiment: str
    topicsDiscussed: str
    outcomes: str
    followUpActions: str
    materialsShared: str
    samplesDistributed: str

# --- FastAPI Application ---
app = FastAPI(
    title="AI-First CRM Backend",
    description="API for logging and updating HCP interactions.",
    version="1.2.0"
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Simulation Function (MODIFIED) ---
def simulate_ai_extraction(text: str) -> dict:
    """
    MODIFIED: This function now ignores the input text and returns a
    consistent set of dummy data for reliable frontend testing.
    """
    print(f"Received text (now ignored): {text}")
    
    dummy_data = {
        'hcp_name': "Dr. Evelyn Reed",
        'interaction_type': "Scheduled Meeting",
        'sentiment': "Positive",
        'topics_discussed': "Discussed the positive outcomes of the recent Phase 3 trial for 'CardiaCure'. Addressed questions about long-term efficacy.",
        'outcomes': "Dr. Reed is impressed with the data and will consider 'CardiaCure' for her next 3-5 suitable patients.",
        'follow_up_actions': "Send the full clinical trial PDF by EOD Monday. Schedule a follow-up lunch meeting for next month.",
        'materials_shared': "CardiaCure Phase 3 Trial Brochure",
        'samples_distributed': "CardiaCure Starter Pack (3 units)"
    }
    
    return dummy_data


# --- API Endpoints ---
@app.post("/api/v1/log_interaction")
def log_interaction(request: InteractionLogRequest):
    """
    Receives interaction text, saves it, gets dummy extracted data,
    and saves the extracted data.
    """
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Step 1: Save the raw log
        insert_log_query = "INSERT INTO interaction_logs (user_id, raw_text) VALUES (%s, %s)"
        cursor.execute(insert_log_query, (request.user_id, request.text))
        log_id = cursor.lastrowid

        # Step 2: Get the dummy structured data
        extracted_data = simulate_ai_extraction(request.text)

        # Step 3: Save the extracted data
        insert_extracted_query = """
            INSERT INTO extracted_data
            (log_id, hcp_name, interaction_type, sentiment, topics_discussed, outcomes, follow_up_actions, materials_shared, samples_distributed)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_extracted_query, (
            log_id,
            extracted_data['hcp_name'],
            extracted_data['interaction_type'],
            extracted_data['sentiment'],
            extracted_data['topics_discussed'],
            extracted_data['outcomes'],
            extracted_data['follow_up_actions'],
            extracted_data['materials_shared'],
            extracted_data['samples_distributed']
        ))

        conn.commit()
        cursor.close()
        conn.close()

        # Return the log_id along with the data so the frontend knows which record to update
        return {
            "message": "Interaction logged successfully!",
            "log_id": log_id,
            "data_sent_to_db": extracted_data
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
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        update_query = """
            UPDATE extracted_data SET
                hcp_name = %s,
                interaction_type = %s,
                sentiment = %s,
                topics_discussed = %s,
                outcomes = %s,
                follow_up_actions = %s,
                materials_shared = %s,
                samples_distributed = %s
            WHERE log_id = %s
        """
        cursor.execute(update_query, (
            request.hcpName,
            request.interactionType,
            request.sentiment,
            request.topicsDiscussed,
            request.outcomes,
            request.followUpActions,
            request.materialsShared,
            request.samplesDistributed,
            log_id
        ))
        
        # Check if any row was actually updated
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