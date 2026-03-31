import React from 'react';
import Navbar from './Navbar';

export default function Sidebar({
  documents = [],
  loadingDocs = false,
  selectedDocId = '',
  setSelectedDocId,
  fileToUpload = null,
  uploading = false,
  uploadSuccess = false,
  uploadError = null,
  handleFileChange,
  handleUpload,
  handleDeleteDoc,
  fetchDocuments,
  user,
  backendStatus,
  handleLogout,
  mobileOpen = false,
  setMobileOpen,
}) {
  const roleLabel = user?.role === 'admin' ? '🛡 Admin' : '👤 User';
  const roleClass = user?.role === 'admin'
    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
    : 'bg-slate-800 text-slate-400 border border-slate-700/50';

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-80 flex flex-col bg-slate-950/95 lg:bg-slate-950/80 border-r border-slate-900/60 backdrop-blur-md shrink-0 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-lg text-white font-bold text-sm shadow-md shadow-violet-600/10">
              ▲
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Veritas RAG
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Console v0.5</p>
            </div>
          </div>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              title="Close sidebar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <Navbar />

        {/* Document Ingestion & Knowledge Base */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>📤</span> Document Ingestion
            </h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <div className="border-2 border-dashed border-slate-800 hover:border-violet-600/50 hover:bg-slate-950/30 rounded-lg p-5 text-center cursor-pointer transition duration-300">
                <input
                  type="file"
                  id="doc-file-input"
                  accept=".pdf,.txt,.docx,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="doc-file-input" className="cursor-pointer block space-y-2">
                  <span className="text-2xl block">📄</span>
                  {fileToUpload ? (
                    <span className="text-xs font-semibold text-violet-400 block break-all px-1">
                      {fileToUpload.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 block">
                      Select PDF, TXT, MD, DOCX
                    </span>
                  )}
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                disabled={!fileToUpload || uploading}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Embedding chunks...</span>
                  </>
                ) : (
                  'Ingest Document'
                )}
              </button>
            </form>
            {uploadSuccess && (
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                <span>✅</span> Grounded in vector store!
              </p>
            )}
            {uploadError && (
              <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg break-all">
                <span>❌</span> {uploadError}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span>📚</span> Knowledge Base ({documents.length})
                </h3>
                {totalChunks > 0 && (
                  <span className="text-[10px] text-slate-500 pl-6 block">
                    {totalChunks} indexed chunks
                  </span>
                )}
              </div>
              <button
                onClick={fetchDocuments}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition cursor-pointer p-1 rounded hover:bg-slate-900"
                title="Refresh Documents"
              >
                🔄
              </button>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {loadingDocs ? (
                <p className="text-xs text-slate-600 italic pl-1">Syncing index...</p>
              ) : documents.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-900 rounded-xl text-center space-y-1">
                  <p className="text-xs text-slate-500">No documents indexed yet.</p>
                  <p className="text-[10px] text-slate-600">Upload a PDF or TXT file above to enable RAG grounding.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`group flex items-center justify-between p-3 rounded-xl transition duration-200 border ${
                      selectedDocId === doc.id
                        ? 'bg-violet-950/30 border-violet-500/40 shadow-sm'
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-900/80 hover:border-slate-800/80'
                    }`}
                  >
                    <div
                      className="min-w-0 flex-1 pr-2 space-y-1 cursor-pointer"
                      onClick={() => setSelectedDocId && setSelectedDocId(selectedDocId === doc.id ? '' : doc.id)}
                    >
                      <p className="text-xs font-semibold text-slate-200 truncate" title={doc.filename}>
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{(doc.size / 1024).toFixed(0)} KB</span>
                        <span>•</span>
                        <span className="capitalize font-bold text-emerald-500/80">
                          {doc.processing_status} ({doc.chunk_count || 0})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDoc(doc.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-rose-500 p-1.5 rounded-lg border border-transparent hover:border-rose-500/20 transition cursor-pointer shrink-0"
                      title="Delete document"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Profile & Status Footer */}
        <div className="p-4 border-t border-slate-900/50 bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                {user?.username?.slice(0, 2) || 'US'}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.username || 'User'}</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mt-0.5 scale-90 -translate-x-1 origin-left border ${roleClass}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hover:bg-slate-800 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg border border-slate-900 transition cursor-pointer"
              title="Sign Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${backendStatus?.status?.includes('Online') ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-400 shadow-amber-400/50'} shadow-sm`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {backendStatus?.status || 'UI Prototype'}
                </span>
              </div>
              <span className="text-[9px] text-cyan-400 font-semibold">
                {backendStatus?.version || 'v0.2.0'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
