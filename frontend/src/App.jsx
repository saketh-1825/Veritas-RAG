import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AuthPage from './components/AuthPage';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('rag_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rag_token');
    return saved ? { username: 'demo_user', email: 'demo@veritas.ai', role: 'user' } : null;
  });
  const [backendStatus] = useState({
    status: 'standalone (prototype mode)',
    environment: 'development',
    version: '0.1.0-preview'
  });

  const location = useLocation();

  const handleAuthSuccess = (newToken, userInfo) => {
    setToken(newToken);
    setUser(userInfo);
  };

  const handleLogout = () => {
    localStorage.removeItem('rag_token');
    setToken(null);
    setUser(null);
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
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Console v0.2</p>
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
            <span className="text-base">💬</span>
            Query & Chat Console
          </Link>
          <Link
            to="/analytics"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              location.pathname === '/analytics' 
                ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <span className="text-base">📊</span>
            Evaluation & Analytics
          </Link>
        </nav>

        {/* Sidebar placeholder area for document management */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Knowledge Base</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Document ingestion UI panel under construction. Vector store integration will connect here.
            </p>
          </div>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-900/60 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center font-bold text-violet-400 text-xs shrink-0">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.username}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-slate-850 cursor-pointer"
              title="Sign Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-900/60 bg-slate-950/40 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleClass}`}>
              {roleLabel}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Enterprise Knowledge Base Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {backendStatus.status}
            </div>
          </div>
        </header>

        {/* Body views */}
        <Routes>
          <Route path="/" element={
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 mx-auto flex items-center justify-center text-2xl text-violet-400">
                  💬
                </div>
                <h3 className="text-lg font-bold text-slate-200">Chat Console Workspace Ready</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The dashboard layout shell and routing are now established. Next step: interactive chat feed, citation rendering, and document ingestion components.
                </p>
              </div>
            </div>
          } />
          <Route path="/analytics" element={
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-600/10 border border-cyan-500/20 mx-auto flex items-center justify-center text-2xl text-cyan-400">
                  📊
                </div>
                <h3 className="text-lg font-bold text-slate-200">Evaluation & Analytics Preview</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Analytics dashboard shell configured. Metric widgets and latency sparklines will be linked once the evaluation layer pipeline is finalized.
                </p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}
