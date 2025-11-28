# Python ML Microservice Integration Guide

## Architecture
- **Node.js Frontend + API** (Render Service 1)
- **Python ML Service** (Render Service 2)

## Local Development

### 1. Install Python dependencies
```bash
pip install fastapi uvicorn pydantic sqlalchemy requests
```

### 2. Run Python ML Service (Terminal 1)
```bash
python ml_service.py
```
- Runs on port 8001 by default
- Endpoints:
  - POST `/health-analysis` - Analyze patient vitals
  - POST `/lab-analysis` - Analyze lab results
  - GET `/health` - Health check

### 3. Run Node.js App (Terminal 2)
```bash
npm run dev
```
- Runs on port 5000

## Integration Points

### Node.js calls Python service:

**Health Analysis:**
```javascript
// Node.js route sends patient vitals to Python
POST /api/patients/:id/health-analysis
→ Calls Python: POST http://localhost:8001/health-analysis
→ Returns health assessment with diagnosis & drugs
```

**Lab Analysis:**
```javascript
// Node.js route sends lab data to Python
POST /api/lab-results
→ Calls Python: POST http://localhost:8001/lab-analysis
→ Stores result with automated analysis
```

## Production Deployment (Render)

### Deploy Node.js Service
1. Language: Node
2. Build: `npm run build`
3. Start: `npm run start`
4. Add env var: `ML_SERVICE_URL=https://your-python-service.onrender.com`

### Deploy Python Service (Separate)
1. Create new Web Service on Render
2. Language: Python
3. Build: `pip install -r requirements.txt`
4. Start: `python ml_service.py`
5. Port: 8001

### Environment Variables (Python Service)
- `ML_SERVICE_PORT=8001`
- `DATABASE_URL` (if needed for future features)

## Next Steps

1. Update `server/routes.ts` to call Python service:
```typescript
// Change from:
const healthAssessment = MLHealthService.assessPatientHealth(patient);

// To:
const response = await fetch(`${process.env.ML_SERVICE_URL}/health-analysis`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(patientData)
});
const healthAssessment = await response.json();
```

2. Set `ML_SERVICE_URL` environment variable in Render

3. Deploy both services separately
