import { useState } from 'react';
import AuthPage from './components/AuthPage';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('rag_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rag_token');
    return saved ? { username: 'demo_user', email: 'demo@veritas.ai', role: 'user' } : null;
  });

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

  return (
    <div className="min-h-screen bg-[#0b0c10] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-xl text-white font-bold text-xl shadow-lg shadow-violet-600/30">
          ▲
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100">Authenticated Session</h2>
          <p className="text-sm text-slate-400">Welcome, {user.username} ({user.role})</p>
        </div>
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
          Status: Auth UI validated (Client State Mode)
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition cursor-pointer border border-slate-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
