from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
import json
import os

# --- IMPORTING LOCAL AI MODULES ---
from preprocessor import preprocessor
from classifier import classifier
from priority_engine import priority_engine

# --- INITIALIZE FASTAPI ---
app = FastAPI(title="Bharat JanSetu AI Microservice", version="2.0.0")

# Enable CORS for Node.js Backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS & LOGGING ---
class AnalyzeRequest(BaseModel):
    complaint_text: str = Field(..., min_length=5, description="The raw grievance text")
    complaint_id: str = Field(..., description="Unique ticket ID from MongoDB")

# In-Memory Log for Low-Confidence Predictions (Admin Review)
# Note: For long-term production, this would be moved to MongoDB or a file.
low_confidence_store = []

# --- PIPELINE LOGIC (AUTO-RESPONSE) ---
def draft_personalized_response(dept: str, priority: str, ticket_id: str):
    """Generates a contextual response based on AI findings."""
    responses = {
        "CRITICAL": f"URGENT: Your grievance #{ticket_id[-6:].upper()} has been prioritized for immediate action by the {dept} department. Field officers have been alerted via emergency channel.",
        "HIGH": f"Official Update: Your complaint #{ticket_id[-6:].upper()} is assigned to the {dept} department. Our team is treating this as a high-priority health/safety concern.",
        "MEDIUM": f"Official Update: Grievance #{ticket_id[-6:].upper()} is currently being reviewed by the {dept} division for scheduled resolution.",
        "LOW": f"System Acknowledgment: Your report #{ticket_id[-6:].upper()} for {dept} has been successfully logged. An official will be assigned shortly."
    }
    return responses.get(priority, f"Acknowledge receipt of ticket #{ticket_id[-6:].upper()} for {dept}.")

# --- ENDPOINTS ---
@app.get("/health")
async def health_check():
    """Returns the service status and model load state."""
    return {
        "status": "online",
        "service": "Bharat JanSetu AI",
        "load_time": datetime.now().isoformat(),
        "is_spacy_loaded": classifier.is_spacy_loaded
    }

@app.post("/api/analyze")
async def analyze_grievance(req: AnalyzeRequest):
    """Main pipeline endpoint."""
    try:
        # 1. Error Pre-Check
        if not req.complaint_text.strip():
            raise HTTPException(status_code=400, detail="Empty text provided.")

        # 2. Preprocess (Cleaning & Normalization)
        clean_txt = preprocessor.clean_text(req.complaint_text)

        # 3. Classify (Hybrid Mapping)
        class_res = classifier.classify(clean_txt)

        # 4. Determine Priority (Risk Assessment)
        prio_res = priority_engine.determine_priority(clean_txt, class_res["department"])

        # 5. Generate Response Draft
        auto_draft = draft_personalized_response(class_res["department"], prio_res["priority_level"], req.complaint_id)

        # 6. Logging Low Confusion (Admin Visibility)
        if class_res["low_confidence"]:
            low_confidence_store.append({
                "complaint_id": req.complaint_id,
                "raw_text": req.complaint_text,
                "clean_text": clean_txt,
                "ai_dept": class_res["department"],
                "confidence": class_res["confidence_score"],
                "timestamp": datetime.now().isoformat()
            })
            # Keep log size manageable in memory
            if len(low_confidence_store) > 1000:
                low_confidence_store.pop(0)

        # Final Payload to Node.js Backend
        return {
            "department": class_res["department"],
            "priority": prio_res["priority_level"],
            "priority_reason": prio_res["reason"],
            "confidence_score": class_res["confidence_score"],
            "method": class_res["method_used"],
            "auto_response_draft": auto_draft,
            "low_confidence": class_res["low_confidence"]
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"🚨 Pipeline Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Grievance analysis failed internally.")

@app.get("/api/low-confidence-log")
async def get_low_confidence_cases():
    """Admin endpoint to see cases where human intervention is recommended."""
    return {
        "count": len(low_confidence_store),
        "logs": low_confidence_store[::-1] # Newest first
    }

class ResponseDraftRequest(BaseModel):
    title: str
    description: str
    department: str

@app.post("/api/generate-response")
async def generate_manual_draft(req: ResponseDraftRequest):
    """Handle manual draft requests from Official Dashboard."""
    # We'll use 'HIGH' as a default priority for manual drafts unless otherwise specified
    draft = draft_personalized_response(req.department, "HIGH", "TICKET_REF")
    return {"draft": draft}

# --- SERVER START ---
if __name__ == "__main__":
    import uvicorn
    # In production, uvicorn is managed by a process manager (PM2/Systemd)
    uvicorn.run(app, host="0.0.0.0", port=8000)
