# Veritas RAG — Local Integration & Full-Stack Development Guide

This document outlines the architectural changes, communication fixes, and local-first execution environment implemented for **Veritas-RAG**.

---

## 1. Executive Summary & Objective

The primary goals of this overhaul were:
1. **Local Execution First**: Remove cloud deployment files (`vercel.json`) and configure the stack so that developers can run both backend and frontend locally without external platform dependencies.
2. **Deterministic Frontend-Backend Communication**: Fix the authentication redirect flaw where unauthenticated sessions bypassed the sign-in screen, remove fake offline mock generators, and connect direct live FastAPI handlers.
3. **Resilient Local Database Layer**: Restore the lightweight file-based `MockDatabase` fallback in the FastAPI backend so that the application is immediately operational out-of-the-box even if MongoDB is not running locally.
4. **Clean Code & Strict API Consistency**: Clean all frontend service modules (`src/services/`) of simulated mock data, ensuring 100% of requests go directly to FastAPI.

---

## 2. API Contract & Schema Verification

All endpoints, methods, request bodies, and response models have been verified for exact compatibility:

| Endpoint & Method | Backend Handler & Schemas | Frontend Request & Data Contract | Status |
|---|---|---|:---:|
| `POST /api/auth/register` | `UserCreate(email, username, password)` &rarr; `Token(access_token, user)` | `axios.post('/api/auth/register', { email, username, password })` | Verified |
| `POST /api/auth/login` | `UserLogin(email, password)` &rarr; `Token(access_token, user)` | `axios.post('/api/auth/login', { email, password })` | Verified |
| `GET /api/auth/me` | `get_current_user` &rarr; `UserOut(id, username, email, role, is_active)` | `axios.get('/api/auth/me', { headers: { Authorization: 'Bearer ...' } })` | Verified |
| `GET /api/documents` | `list_documents` &rarr; `list[DocumentResponse]` | `axios.get('/api/documents', { headers: { Authorization: 'Bearer ...' } })` | Verified |
| `POST /api/documents/upload` | `upload_document(UploadFile, chunk_size, chunk_overlap)` &rarr; `DocumentResponse` | `axios.post('/api/documents/upload', formData, { headers: { Authorization: 'Bearer ...', 'Content-Type': 'multipart/form-data' } })` | Verified |
| `DELETE /api/documents/:id` | `delete_document(id)` &rarr; removes Pinecone vectors + metadata | `axios.delete('/api/documents/${id}', { headers: { Authorization: 'Bearer ...' } })` | Verified |
| `POST /api/chat` | `ChatRequest(message, document_id, top_k)` &rarr; `ChatResponse(answer, citations, response_time, evaluation)` | `axios.post('/api/chat', { message, document_id, top_k }, { headers: { Authorization: 'Bearer ...' } })` | Verified |
| `GET /api/admin/analytics` | `get_analytics` (`require_admin`) &rarr; `{ summary, daily_stats, recent_evaluations }` | `axios.get('/api/admin/analytics', { headers: { Authorization: 'Bearer ...' } })` | Verified |
| `GET /api/health` | `health` &rarr; `{ status, environment, backend, version }` | `axios.get('/api/health')` | Verified |

---

## 3. Summary of Changes Executed

### A. Deployment Artifacts Cleanup
- **Deleted `frontend/vercel.json`**: Removed cloud proxy rewrites targeting external Render servers (`https://rag-backend.onrender.com`).
- **Updated `.gitignore`**: Added `local_db/` and `uploads/` to prevent tracking of local database JSON files and temporary document uploads.

