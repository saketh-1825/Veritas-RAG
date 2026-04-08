import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Load the real client with Vite's environment handling; no backend or test framework needed.
const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.window = new EventTarget();
let expired = 0;
window.addEventListener('rag:session-expired', () => expired++);

try {
  const { default: client, getApiError } = await server.ssrLoadModule('/src/services/apiClient.js');
  assert.equal(client.defaults.baseURL, process.env.VITE_API_BASE_URL || process.env.VITE_API_URL || '');
  assert.equal(getApiError({ response: { data: { detail: [{ msg: 'Invalid email' }, { msg: 'Too short' }] } } }), 'Invalid email; Too short');
  assert.equal(getApiError({ response: { data: { detail: 'Access denied' } } }), 'Access denied');
  assert.equal(getApiError(new Error('Network Error')), 'Network Error');
  assert.equal(getApiError({ response: { data: { detail: {} } } }), 'Could not reach the server. Please try again.');

  localStorage.setItem('rag_token', 'first-session');
  await client.get('/api/documents', { adapter: async config => {
    assert.equal(config.headers.Authorization, 'Bearer first-session');
    return { data: [], status: 200, config };
  } });
  const unauthorized = config => Promise.reject({ response: { status: 401 }, config });
  await assert.rejects(client.get('/api/auth/me', { adapter: unauthorized }));
  assert.equal(localStorage.getItem('rag_token'), null);
  assert.equal(expired, 1);

  localStorage.setItem('rag_token', 'old-session');
  await assert.rejects(client.get('/api/admin/analytics', { adapter: config => {
    localStorage.setItem('rag_token', 'new-session');
    return unauthorized(config);
  } }));
  assert.equal(localStorage.getItem('rag_token'), 'new-session', 'A late 401 must not sign out a newer session');
  assert.equal(expired, 1);

  await assert.rejects(client.get('/api/auth/me', { adapter: config => Promise.reject({ response: { status: 503 }, config }) }));
  assert.equal(localStorage.getItem('rag_token'), 'new-session', 'An outage must not discard the session');
  console.log('PASS: API URL, bearer token, validation errors, session expiry, stale responses, and outage handling');
} finally {
  await server.close();
}
