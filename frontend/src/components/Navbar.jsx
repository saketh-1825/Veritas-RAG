import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onMobileMenuToggle }) {
  const location = useLocation();

  return (
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
      {user?.role === 'admin' && (
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
      )}
    </nav>
  );
}
