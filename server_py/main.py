from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from server_py.api.auth import router as auth_router
from server_py.api.patients import router as patients_router
from server_py.api.appointments import router as appointments_router
from server_py.api.lab_results import router as lab_results_router
from server_py.api.departments import router as departments_router
from server_py.api.notifications import router as notifications_router
from server_py.api.nlp import router as nlp_router
from server_py.api.llm import router as llm_router
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(appointments_router)
app.include_router(lab_results_router)
app.include_router(departments_router)
app.include_router(notifications_router)
app.include_router(nlp_router)
app.include_router(llm_router)

@app.on_event("startup")
async def startup_event():
    print("Starting Digital Doctors Assistant Python Backend...")
    
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
                "role": "admin",
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

dist_path = os.path.join(os.path.dirname(__file__), "..", "dist", "public")
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return {"error": "Not found"}
        
        index_path = os.path.join(dist_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend not built"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
