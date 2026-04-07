# Veritas RAG — Enterprise Frontend Console

The frontend console for **Veritas-RAG**, providing a responsive, enterprise-grade retrieval-augmented generation (RAG) workspace with real-time vector grounding and a strict 4-metric evaluation layer.

Built with **React 19**, **Vite 8**, and **Tailwind CSS 4**.

---

## Features

- **JWT Authentication & Session Management**: Clean sign-in and sign-up with client-side form validation, role-based badge rendering (`admin` vs `user`), and token renewal.
- **Knowledge Base & Document Ingestion**: Ingest PDF, TXT, Markdown, and DOCX documents with configurable chunk sizes, overlap settings, vector store deletion, and status tracking.
- **Grounded Chat Console**: Interactive RAG query interface with document-specific filtering, sub-second response streaming, citation drawers with similarity scores, and one-click context copying.
- **4-Metric Evaluation Breakdown**: Real-time display of LLM generation quality metrics computed by Ragas/DeepEval:
  - *Faithfulness* (grounding confidence & hallucination prevention)
  - *Answer Relevance* (query-intent alignment)
  - *Context Precision* (signal-to-noise ratio in retrieved chunks)
  - *Context Recall* (retrieval coverage)
- **Analytics Dashboard**: System summary cards, daily latency and faithfulness sparklines, and recent evaluation query logs.
- **Live Full-Stack Integration**: Directly communicates with FastAPI endpoints (`/api/auth`, `/api/documents`, `/api/chat`, `/api/admin`, `/api/health`) via Axios with JWT bearer tokens.
- **Strict Authentication Route Guards**: Enforces active session verification against `/api/auth/me` before granting console access, with automatic session expiry cleanup.
- **Mobile Responsive**: Off-canvas sliding navigation drawer and responsive layout across desktop, tablet, and mobile viewports.

---

## Directory Structure

```text
frontend/
├── src/
│   ├── assets/             # Brand logos and vector graphics
│   ├── components/
│   │   ├── AnalyticsView.jsx   # Metrics cards, sparklines, evaluation logs
│   │   ├── AuthPage.jsx        # Tabbed login and registration view
│   │   ├── ChatConsole.jsx     # RAG query bar, messages, citation drawer
│   │   ├── Navbar.jsx          # Route links and navigation state
│   │   └── Sidebar.jsx         # Ingestion dropzone, document list, user profile
│   ├── services/
│   │   ├── adminService.js     # Analytics and user management endpoints
│   │   ├── apiClient.js        # Axios instance, token interceptor, health checks
│   │   ├── authService.js      # Login, registration, profile retrieval
│   │   ├── chatService.js      # Vector-grounded query dispatching
│   │   └── documentService.js  # Multipart upload, listing, deletion
│   ├── App.css
│   ├── App.jsx             # Main console layout and routing coordinator
│   ├── index.css           # Tailwind CSS directives and global theme
│   └── main.jsx            # Application entry point with BrowserRouter
├── scripts/
│   └── verify-build.js     # Production build smoke verification
├── .env.example            # Environment template
├── index.html              # HTML shell with Veritas RAG branding
├── package.json
└── vite.config.js          # Vite config with API reverse proxy
```

---

## Getting Started

### Prerequisites

- Node.js `>= 18.0.0` (Node 20+ recommended)
- npm `>= 9.0.0`

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` (optional when running via Vite proxy):

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` defaults to empty string, which routes through Vite's built-in `/api` proxy targeting `http://127.0.0.1:8000`.

### 3. Run Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```

### 5. Run Smoke Checks

```bash
npm run test:smoke
```

Verifies that the build bundle exists, HTML contains appropriate headers, and bundles compile without syntax or asset resolution issues.
