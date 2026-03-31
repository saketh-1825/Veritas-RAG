import React from 'react';

function drawSparkline(dataList, key, width = 400, height = 160) {
  if (!dataList || dataList.length < 2) return null;
  const padding = 15;
  const values = dataList.map(d => Number(d[key] ?? d.avg_latency ?? 0));
  const maxVal = Math.max(...values, 0.1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;
  const points = dataList.map((d, i) => {
    const x = padding + (i / (dataList.length - 1)) * (width - 2 * padding);
    const val = Number(d[key] ?? d.avg_latency ?? 0);
    const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
    return { x, y, date: d.date, val };
  });
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return { points, pathData };
}

export default function AnalyticsView({
  analyticsData,
  analyticsLoading = false,
  analyticsError = null,
  fetchAnalytics,
  onOpenMobileMenu,
}) {
  const summary = analyticsData?.summary || {
    total_requests: 0,
    avg_latency_ms: 0,
    avg_faithfulness: 0,
    hallucination_rate: 0,
  };

  const dailyStats = analyticsData?.daily_stats || [];
  const recentEvals = analyticsData?.recent_evaluations || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <header className="h-16 px-6 border-b border-slate-900/60 bg-slate-950/30 flex items-center justify-between shrink-0">
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
          <h1 className="font-bold text-base tracking-tight text-white font-display">System Analytics</h1>
          <span className="px-2 py-0.5 bg-cyan-600/10 text-cyan-400 border border-cyan-500/10 rounded-full text-[10px] font-semibold hidden sm:inline-block">
            Evaluation Layer
          </span>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={analyticsLoading}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-3.5 py-1.5 rounded-lg font-semibold active:scale-[0.98] transition cursor-pointer flex items-center gap-2"
        >
          {analyticsLoading ? (
            <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span>🔄</span>
          )}
          <span>Refresh Stats</span>
        </button>
      </header>

      {/* Analytics Content */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 space-y-8 bg-[#0b0c10]">
        {analyticsError && (
          <div className="max-w-5xl mx-auto p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {analyticsError}
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Requests</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{summary.total_requests}</p>
              <p className="text-[10px] text-slate-600">Evaluations recorded</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Latency</p>
              <p className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {Number(summary.avg_latency_ms || 0).toFixed(0)} ms
              </p>
              <p className="text-[10px] text-slate-600">Round-trip execution</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Faithfulness</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
                {(Number(summary.avg_faithfulness || 0) * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-slate-600">Zero-hallucination score</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hallucination Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-rose-400">
                {(Number(summary.hallucination_rate || 0) * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-600">Faithfulness &lt; 0.80</p>
            </div>
          </div>

          {/* Sparkline Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300">Retrieval & Generation Latency</h3>
                <p className="text-[10px] text-slate-500">Average millisecond duration per day</p>
              </div>
              <div className="h-44 w-full flex items-center justify-center bg-slate-950/60 border border-slate-900/60 rounded-xl relative overflow-hidden">
                {(() => {
                  const chart = drawSparkline(dailyStats, 'avg_latency_ms', 400, 160) || drawSparkline(dailyStats, 'avg_latency', 400, 160);
                  if (!chart) return <p className="text-xs text-slate-600 italic">No historical trend data yet</p>;
                  return (
                    <svg className="w-full h-full" viewBox="0 0 400 160">
                      <line x1="15" y1="80" x2="385" y2="80" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                      <path d={chart.pathData} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                      {chart.points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#06b6d4" />
                      ))}
                    </svg>
                  );
                })()}
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300">Faithfulness Metric Trend</h3>
                <p className="text-[10px] text-slate-500">Daily average score trend</p>
              </div>
              <div className="h-44 w-full flex items-center justify-center bg-slate-950/60 border border-slate-900/60 rounded-xl relative overflow-hidden">
                {(() => {
                  const chart = drawSparkline(dailyStats, 'avg_faithfulness', 400, 160);
                  if (!chart) return <p className="text-xs text-slate-600 italic">No historical trend data yet</p>;
                  return (
                    <svg className="w-full h-full" viewBox="0 0 400 160">
                      <line x1="15" y1="80" x2="385" y2="80" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                      <path d={chart.pathData} fill="none" stroke="#10b981" strokeWidth="2.5" />
                      {chart.points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
                      ))}
                    </svg>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Recent Evaluations Table */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-300">Recent Pipeline Evaluations</h3>
              <p className="text-[10px] text-slate-500">Audit log with 4-metric scoring</p>
            </div>
            <div className="overflow-x-auto border border-slate-900 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-500 border-b border-slate-900">
                    <th className="p-3 font-semibold">User Query</th>
                    <th className="p-3 font-semibold text-center">Faithful</th>
                    <th className="p-3 font-semibold text-center">Relevance</th>
                    <th className="p-3 font-semibold text-center">Precision</th>
                    <th className="p-3 font-semibold text-center">Recall</th>
                    <th className="p-3 font-semibold text-center">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {recentEvals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-600 italic">
                        No evaluation records stored yet. Run queries in the RAG Chat Console to generate evaluations.
                      </td>
                    </tr>
                  ) : (
                    recentEvals.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-900/20 text-slate-300">
                        <td className="p-3 font-medium truncate max-w-xs" title={ev.user_query}>
                          {ev.user_query}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">
                          {(Number(ev.faithfulness_score ?? 0) * 100).toFixed(0)}%
                        </td>
                        <td className="p-3 text-center">
                          {(Number(ev.answer_relevance_score ?? 0) * 100).toFixed(0)}%
                        </td>
                        <td className="p-3 text-center">
                          {(Number(ev.context_precision_score ?? 0) * 100).toFixed(0)}%
                        </td>
                        <td className="p-3 text-center">
                          {(Number(ev.context_recall_score ?? 0) * 100).toFixed(0)}%
                        </td>
                        <td className="p-3 text-center text-cyan-400">
                          {ev.latency_ms ? `${Number(ev.latency_ms).toFixed(0)} ms` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
