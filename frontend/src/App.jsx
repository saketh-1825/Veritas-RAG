import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import ChatConsole from './components/ChatConsole';
import AnalyticsView from './components/AnalyticsView';
import authService from './services/authService';
import documentService from './services/documentService';
import chatService from './services/chatService';
import adminService from './services/adminService';
import { checkBackendHealth } from './services/apiClient';

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
  const [analyticsData, setAnalyticsData] = useState(null);
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
  const syncStatus = useCallback(async () => {
    const health = await checkBackendHealth();
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const stored = localStorage.getItem('rag_token');
      if (stored && !stored.startsWith('mock_')) {
        try {
          const profile = await authService.getMe();
          if (isMounted && profile) {
            setUser(profile);
          }
        } catch {
          // Token expired
        }
      }
    };

    syncStatus();
    initAuth();
    const interval = setInterval(syncStatus, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [syncStatus]);

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

  // Fetch analytics using adminService
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await adminService.getAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      setAnalyticsError(err.response?.data?.detail || err.message || 'Error loading analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token, fetchDocuments]);

  useEffect(() => {
    if (token && location.pathname === '/analytics') {
      fetchAnalytics();
    }
  }, [token, location.pathname, fetchAnalytics]);

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

  // Live Chat Pipeline Integration with 4-Metric Evaluation Layer
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsgText = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const newHistory = [...chatHistory, { sender: 'user', text: userMsgText }];
    setChatHistory(newHistory);

    try {
      const response = await chatService.sendMessage(userMsgText, selectedDocId || null, 4);
      setChatHistory([
        ...newHistory,
        {
          sender: 'assistant',
          text: response.answer,
          responseTime: response.response_time,
          citations: response.citations || [],
          evaluation: response.evaluation,
        },
      ]);
    } catch (err) {
      setChatHistory([
        ...newHistory,
        {
          sender: 'assistant',
          text: `Error connecting to RAG pipeline: ${err.response?.data?.detail || err.message || 'Server did not respond'}. Check your backend server status.`,
          responseTime: 0,
          citations: [],
        },
      ]);
    } finally {
      setChatLoading(false);
    }
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