### B. Backend Robustness & Local Execution
- **`backend/app/config/settings.py`**: Added sensible default values to all fields in the `Settings` class (e.g., `PORT=8000`, `HOST="0.0.0.0"`, `SECRET_KEY`, `MONGODB_URL="mongodb://localhost:27017"`). The backend can now boot cleanly without raising Pydantic missing-field validation errors if `.env` is absent.
- **`backend/app/database/mongo.py`**: Added automatic fallback to `MockDatabase("local_db")` if a live MongoDB instance is unreachable. All users, documents, and evaluation records are safely persisted locally in `.json` files when running without MongoDB.
- **`backend/app/main.py`**: Health endpoint reports `"healthy (local database)"` when running with the file-based database.
- **`.env.example` Templates**: Created comprehensive `.env.example` files at both project root and in `backend/`.

### C. Frontend Authentication & View Guards
- **`frontend/src/App.jsx`**:
  - **Startup Verification**: On mount, reads `localStorage.getItem('rag_token')` and validates it with `axios.get('/api/auth/me')`. If 401 Unauthorized or missing, storage is cleared and `token` is set to `null`.
  - **View Guards**: While `loading` is true, displays a full-screen spinner. If `!token || !user`, renders `<AuthPage onAuthSuccess={handleAuthSuccess} />`. Unauthenticated users can no longer bypass login.
  - **Direct Live Handlers**: Replaced service abstractions in `App.jsx` with direct `axios` calls that include `Authorization: Bearer ${token}` headers.
  - **Role-Aware Navigation**: Non-admin users are restricted from seeing the Analytics tab in navigation.
- **`frontend/src/components/AuthPage.jsx`**:
  - Removed offline mock token generator.
  - Communicates directly with `/api/auth/login` and `/api/auth/register` via `axios`.
  - Displays actual backend validation errors or informative connection error messages.
- **`frontend/src/services/` (Code Cleanliness)**:
  - Stripped out all mock caches and simulated responses from `apiClient.js`, `authService.js`, `chatService.js`, `documentService.js`, and `adminService.js`.
- **UI Typography & Shell**:
  - Added Google Fonts (`Plus Jakarta Sans` and `Outfit`) to `index.html` and `index.css`.
  - Branded application title as `Enterprise RAG | AI Document Intelligence`.

---

## 4. Local Execution & Step-by-Step Guide

### Step 1: Run Backend
1. In a terminal, navigate to `backend`:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   ```bash
   # Linux / macOS:
   source .venv/bin/activate
   # Windows PowerShell:
   .venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. (Optional) Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY`, `GROQ_API_KEY`, and `PINECONE_API_KEY` to enable live LLM vector retrieval and 4-metric evaluation.
5. Start the FastAPI server:
   ```bash
   python run_server.py
   # or: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend API will be available at `http://localhost:8000` with interactive OpenAPI docs at `http://localhost:8000/docs`.

### Step 2: Run Frontend
1. In a separate terminal, navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web console at `http://localhost:5173`.
   - The Vite proxy automatically routes all `/api/*` requests to `http://127.0.0.1:8000`.

---

## 5. End-to-End Verification Checklist

1. **Unauthenticated Visit**:
   - Open `http://localhost:5173`.
   - Result: Automatically displays the Sign In / Create Account modal. No premature redirects to chat console.
2. **User Registration & Login**:
   - Register a new account (e.g., `analyst@enterprise.ai` / `SecurePassword123`).
   - Result: Account created, JWT token saved to `localStorage`, user profile badge rendered in sidebar.
3. **Document Ingestion**:
   - Upload a text or PDF file via the sidebar dropzone.
   - Result: Ingestion pipeline processes text chunks, saves metadata, and increments the knowledge base chunk count.
4. **Grounded Querying & Multi-Metric Evaluation**:
   - Submit a query in the chat console.
   - Result: Response generated, source citations displayed with similarity scores, and evaluation cards render Faithfulness, Relevance, Precision, and Recall scores.
5. **Admin Analytics Dashboard**:
   - Switch to `/analytics` (for admin accounts).
   - Result: KPI summary cards, SVG latency/faithfulness trend lines, and recent evaluation audit logs display live.
6. **Sign Out**:
   - Click the logout icon in the bottom left of the sidebar.
   - Result: Token cleared, state reset, redirected immediately to `<AuthPage />`.
