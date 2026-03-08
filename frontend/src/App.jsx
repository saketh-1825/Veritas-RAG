import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import AuthPage from './components/AuthPage';

// Initial mock dataset for standalone UI development phase
const INITIAL_MOCK_DOCUMENTS = [
  {
    id: 'doc-001',
    filename: 'veritas_architecture_v1.pdf',
    size: 524288,
    processing_status: 'processed',
    chunk_count: 24,
    created_at: '2026-03-05T10:00:00Z',
  },
  {
    id: 'doc-002',
    filename: 'enterprise_security_compliance.txt',
    size: 148576,
    processing_status: 'processed',
    chunk_count: 8,
    created_at: '2026-03-06T12:30:00Z',
  },
];

const INITIAL_MOCK_ANALYTICS = {
  summary: {
    total_requests: 128,
    avg_latency_ms: 412.5,
    avg_faithfulness: 0.942,
    avg_answer_relevance: 0.918,
    hallucination_rate: 0.045,
  },
  daily_stats: [
    { date: '2026-03-02', count: 18, avg_latency: 520, avg_faithfulness: 0.88, hallucination_rate: 0.08 },
    { date: '2026-03-03', count: 24, avg_latency: 480, avg_faithfulness: 0.91, hallucination_rate: 0.06 },
    { date: '2026-03-04', count: 32, avg_latency: 440, avg_faithfulness: 0.93, hallucination_rate: 0.05 },
    { date: '2026-03-05', count: 28, avg_latency: 410, avg_faithfulness: 0.95, hallucination_rate: 0.04 },
    { date: '2026-03-06', count: 35, avg_latency: 395, avg_faithfulness: 0.96, hallucination_rate: 0.03 },
  ],
  recent_evaluations: [
    {
      id: 'eval-1',
      user_query: 'What vector indexing strategy does Veritas use for document chunks?',
      faithfulness_score: 0.96,
      answer_relevance_score: 0.94,
      context_precision_score: 0.92,
      context_recall_score: 0.95,
      latency_ms: 388,
      created_at: '2026-03-06T15:24:00Z',
    },
    {
      id: 'eval-2',
      user_query: 'Explain the MongoDB and Pinecone data flow pipeline.',
      faithfulness_score: 0.92,
      answer_relevance_score: 0.89,
      context_precision_score: 0.90,
      context_recall_score: 0.88,
      latency_ms: 442,
      created_at: '2026-03-06T14:10:00Z',
    },
  ],
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('rag_token') || 'mock_dev_token');
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('rag_token');
    return stored
      ? { username: 'veritas_analyst', email: 'analyst@veritas.ai', role: 'admin' }
      : { username: 'veritas_analyst', email: 'analyst@veritas.ai', role: 'admin' };
  });

  const [backendStatus, setBackendStatus] = useState({
    status: 'Standby (Mock Mode - Decoupled UI)',
    environment: 'development-prototype',
    backend: 'FastAPI',
    version: '0.2.0-mock',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Knowledge base state
  const [documents, setDocuments] = useState(INITIAL_MOCK_DOCUMENTS);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Chat interface state
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'assistant',
      text: 'Welcome to the Veritas RAG Grounded Console. Ask any question about your indexed organizational documents or choose a specific document to narrow your context.',
      responseTime: 0.24,
      citations: [],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedCitationIndex, setExpandedCitationIndex] = useState(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(INITIAL_MOCK_ANALYTICS);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (location.pathname === '/') {
      scrollToBottom();
    }
  }, [chatHistory, chatLoading, location.pathname]);

  // Auth Handlers (Client-Side Simulation)
  const handleAuthSuccess = useCallback((newToken, userInfo) => {
    setToken(newToken);
    setUser(userInfo);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('rag_token');
    setToken(null);
    setUser(null);
    setDocuments([]);
    setChatHistory([]);
    navigate('/');
  }, [navigate]);

  // Document Management (Decoupled Mock Handlers)
  const fetchDocuments = useCallback(() => {
    setLoadingDocs(true);
    setTimeout(() => {
      setDocuments(prev => (prev.length > 0 ? prev : INITIAL_MOCK_DOCUMENTS));
      setLoadingDocs(false);
    }, 300);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    // Standalone prototype simulation: simulates chunking and indexing latency
    setTimeout(() => {
      const newDoc = {
        id: `doc-${Date.now().toString().slice(-4)}`,
        filename: fileToUpload.name,
        size: fileToUpload.size,
        processing_status: 'processed',
        chunk_count: Math.max(4, Math.floor(fileToUpload.size / 15000)),
        created_at: new Date().toISOString(),
      };
      setDocuments(prev => [newDoc, ...prev]);
      setUploadSuccess(true);
      setUploading(false);
      setFileToUpload(null);
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';
    }, 600);
  };

  const handleDeleteDoc = (id) => {
    if (!confirm('Are you sure you want to delete this document from the index?')) return;
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (selectedDocId === id) setSelectedDocId('');
  };

  // Chat Simulation (Decoupled Mock Handlers with DeepEval scores)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsgText = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const newHistory = [...chatHistory, { sender: 'user', text: userMsgText }];
    setChatHistory(newHistory);

    // Simulate RAG reasoning, vector search, and evaluation layer latency
    setTimeout(() => {
      const selectedDoc = documents.find(d => d.id === selectedDocId);
      const docContext = selectedDoc ? selectedDoc.filename : 'all indexed enterprise documents';

      setChatHistory([
        ...newHistory,
        {
          sender: 'assistant',
          text: `Based on ${docContext}, the Veritas RAG pipeline segments incoming documents into semantic chunks, stores vector embeddings in Pinecone, and retrieves relevant context with strict hallucination filtering.`,
          responseTime: 0.38,
          citations: [
            {
              filename: selectedDoc ? selectedDoc.filename : 'veritas_architecture_v1.pdf',
              chunk_index: 2,
              score: 0.942,
              text: 'The architecture employs Pinecone vector indexing combined with MongoDB metadata persistence to ensure fast, sub-50ms hybrid retrieval and deterministic citation tracking.',
            },
            {
              filename: 'enterprise_security_compliance.txt',
              chunk_index: 1,
              score: 0.887,
              text: 'All ingested documents are partitioned into configurable chunk sizes (default 1000 characters with 200 character overlap) before generating dense embeddings.',
            },
          ],
          evaluation: {
            faithfulness: 0.96,
            answer_relevance: 0.93,
            context_precision: 0.91,
            context_recall: 0.94,
            latency_ms: 380,
          },
        },
      ]);
      setChatLoading(false);
    }, 700);
  };

  const fetchAnalytics = () => {
    setAnalyticsLoading(true);
    setTimeout(() => {
      setAnalyticsData(INITIAL_MOCK_ANALYTICS);
      setAnalyticsLoading(false);
    }, 300);
  };

  const drawSparkline = (dataList, key, width = 400, height = 160) => {
    if (!dataList || dataList.length < 2) return null;
    const padding = 15;
    const values = dataList.map(d => Number(d[key]));
    const maxVal = Math.max(...values, 0.1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;
    const points = dataList.map((d, i) => {
      const x = padding + (i / (dataList.length - 1)) * (width - 2 * padding);
      const val = Number(d[key]);
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
      return { x, y, date: d.date, val };
    });
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fillPathData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    return { points, pathData, fillPathData };
  };

  if (!token || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const roleLabel = user.role === 'admin' ? '🛡 Admin' : '👤 User';
  const roleClass = user.role === 'admin'
    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
    : 'bg-slate-800 text-slate-400 border border-slate-700/50';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0c10] text-slate-100 font-sans">
      {/* Sidebar navigation */}
      <aside className="w-80 flex flex-col bg-slate-950/80 border-r border-slate-900/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-900/50">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-lg text-white font-bold text-sm shadow-md shadow-violet-600/10">
            ▲
          </div>
          <div>
            <h2 className="font-bold text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Veritas RAG
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Console v0.5</p>
          </div>
        </div>

        <nav className="px-4 py-4 space-y-1 border-b border-slate-900/40">
          <Link
            to="/"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              location.pathname === '/'
                ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <span>💬</span>
            <span>RAG Grounded Chat</span>
          </Link>
          <Link
            to="/analytics"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              location.pathname === '/analytics'
                ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <span>📊</span>
            <span>Analytics Dashboard</span>
          </Link>
        </nav>

        {/* Document Ingestion & Knowledge Base Sidebar */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>📤</span> Document Ingestion
            </h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <div className="border-2 border-dashed border-slate-800 hover:border-violet-600/50 hover:bg-slate-950/30 rounded-lg p-5 text-center cursor-pointer transition duration-300">
                <input
                  type="file"
                  id="doc-file-input"
                  accept=".pdf,.txt,.docx,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="doc-file-input" className="cursor-pointer block space-y-2">
                  <span className="text-2xl block">📄</span>
                  {fileToUpload ? (
                    <span className="text-xs font-semibold text-violet-400 block break-all px-1">
                      {fileToUpload.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 block">
                      Select PDF, TXT, MD, DOCX
                    </span>
                  )}
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                disabled={!fileToUpload || uploading}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Embedding chunks...</span>
                  </>
                ) : (
                  'Ingest Document'
                )}
              </button>
            </form>
            {uploadSuccess && (
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                <span>✅</span> Grounded in vector store!
              </p>
            )}
            {uploadError && (
              <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg break-all">
                <span>❌</span> {uploadError}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>📚</span> Knowledge Base ({documents.length})
              </h3>
              <button
                onClick={fetchDocuments}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
                title="Refresh Documents"
              >
                🔄
              </button>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {loadingDocs ? (
                <p className="text-xs text-slate-600 italic pl-1">Syncing index...</p>
              ) : documents.length === 0 ? (
                <p className="text-xs text-slate-600 pl-1">No documents uploaded yet.</p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between p-3 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-900/80 hover:border-slate-800/80 rounded-xl transition duration-200"
                  >
                    <div className="min-w-0 flex-1 pr-2 space-y-1">
                      <p className="text-xs font-semibold text-slate-200 truncate" title={doc.filename}>
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{(doc.size / 1024).toFixed(0)} KB</span>
                        <span>•</span>
                        <span className="capitalize font-bold text-emerald-500/80">
                          {doc.processing_status} ({doc.chunk_count})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-rose-500 p-1.5 rounded-lg border border-transparent hover:border-rose-500/20 transition cursor-pointer shrink-0"
                      title="Delete document"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Profile & Status Footer */}
        <div className="p-4 border-t border-slate-900/50 bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                {user.username.slice(0, 2)}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-bold text-slate-200 truncate">{user.username}</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mt-0.5 scale-90 -translate-x-1 origin-left border ${roleClass}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hover:bg-slate-800 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg border border-slate-900 transition cursor-pointer"
              title="Sign Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  UI Prototype
                </span>
              </div>
              <span className="text-[9px] text-cyan-400 font-semibold">
                Standalone Mode
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Console and Analytics Views */}
      <div className="flex-1 flex flex-col min-w-0">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <header className="h-16 px-6 border-b border-slate-900/60 bg-slate-950/30 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <h1 className="font-bold text-base tracking-tight text-white">RAG Grounded Console</h1>
                    <span className="px-2 py-0.5 bg-violet-600/10 text-violet-400 border border-violet-500/10 rounded-full text-[10px] font-semibold">
                      Live Evaluation Layer
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Grounding context:</span>
                    <select
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                      className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-violet-500/50 transition"
                    >
                      <option value="">🔍 Search All Ingested Knowledge</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          📄 {doc.filename.slice(0, 30)}{doc.filename.length > 30 ? '...' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
                  <div className="max-w-3xl mx-auto space-y-6">
                    {chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center uppercase shrink-0 border ${
                            msg.sender === 'user'
                              ? 'bg-cyan-600/20 border-cyan-500/30 text-cyan-400'
                              : 'bg-violet-600/20 border-violet-500/30 text-violet-400'
                          }`}
                        >
                          {msg.sender === 'user' ? user.username.slice(0, 2) : 'AI'}
                        </div>
                        <div className="flex flex-col max-w-2xl space-y-2">
                          <div
                            className={`text-sm rounded-2xl p-4 shadow-sm leading-relaxed border ${
                              msg.sender === 'user'
                                ? 'bg-slate-900/60 border-slate-800 text-slate-100 rounded-tr-none'
                                : 'bg-slate-950/30 border-slate-900/80 text-slate-200 rounded-tl-none'
                            }`}
                          >
                            <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                            {msg.sender === 'assistant' && (
                              <div className="mt-4 pt-3.5 border-t border-slate-900/80 space-y-4 text-[11px] text-slate-500">
                                <div className="flex items-center justify-between text-slate-500 font-semibold px-0.5">
                                  {msg.responseTime !== undefined && (
                                    <span>⏱ Generation: <strong>{msg.responseTime}s</strong></span>
                                  )}
                                  {msg.citations && msg.citations.length > 0 && (
                                    <span>📚 Grounding: <strong>{msg.citations.length} sources</strong></span>
                                  )}
                                </div>

                                {msg.evaluation && (
                                  <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3.5 space-y-3.5">
                                    <div className="flex items-center justify-between font-bold text-slate-300">
                                      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider">
                                        📊 DeepEval RAG layer
                                      </span>
                                      <span className="font-semibold text-[10px] text-slate-500">
                                        Eval Latency: {msg.evaluation.latency_ms} ms
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                                      <div className="space-y-1">
                                        <div className="flex justify-between font-medium">
                                          <span>Faithfulness</span>
                                          <span className="font-bold text-emerald-400">
                                            {(msg.evaluation.faithfulness * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${msg.evaluation.faithfulness * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex justify-between font-medium">
                                          <span>Answer Relevance</span>
                                          <span className="font-bold text-emerald-400">
                                            {(msg.evaluation.answer_relevance * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${msg.evaluation.answer_relevance * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex justify-between font-medium">
                                          <span>Context Precision</span>
                                          <span className="font-bold text-emerald-400">
                                            {(msg.evaluation.context_precision * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${msg.evaluation.context_precision * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex justify-between font-medium">
                                          <span>Context Recall</span>
                                          <span className="font-bold text-emerald-400">
                                            {(msg.evaluation.context_recall * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${msg.evaluation.context_recall * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {msg.citations && msg.citations.length > 0 && (
                                  <div className="space-y-2">
                                    {msg.citations.map((cite, cIdx) => {
                                      const key = `${index}-${cIdx}`;
                                      const isExpanded = expandedCitationIndex === key;
                                      return (
                                        <div
                                          key={key}
                                          className="bg-slate-950/40 border border-slate-900 rounded-lg overflow-hidden transition"
                                        >
                                          <button
                                            onClick={() => setExpandedCitationIndex(isExpanded ? null : key)}
                                            className="w-full text-left px-3 py-2 bg-slate-950/20 hover:bg-slate-900/30 flex items-center justify-between text-[11px] font-semibold text-slate-400 cursor-pointer"
                                          >
                                            <span className="truncate text-violet-400">
                                              [{cIdx + 1}] {cite.filename} (Chunk {cite.chunk_index})
                                            </span>
                                            <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                                              Score: {cite.score.toFixed(3)} {isExpanded ? '▲' : '▼'}
                                            </span>
                                          </button>
                                          {isExpanded && (
                                            <div className="p-3 bg-slate-950/80 border-t border-slate-900 text-slate-300 font-mono text-[11px] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-text">
                                              {cite.text}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          AI
                        </div>
                        <div className="bg-slate-900/20 border border-slate-900/80 border-dashed rounded-2xl rounded-tl-none p-4 max-w-xl text-sm text-slate-500 flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Searching knowledge base and calculating evaluation metrics...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="p-6 border-t border-slate-900/50 bg-[#0b0c10] shrink-0">
                  <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                      <input
                        type="text"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 text-slate-100 placeholder-slate-600 rounded-2xl pl-4 pr-16 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition leading-normal"
                        placeholder={chatLoading ? 'Reasoning in progress...' : 'Ask Veritas RAG... (e.g., Explain vector indexing strategy)'}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={chatLoading}
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 active:scale-[0.98] transition cursor-pointer"
                        disabled={chatLoading || !chatInput.trim()}
                      >
                        Send
                      </button>
                    </form>
                    <p className="text-[10px] text-slate-600 text-center mt-2.5">
                      Veritas Enterprise RAG Console. Standalone preview mode with client-side mock handlers.
                    </p>
                  </div>
                </div>
              </>
            }
          />

          {/* Analytics Route */}
          <Route
            path="/analytics"
            element={
              <>
                <header className="h-16 px-6 border-b border-slate-900/60 bg-slate-950/30 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <h1 className="font-bold text-base tracking-tight text-white font-display">System Analytics</h1>
                    <span className="px-2 py-0.5 bg-cyan-600/10 text-cyan-400 border border-cyan-500/10 rounded-full text-[10px] font-semibold">
                      Evaluation Preview
                    </span>
                  </div>
                  <button
                    onClick={fetchAnalytics}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-3.5 py-1.5 rounded-lg font-semibold active:scale-[0.98] transition cursor-pointer"
                  >
                    🔄 Refresh Stats
                  </button>
                </header>
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#0b0c10]">
                  {analyticsData && (
                    <div className="max-w-5xl mx-auto space-y-8">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Requests</p>
                          <p className="text-3xl font-bold text-white">{analyticsData.summary.total_requests}</p>
                          <p className="text-[10px] text-slate-600">Evaluations recorded</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Latency</p>
                          <p className="text-3xl font-bold text-cyan-400">{analyticsData.summary.avg_latency_ms.toFixed(0)} ms</p>
                          <p className="text-[10px] text-slate-600">Round-trip execution</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Faithfulness</p>
                          <p className="text-3xl font-bold text-emerald-400">{(analyticsData.summary.avg_faithfulness * 100).toFixed(0)}%</p>
                          <p className="text-[10px] text-slate-600">Zero-hallucination score</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hallucination Rate</p>
                          <p className="text-3xl font-bold text-rose-400">{(analyticsData.summary.hallucination_rate * 100).toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-600">Faithfulness &lt; 0.70</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl space-y-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-300">Retrieval & Generation Latency</h3>
                            <p className="text-[10px] text-slate-500">Average millisecond duration per day</p>
                          </div>
                          <div className="h-44 w-full flex items-center justify-center bg-slate-950/60 border border-slate-900/60 rounded-xl relative overflow-hidden">
                            {(() => {
                              const chart = drawSparkline(analyticsData.daily_stats, 'avg_latency', 400, 160);
                              if (!chart) return null;
                              return (
                                <svg className="w-full h-full" viewBox="0 0 400 160">
                                  <line x1="15" y1="80" x2="385" y2="80" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                                  <path d={chart.pathData} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                                  {chart.points.map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#06b6d4" />
                                  ))}
                                </svg>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl space-y-4">
                          <div>
                            <h3 className="text-sm font-bold text-slate-300">Faithfulness Metric Trend</h3>
                            <p className="text-[10px] text-slate-500">Daily average score trend</p>
                          </div>
                          <div className="h-44 w-full flex items-center justify-center bg-slate-950/60 border border-slate-900/60 rounded-xl relative overflow-hidden">
                            {(() => {
                              const chart = drawSparkline(analyticsData.daily_stats, 'avg_faithfulness', 400, 160);
                              if (!chart) return null;
                              return (
                                <svg className="w-full h-full" viewBox="0 0 400 160">
                                  <line x1="15" y1="80" x2="385" y2="80" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                                  <path d={chart.pathData} fill="none" stroke="#10b981" strokeWidth="2.5" />
                                  {chart.points.map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
                                  ))}
                                </svg>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden p-6 space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-300">Recent Pipeline Evaluations</h3>
                          <p className="text-[10px] text-slate-500">Mock evaluation records log</p>
                        </div>
                        <div className="overflow-x-auto border border-slate-900 rounded-xl">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-950 text-slate-500 border-b border-slate-900">
                                <th className="p-3 font-semibold">User Query</th>
                                <th className="p-3 font-semibold text-center">Faithful</th>
                                <th className="p-3 font-semibold text-center">Relevance</th>
                                <th className="p-3 font-semibold text-center">Precision</th>
                                <th className="p-3 font-semibold text-center">Recall</th>
                                <th className="p-3 font-semibold text-center">Latency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60">
                              {analyticsData.recent_evaluations.map((ev) => (
                                <tr key={ev.id} className="hover:bg-slate-900/20 text-slate-300">
                                  <td className="p-3 font-medium truncate max-w-xs">{ev.user_query}</td>
                                  <td className="p-3 text-center font-bold text-emerald-400">
                                    {(ev.faithfulness_score * 100).toFixed(0)}%
                                  </td>
                                  <td className="p-3 text-center">
                                    {(ev.answer_relevance_score * 100).toFixed(0)}%
                                  </td>
                                  <td className="p-3 text-center">
                                    {(ev.context_precision_score * 100).toFixed(0)}%
                                  </td>
                                  <td className="p-3 text-center">
                                    {(ev.context_recall_score * 100).toFixed(0)}%
                                  </td>
                                  <td className="p-3 text-center text-cyan-400">
                                    {ev.latency_ms} ms
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
