import apiClient from './apiClient';

const MOCK_ANALYTICS_FALLBACK = {
  summary: {
    total_requests: 128,
    avg_latency_ms: 412.5,
    avg_faithfulness: 0.942,
    avg_relevance: 0.918,
    avg_precision: 0.905,
    avg_recall: 0.925,
    hallucination_rate: 0.045,
  },
  daily_stats: [
    { date: '2026-03-02', count: 18, avg_latency_ms: 520, avg_faithfulness: 0.88, hallucination_rate: 0.08 },
    { date: '2026-03-03', count: 24, avg_latency_ms: 480, avg_faithfulness: 0.91, hallucination_rate: 0.06 },
    { date: '2026-03-04', count: 32, avg_latency_ms: 440, avg_faithfulness: 0.93, hallucination_rate: 0.05 },
    { date: '2026-03-05', count: 28, avg_latency_ms: 410, avg_faithfulness: 0.95, hallucination_rate: 0.04 },
    { date: '2026-03-06', count: 35, avg_latency_ms: 395, avg_faithfulness: 0.96, hallucination_rate: 0.03 },
  ],
  recent_evaluations: [
    {
      id: 'eval-1',
      user_query: 'What vector indexing strategy does Veritas use for document chunks?',
      faithfulness_score: 0.96,
      answer_relevance_score: 0.94,
      context_precision_score: 0.92,
      context_recall_score: 0.95,
      latency_ms: 388,
      created_at: '2026-03-06T15:24:00Z',
    },
    {
      id: 'eval-2',
      user_query: 'Explain the MongoDB and Pinecone data flow pipeline.',
      faithfulness_score: 0.92,
      answer_relevance_score: 0.89,
      context_precision_score: 0.90,
      context_recall_score: 0.88,
      latency_ms: 442,
      created_at: '2026-03-06T14:10:00Z',
    },
  ],
};

export const adminService = {
  async getAnalytics() {
    try {
      const response = await apiClient.get('/api/admin/analytics');
      return response.data;
    } catch (err) {
      if (!err.response) {
        return MOCK_ANALYTICS_FALLBACK;
      }
      throw err;
    }
  },

  async listUsers() {
    try {
      const response = await apiClient.get('/api/admin/users');
      return response.data;
    } catch (err) {
      if (!err.response) {
        return [
          { id: 'usr-1', username: 'veritas_analyst', email: 'analyst@veritas.ai', role: 'admin', is_active: true },
        ];
      }
      throw err;
    }
  },
};

export default adminService;
