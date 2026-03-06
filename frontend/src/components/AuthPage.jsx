import React, { useState } from 'react';

export default function AuthPage({ onAuthSuccess }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const clearForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setErrors({});
  };

  const switchTab = (t) => {
    setTab(t);
    clearForm();
  };

  const validate = () => {
    const errs = {};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errs.email = 'Enter a valid email address';
    }
    if (tab === 'register') {
      if (!username.match(/^[a-zA-Z0-9_-]{3,50}$/)) {
        errs.username = 'Username: 3-50 chars, letters/digits/_ only';
      }
    }
    if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (tab === 'register' && !/\d/.test(password)) {
      errs.password = 'Password must contain at least one digit';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    // Standalone prototype phase: simulate authentication without active backend network calls
    setTimeout(() => {
      const mockUser = {
        username: tab === 'register' ? username : (email.split('@')[0] || 'demo_user'),
        email: email,
        role: email.toLowerCase().includes('admin') ? 'admin' : 'user'
      };
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('rag_token', mockToken);
      if (onAuthSuccess) {
        onAuthSuccess(mockToken, mockUser);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#0b0c10]">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-700"></div>
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 z-10">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-lg text-white font-bold text-lg shadow-md shadow-violet-600/20">
            ▲
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
              Veritas RAG
            </h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Intelligence Console</p>
          </div>
        </div>
        <div className="relative flex bg-slate-950 p-1 rounded-xl border border-slate-800/50 mb-6">
          <button
            id="tab-login"
            className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 z-10 ${
              tab === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => switchTab('login')}
            type="button"
          >
            Sign In
          </button>
          <button
            id="tab-register"
            className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 z-10 ${
              tab === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => switchTab('register')}
            type="button"
          >
            Create Account
          </button>
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 border border-slate-700/50 rounded-lg shadow-sm transition-all duration-300 ${
              tab === 'register' ? 'left-[calc(50%+2px)]' : 'left-[4px]'
            }`}
          />
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {errors.general && (
            <div className="flex gap-2 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl" role="alert">
              <span className="text-base">⚠️</span>
              <span className="font-medium">{errors.general}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </span>
              <input
                id="auth-email"
                type="email"
                className={`w-full bg-slate-950/60 border ${
                  errors.email ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-slate-800 focus:border-violet-500 focus:ring-violet-500/10'
                } text-slate-100 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-4 transition`}
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            {errors.email && <p className="text-xs text-rose-400 font-medium">{errors.email}</p>}
          </div>
          {tab === 'register' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label htmlFor="auth-username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  id="auth-username"
                  type="text"
                  className={`w-full bg-slate-950/60 border ${
                    errors.username ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-slate-800 focus:border-violet-500 focus:ring-violet-500/10'
                  } text-slate-100 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-4 transition`}
                  placeholder="yourusername"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              {errors.username && <p className="text-xs text-rose-400 font-medium">{errors.username}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className={`w-full bg-slate-950/60 border ${
                  errors.password ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-slate-800 focus:border-violet-500 focus:ring-violet-500/10'
                } text-slate-100 rounded-xl pl-11 pr-11 py-2.5 text-sm focus:outline-none focus:ring-4 transition`}
                placeholder={tab === 'register' ? 'Min 8 chars, 1 digit' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-400 font-medium">{errors.password}</p>}
          </div>
          <button
            id="auth-submit-btn"
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : tab === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 font-medium">
          {tab === 'login' ? (
            <>
              Don't have an account?{' '}
              <button className="text-violet-400 hover:text-violet-300 font-bold transition cursor-pointer bg-transparent border-0" onClick={() => switchTab('register')}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="text-violet-400 hover:text-violet-300 font-bold transition cursor-pointer bg-transparent border-0" onClick={() => switchTab('login')}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
