import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import ChatConsole from './components/ChatConsole';
import AnalyticsView from './components/AnalyticsView';
import authService from './services/authService';
import documentService from './services/documentService';
import { checkBackendHealth } from './services/apiClient';

const INITIAL_MOCK_ANALYTICS = {
  summary: {
    total_requests: 128,
    avg_latency_ms: 412.5,
    avg_faithfulness: 0.942,
    avg_answer_relevance: 0.918,
    hallucination_rate: 0.045,
  },
  daily_stats: [
    { date: '2026-03-02', count: 18, avg_latency_ms: 520, avg_faithfulness: 0.88, hallucination_rate: 0.08 },
    { date: '2026-03-03', count: 24, avg_latency_ms: 480, avg_faithfulness: 0.91, hallucination_rate: 0.06 },
    { date: '2026-03-04', count: 32, avg_latency_ms: 440, avg_faithfulness: 0.93, hallucination_rate: 0.05 },
    { date: '2026-03-05', count: 28, avg_latency_ms: 410, avg_faithfulness: 0.95, hallucination_rate: 0.04 },
    { date: '2026-03-06', count: 35, avg_latency_ms: 395, avg_faithfulness: 0.96, hallucination_rate: 0.03 },
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
    status: 'Standby / Local Mock',
    environment: 'development',
    backend: 'FastAPI',
    version: 'v0.2.0',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Knowledge base state
  const [documents, setDocuments] = useState([]);
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

  // Check backend health & sync user session
  useEffect(() => {
    let isMounted = true;
    const syncStatus = async () => {
      const health = await checkBackendHealth();
      if (!isMounted) return;
      if (health.online) {
        setBackendStatus({
          status: 'Online (FastAPI)',
          environment: health.data?.environment || 'production',
          backend: 'FastAPI',
          version: health.data?.version || 'v0.2.0',
        });
      } else {
        setBackendStatus({
          status: 'Offline / Standalone',
          environment: 'development',
          backend: 'FastAPI',
          version: 'v0.2.0-fallback',
        });
      }
    };

    const initAuth = async () => {
      const stored = localStorage.getItem('rag_token');
      if (stored && !stored.startsWith('mock_')) {
        try {
          const profile = await authService.getMe();
          if (isMounted && profile) {
            setUser(profile);
          }
        } catch {
          // Token expired or server unreachable
        }
      }
    };

    syncStatus();
    initAuth();
    const interval = setInterval(syncStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch documents using documentService
  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const docs = await documentService.listDocuments();
      setDocuments(docs || []);
    } catch (err) {
      console.warn('Document sync notice:', err.message);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token, fetchDocuments]);

  // Auth Handlers
  const handleAuthSuccess = useCallback((newToken, userInfo) => {
    setToken(newToken);
    setUser(userInfo);
    fetchDocuments();
  }, [fetchDocuments]);

  const handleLogout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
    setDocuments([]);
    setChatHistory([]);
    navigate('/');
  }, [navigate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      await documentService.uploadDocument(fileToUpload);
      setUploadSuccess(true);
      setFileToUpload(null);
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';
      await fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.detail || err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Are you sure you want to delete this document from the vector store?')) return;
    try {
      await documentService.deleteDocument(id);
      await fetchDocuments();
      if (selectedDocId === id) setSelectedDocId('');
    } catch (err) {
      alert(err.response?.data?.detail || 'An error occurred during deletion.');
    }
  };

  // Chat Simulation (transitioning to service integration)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsgText = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const newHistory = [...chatHistory, { sender: 'user', text: userMsgText }];
    setChatHistory(newHistory);

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
    }, 600);
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
