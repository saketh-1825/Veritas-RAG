import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

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
    if (token && !token.startsWith('mock_')) {
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
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('rag_token');
      if (token && !token.startsWith('mock_')) {
        localStorage.removeItem('rag_token');
      }
    }
    return Promise.reject(error);
  }
);

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
