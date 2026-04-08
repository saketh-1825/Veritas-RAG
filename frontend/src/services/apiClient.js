import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rag_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: gracefully intercept auth expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('rag_token');
    if (error.response?.status === 401 && token &&
        error.config?.headers?.Authorization === `Bearer ${token}`) {
      localStorage.removeItem('rag_token');
      window.dispatchEvent(new Event('rag:session-expired'));
    }
    return Promise.reject(error);
  }
);

export function getApiError(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg).filter(message => typeof message === 'string').join('; ') || 'Invalid request';
  }
  return error.message || 'Could not reach the server. Please try again.';
}

export async function checkBackendHealth() {
  try {
    const response = await apiClient.get('/api/health', { timeout: 3500 });
    return {
      online: true,
      data: response.data,
    };
  } catch (err) {
    return {
      online: false,
      error: err.message,
    };
  }
}

export default apiClient;
