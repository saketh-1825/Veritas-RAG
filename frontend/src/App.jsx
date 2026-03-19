import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import ChatConsole from './components/ChatConsole';
import AnalyticsView from './components/AnalyticsView';

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

  // Chat Simulation (Decoupled Mock Handlers with 4-metric evaluation)
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
            framework: 'DeepEval RAG Layer',
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

  if (!token || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0c10] text-slate-100 font-sans">
      <Sidebar
        documents={documents}
        loadingDocs={loadingDocs}
        selectedDocId={selectedDocId}
        setSelectedDocId={setSelectedDocId}
        fileToUpload={fileToUpload}
        uploading={uploading}
        uploadSuccess={uploadSuccess}
        uploadError={uploadError}
        handleFileChange={handleFileChange}
        handleUpload={handleUpload}
        handleDeleteDoc={handleDeleteDoc}
        fetchDocuments={fetchDocuments}
        user={user}
        backendStatus={backendStatus}
        handleLogout={handleLogout}
      />

      <Routes>
        <Route
          path="/"
          element={
            <ChatConsole
              chatHistory={chatHistory}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatLoading={chatLoading}
              handleSendMessage={handleSendMessage}
              documents={documents}
              selectedDocId={selectedDocId}
              setSelectedDocId={setSelectedDocId}
              expandedCitationIndex={expandedCitationIndex}
              setExpandedCitationIndex={setExpandedCitationIndex}
              messagesEndRef={messagesEndRef}
              user={user}
            />
          }
        />
        <Route
          path="/analytics"
          element={
            <AnalyticsView
              analyticsData={analyticsData}
              analyticsLoading={analyticsLoading}
              analyticsError={analyticsError}
              fetchAnalytics={fetchAnalytics}
            />
          }
        />
      </Routes>
    </div>
  );
}
