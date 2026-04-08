import React, { useState } from 'react';

const SUGGESTED_PROMPTS = [
  'What vector indexing strategy does Veritas use for document chunks?',
  'Explain the MongoDB and Pinecone data flow pipeline.',
  'How does the 4-metric evaluation layer detect hallucinations?',
  'What chunk size and overlap parameters are recommended for technical PDFs?',
];

export default function ChatConsole({
  chatHistory = [],
  chatInput = '',
  setChatInput,
  chatLoading = false,
  handleSendMessage,
  documents = [],
  selectedDocId = '',
  setSelectedDocId,
  expandedCitationIndex = null,
  setExpandedCitationIndex,
  messagesEndRef,
  user,
  onOpenMobileMenu,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [copyError, setCopyError] = useState(null);

  const handleCopyCitation = async (text, key) => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setCopyError(key);
      return;
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 1800);
  };

  const handleQuickPrompt = (promptText) => {
    if (setChatInput) {
      setChatInput(promptText);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Console Header */}
      <header className="min-h-16 px-4 py-3 sm:px-6 flex-wrap gap-3 border-b border-slate-900/60 bg-slate-950/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
              title="Open Navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="font-bold text-base tracking-tight text-white">RAG Grounded Console</h1>
          <span className="px-2 py-0.5 bg-violet-600/10 text-violet-400 border border-violet-500/10 rounded-full text-[10px] font-semibold hidden sm:inline-block">
            Live Evaluation Layer
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">Grounding context:</span>
          <select
            aria-label="Grounding context"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-violet-500/50 transition max-w-[200px] sm:max-w-xs truncate"
          >
            <option value="">🔍 All Ingested Knowledge</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                📄 {doc.filename.slice(0, 26)}{doc.filename.length > 26 ? '...' : ''}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center uppercase shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600/20 border-cyan-500/30 text-cyan-400'
                    : 'bg-violet-600/20 border-violet-500/30 text-violet-400'
                }`}
              >
                {msg.sender === 'user' ? (user?.username?.slice(0, 2) || 'ME') : 'AI'}
              </div>
              <div className="flex flex-col min-w-0 max-w-2xl space-y-2">
                <div
                  className={`text-sm rounded-2xl p-4 shadow-sm leading-relaxed border ${
                    msg.sender === 'user'
                      ? 'bg-slate-900/60 border-slate-800 text-slate-100 rounded-tr-none'
                      : 'bg-slate-950/30 border-slate-900/80 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words font-medium">{msg.text}</div>
                  {msg.sender === 'assistant' && (
                    <div className="mt-4 pt-3.5 border-t border-slate-900/80 space-y-4 text-[11px] text-slate-500">
                      <div className="flex items-center justify-between text-slate-500 font-semibold px-0.5">
                        {msg.responseTime !== undefined && (
                          <span>⏱ Generation: <strong>{Number(msg.responseTime).toFixed(2)}s</strong></span>
                        )}
                        {msg.citations && msg.citations.length > 0 && (
                          <span>📚 Grounding: <strong>{msg.citations.length} sources</strong></span>
                        )}
                      </div>

                      {/* 4-Metric Evaluation Breakdown */}
                      {msg.evaluation && (
                        <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3.5 space-y-3.5">
                          <div className="flex items-center justify-between font-bold text-slate-300">
                            <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider">
                              📊 Evaluation Framework ({msg.evaluation.framework || 'DeepEval / Ragas'})
                            </span>
                            <span className="font-semibold text-[10px] text-slate-500">
                              Eval Latency: {Number(msg.evaluation.latency_ms || 0).toFixed(0)} ms
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                            <div className="space-y-1">
                              <div className="flex justify-between font-medium">
                                <span>Faithfulness</span>
                                <span className={`font-bold ${Number(msg.evaluation.faithfulness || 0) >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {(Number(msg.evaluation.faithfulness || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.max(0, Number(msg.evaluation.faithfulness || 0) * 100))}%` }}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between font-medium">
                                <span>Answer Relevance</span>
                                <span className={`font-bold ${Number(msg.evaluation.answer_relevance || 0) >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {(Number(msg.evaluation.answer_relevance || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.max(0, Number(msg.evaluation.answer_relevance || 0) * 100))}%` }}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between font-medium">
                                <span>Context Precision</span>
                                <span className="font-bold text-cyan-400">
                                  {(Number(msg.evaluation.context_precision || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.max(0, Number(msg.evaluation.context_precision || 0) * 100))}%` }}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between font-medium">
                                <span>Context Recall</span>
                                <span className="font-bold text-cyan-400">
                                  {(Number(msg.evaluation.context_recall || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.max(0, Number(msg.evaluation.context_recall || 0) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Retrieved Citation Cards */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="space-y-2">
                          {msg.citations.map((cite, cIdx) => {
                            const key = `${index}-${cIdx}`;
                            const isExpanded = expandedCitationIndex === key;
                            return (
                              <div
                                key={key}
                                className="bg-slate-950/40 border border-slate-900 rounded-lg overflow-hidden transition"
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedCitationIndex(isExpanded ? null : key)}
                                  className="w-full text-left px-3 py-2 bg-slate-950/20 hover:bg-slate-900/30 flex items-center justify-between text-[11px] font-semibold text-slate-400 cursor-pointer"
                                >
                                  <span className="truncate text-violet-400">
                                    [{cIdx + 1}] {cite.filename} (Chunk {cite.chunk_index})
                                  </span>
                                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                                    Score: {Number(cite.score || 0).toFixed(3)} {isExpanded ? '▲' : '▼'}
                                  </span>
                                </button>
                                {isExpanded && (
                                  <div className="p-3 bg-slate-950/80 border-t border-slate-900 space-y-2">
                                    <div className="text-slate-300 font-mono text-[11px] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-text">
                                      {cite.text}
                                    </div>
                                    {copyError === key && <p role="alert">Copy failed. Select the context text to copy it manually.</p>}
                                    <div className="flex justify-end pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleCopyCitation(cite.text, key)}
                                        className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                                      >
                                        {copiedKey === key ? '✓ Copied' : '📋 Copy Context'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                AI
              </div>
              <div className="bg-slate-900/20 border border-slate-900/80 border-dashed rounded-2xl rounded-tl-none p-4 max-w-xl text-sm text-slate-500 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching knowledge base and calculating evaluation metrics...</span>
              </div>
            </div>
          )}

          {/* Quick Suggested Prompts (shown when only initial greeting exists) */}
          {chatHistory.length <= 1 && (
            <div className="pt-4 space-y-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Suggested exploration queries:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="text-left p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 border border-slate-900 hover:border-violet-500/30 text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Query Bar */}
      <div className="p-6 border-t border-slate-900/50 bg-[#0b0c10] shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              aria-label="Your question"
              type="text"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 text-slate-100 placeholder-slate-600 rounded-2xl pl-4 pr-16 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition leading-normal"
              placeholder={chatLoading ? 'Reasoning in progress...' : 'Ask Veritas RAG... (e.g., Explain vector indexing strategy)'}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 active:scale-[0.98] transition cursor-pointer"
              disabled={chatLoading || !chatInput.trim()}
            >
              Send
            </button>
          </form>
          <p className="text-[10px] text-slate-600 text-center mt-2.5">
            Veritas Enterprise RAG Console. Grounded vector retrieval with multi-metric evaluation layer.
          </p>
        </div>
      </div>
    </div>
  );
}
