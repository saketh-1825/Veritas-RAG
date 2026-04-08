import React, { useState } from 'react';
import apiClient, { getApiError } from '../services/apiClient';

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
    if (!password || (tab === 'register' && (password.length < 8 || password.length > 128))) {
      errs.password = tab === 'register' ? 'Password must be 8–128 characters' : 'Enter your password';
    }
    if (tab === 'register' && !/\d/.test(password)) {
      errs.password = 'Password must contain at least one digit';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login'
        ? { email, password }
        : { email, username, password };
      const res = await apiClient.post(endpoint, body);
      const data = res.data;
      localStorage.setItem('rag_token', data.access_token);
      if (onAuthSuccess) {
        onAuthSuccess(data.access_token, data.user);
      }
    } catch (err) {
      setErrors({ general: getApiError(err) });
    } finally {
      setLoading(false);
    }
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
              Enterprise RAG
            </h1>
            <p className="text-xs text-slate-500 font-medium">AI Document Intelligence</p>
          </div>
        </div>
        <div className="relative flex bg-slate-950 p-1 rounded-xl border border-slate-800/50 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
              tab === 'login'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            disabled={loading}
            onClick={() => switchTab('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
              tab === 'register'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            disabled={loading}
            onClick={() => switchTab('register')}
          >
            Create Account
          </button>
        </div>
        {errors.general && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <span>⚠️</span> {errors.general}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label htmlFor="auth-username" className="block text-xs font-medium text-slate-400 mb-1.5">
                Username
              </label>
              <input
                id="auth-username"
                autoComplete="username"
                type="text"
                className={`w-full px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-xs text-white placeholder-slate-600 outline-none transition focus:ring-1 focus:ring-violet-500 ${
                  errors.username ? 'border-rose-500' : 'border-slate-800'
                }`}
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {errors.username && (
                <p className="mt-1 text-[11px] text-rose-400">{errors.username}</p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
              autoComplete="email"
              type="email"
              className={`w-full px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-xs text-white placeholder-slate-600 outline-none transition focus:ring-1 focus:ring-violet-500 ${
                errors.email ? 'border-rose-500' : 'border-slate-800'
              }`}
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                type={showPassword ? 'text' : 'password'}
                className={`w-full px-3.5 py-2.5 bg-slate-950/60 border rounded-xl text-xs text-white placeholder-slate-600 outline-none transition focus:ring-1 focus:ring-violet-500 pr-10 ${
                  errors.password ? 'border-rose-500' : 'border-slate-800'
                }`}
                placeholder="Enter strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition text-xs cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white font-semibold rounded-xl text-xs shadow-lg shadow-violet-600/20 transition duration-200 active:scale-[0.98] disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              tab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="text-violet-400 hover:underline font-semibold cursor-pointer"
              disabled={loading}
              onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
            >
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
