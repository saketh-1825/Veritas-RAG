import { useState } from 'react';

export default function App() {
  const [status] = useState('Frontend Scaffolding Initialized');

  return (
    <div className="min-h-screen bg-[#0b0c10] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
        <div className="flex items-center justify-center w-14 h-14 mx-auto bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-2xl text-white font-bold text-2xl shadow-lg shadow-violet-600/30">
          ▲
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
            Veritas RAG Console
          </h1>
          <p className="text-sm text-slate-400">
            Enterprise Retrieval-Augmented Generation & Evaluation Interface
          </p>
        </div>
        <div className="py-3 px-4 bg-slate-950/80 border border-slate-800/60 rounded-xl text-xs font-mono text-cyan-400">
          ● {status} (UI Prototyping Stage)
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Initial project structure set up with Vite, React 19, and Tailwind CSS.
        </p>
      </div>
    </div>
  );
}
