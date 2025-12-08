from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from server_py.api.auth import router as auth_router
from server_py.api.patients import router as patients_router
from server_py.api.appointments import router as appointments_router
from server_py.api.lab_results import router as lab_results_router
from server_py.api.departments import router as departments_router
from server_py.api.notifications import router as notifications_router
from server_py.api.nlp import router as nlp_router
from server_py.api.llm import router as llm_router
from server_py.api.hospitals import router as hospitals_router
from server_py.api.staff import router as staff_router
from server_py.api.telemedicine import router as telemedicine_router
from server_py.api.clinical_integrations import router as clinical_integrations_router
from server_py.api.system_admin import router as system_admin_router
from server_py.api.tickets import router as tickets_router
from server_py.api.patient_assignments import router as patient_assignments_router
from server_py.api.department_management import router as department_management_router
from server_py.api.team_management import router as team_management_router
from server_py.api.doctor_notes import router as doctor_notes_router
from server_py.api.ai_clinical_insights import router as ai_clinical_insights_router
from server_py.api.health_chatbot import router as health_chatbot_router
from server_py.api.diary import router as diary_router
from server_py.api.patient_files import router as patient_files_router
from server_py.api.prescriptions import router as prescriptions_router
from server_py.api.subscriptions import router as subscriptions_router
from server_py.api.pharmacy_inventory import router as pharmacy_inventory_router
from server_py.api.billing import router as billing_router
from server_py.api.patient_timeline import router as patient_timeline_router
from server_py.db.session import engine, Base
from server_py.services.storage import StorageService
from server_py.db.session import SessionLocal

app = FastAPI(
    title="Digital Doctors Assistant API",
    description="Healthcare management system with AI-powered features",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "https://tegaconsults-cloud-digital-doctors-assistant-73yjebxwp.vercel.app",  # Your Vercel preview URL
        # "https://tegaconsults-cloud-digital-doctors-assistant.vercel.app",            # Production Vercel URL
        # "https://tegaconsults-cloud-digital-doctors-assistant-4bfl8txqa.vercel.app",  # Another Vercel deployment
        # "http://localhost:5173",              # Local development (Vite)
        # "http://localhost:3000",  
        "https://tegaconsults-cloud-digital-doctors-2ev0.onrender.com",  # ← THIS IS YOUR CURRENT FRONTEND
        "http://localhost:5173",
        "http://localhost:3000"# Local development (alternative)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # Explicit methods including OPTIONS
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
)

app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(appointments_router)
app.include_router(lab_results_router)
app.include_router(departments_router)
app.include_router(notifications_router)
app.include_router(nlp_router)
app.include_router(llm_router)
app.include_router(hospitals_router)
app.include_router(staff_router)
app.include_router(telemedicine_router)
app.include_router(clinical_integrations_router)
app.include_router(system_admin_router)
app.include_router(tickets_router)
app.include_router(patient_assignments_router)
app.include_router(department_management_router)
app.include_router(team_management_router)
app.include_router(doctor_notes_router)
app.include_router(ai_clinical_insights_router)
app.include_router(health_chatbot_router)
app.include_router(diary_router)
app.include_router(patient_files_router)
app.include_router(prescriptions_router)
app.include_router(subscriptions_router)
app.include_router(pharmacy_inventory_router)
app.include_router(billing_router)
app.include_router(patient_timeline_router)

@app.on_event("startup")
async def startup_event():
    print("Starting Digital Doctors Assistant Python Backend...")
    
    # Create all database tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        storage = StorageService(db)
        users = storage.get_all_users()
        
        if len(users) == 0:
            print("Initializing database with seed data...")
            
            storage.create_user({
                "username": "admin",
                "password": "paypass",
                "fullName": "System Administrator",
                "role": "system_admin",
                "is_active": 1
            })
            
            storage.create_user({
                "username": "doctor1",
                "password": "pass123",
                "fullName": "Dr. James Wilson",
                "role": "doctor",
                "is_active": 1
            })
            
            storage.create_user({
                "username": "nurse1",
                "password": "nursepass",
                "fullName": "Nurse Sarah Johnson",
                "role": "nurse",
                "is_active": 1
            })
            
            storage.create_user({
                "username": "patient",
                "password": "paypass",
                "fullName": "John Patient",
                "role": "patient",
                "is_active": 1
            })
            
            print("Database initialized with 4 default users")
        else:
            print(f"Database already initialized with {len(users)} users")
    finally:
        db.close()
    
    print("Python backend started successfully on port 5000")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Digital Doctors Assistant", "version": "2.0.0", "backend": "Python/FastAPI"}

# Serve frontend static files from dist/public
# dist_path = os.path.join(os.path.dirname(__file__), "..", "dist", "public")
# if os.path.exists(dist_path):
#     # Mount static assets (CSS, JS, images)
#     app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
#     # Serve favicon
#     @app.get("/favicon.png")
#     async def favicon():
#         favicon_path = os.path.join(dist_path, "favicon.png")
#         if os.path.exists(favicon_path):
#             return FileResponse(favicon_path)
    
#     # Catch-all route for SPA - must be last
#     @app.get("/{full_path:path}")
#     async def serve_spa(full_path: str):
#         # Don't intercept API routes
#         if full_path.startswith("api/"):
#             return {"error": "Not found"}
        
#         # Try to serve the file if it exists
#         file_path = os.path.join(dist_path, full_path)
#         if os.path.isfile(file_path):
#             return FileResponse(file_path)
        
#         # Otherwise serve index.html for SPA routing
#         index_path = os.path.join(dist_path, "index.html")
#         if os.path.exists(index_path):
#             return FileResponse(index_path)
        
#         return {"error": "Frontend not built"}
# else:
#     print(f"Warning: Frontend dist folder not found at {dist_path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
