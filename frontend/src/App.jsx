import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import apiClient, { getApiError } from './services/apiClient';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import ChatConsole from './components/ChatConsole';
import AnalyticsView from './components/AnalyticsView';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('rag_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [retry, setRetry] = useState(0);
  const navigate = useNavigate();

  // Startup Authentication Verification
  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      if (!isMounted) return;
      const stored = localStorage.getItem('rag_token');
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const r = await apiClient.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (isMounted) {
          setToken(stored);
          setUser(r.data);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('rag_token');
            setToken(null);
            setUser(null);
          } else {
            setAuthError(getApiError(err));
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    setAuthError(null);
    initializeApp();
    return () => {
      isMounted = false;
    };
  }, [retry]);

  // Auth Handlers
  const handleAuthSuccess = useCallback((newToken, userInfo) => {
    localStorage.setItem('rag_token', newToken);
    setToken(newToken);
    setUser(userInfo);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('rag_token');
    setToken(null);
    setUser(null);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('rag:session-expired', handleLogout);
    return () => window.removeEventListener('rag:session-expired', handleLogout);
  }, [handleLogout]);

  // View Guards
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-slate-400 font-medium">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm tracking-wider uppercase">Loading RAG Interface...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-slate-300">
        <p role="alert">Could not verify your session: {authError}</p>
        <button onClick={() => setRetry(value => value + 1)}>Retry connection</button>
        <button onClick={() => { setAuthError(null); handleLogout(); }}>Sign out</button>
      </div>
    );
  }

  if (!token || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <Workspace key={token} token={token} user={user} handleLogout={handleLogout} />;
}

function Workspace({ token, user, handleLogout }) {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState(null);
  // Knowledge base state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Chat interface state
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'assistant',
      text: 'Welcome to the Enterprise RAG Grounded Console. Ask any question about your indexed organizational documents or choose a specific document to narrow your context.',
      citations: [],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedCitationIndex, setExpandedCitationIndex] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Document management: Fetch documents using the shared API client
  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    setLoadingDocs(true);
    setDocumentsError(null);
    try {
      const res = await apiClient.get('/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(res.data || []);
    } catch (err) {
      setDocumentsError(getApiError(err));
    } finally {
      setLoadingDocs(false);
    }
  }, [token]);

  // Analytics: Fetch analytics using the shared API client
  const fetchAnalytics = useCallback(async () => {
    if (user.role !== 'admin') return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await apiClient.get('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalyticsData(res.data);
    } catch (err) {
      setAnalyticsError(getApiError(err));
    } finally {
      setAnalyticsLoading(false);
    }
  }, [token, user.role]);

  // Health and status polling check when authenticated
  useEffect(() => {
    if (!token) return;
    const fetchStatus = async () => {
      try {
        const response = await apiClient.get('/api/health');
        setBackendStatus({
          status: response.data.status === 'healthy' ? 'Online (FastAPI)' : response.data.status,
          environment: response.data.environment || 'development',
          backend: response.data.backend || 'FastAPI',
          version: response.data.version || '0.2.0',
        });
      } catch {
        setBackendStatus({
          status: 'Offline / Disconnected',
          environment: 'development',
          backend: 'FastAPI',
          version: '0.2.0',
        });
      }
    };

    fetchStatus();
    fetchDocuments();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [token, fetchDocuments]);

  useEffect(() => {
    if (token && location.pathname === '/analytics') {
      fetchAnalytics();
    }
  }, [token, location.pathname, fetchAnalytics]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload || !token || uploading) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('chunk_size', '1000');
    formData.append('chunk_overlap', '200');

    try {
      await apiClient.post('/api/documents/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadSuccess(true);
      setFileToUpload(null);
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';
      await fetchDocuments();
    } catch (err) {
      setUploadError(getApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this document? All associated vector chunks will be permanently removed.')) return;
    try {
      await apiClient.delete(`/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDocuments();
      if (selectedDocId === id) setSelectedDocId('');
    } catch (err) {
      alert(getApiError(err));
    }
  };

  // Live Chat Pipeline Integration with 4-Metric Evaluation Layer
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !token) return;

    const userMsgText = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const newHistory = [...chatHistory, { sender: 'user', text: userMsgText }];
    setChatHistory(newHistory);

    try {
      const res = await apiClient.post(
        '/api/chat',
        {
          message: userMsgText,
          document_id: selectedDocId || null,
          top_k: 4,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = res.data;
      setChatHistory([
        ...newHistory,
        {
          sender: 'assistant',
          text: data.answer,
          responseTime: data.response_time,
          citations: data.citations || [],
          evaluation: data.evaluation,
        },
      ]);
    } catch (err) {
      setChatHistory([
        ...newHistory,
        {
          sender: 'assistant',
          text: `❌ Failed to reach RAG Assistant: ${getApiError(err)}`,
          responseTime: 0,
          citations: [],
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0c10] text-slate-100 font-sans">
      <Sidebar
        documents={documents}
        loadingDocs={loadingDocs}
        documentsError={documentsError}
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
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
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
              onOpenMobileMenu={() => setMobileOpen(true)}
            />
          }
        />
        <Route
          path="/analytics"
          element={
            user.role === 'admin' ? <AnalyticsView
              analyticsData={analyticsData}
              analyticsLoading={analyticsLoading}
              analyticsError={analyticsError}
              fetchAnalytics={fetchAnalytics}
              onOpenMobileMenu={() => setMobileOpen(true)}
            /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
