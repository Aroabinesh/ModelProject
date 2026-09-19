// Thin fetch wrapper around the Work Order Management API (see swagger at
// {BASE_URL}/swagger/index.html). Centralizes the base URL, JSON handling,
// and ProblemDetails error parsing so workOrdersApi.js can stay focused on
// endpoint shapes.

export const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5001';

export function getCurrentUser() {
  return localStorage.getItem('username') || 'System';
}

function getToken() {
  return localStorage.getItem('authToken');
}

function clearSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('username');
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function parseErrorResponse(response) {
  let problem = null;
  try {
    problem = await response.json();
  } catch {
    // Non-JSON error body (e.g. plain text or empty) - fall through.
  }

  const err = new Error(problem?.title || problem?.detail || `Request failed with status ${response.status}.`);
  err.status = response.status;

  if (problem?.errors && typeof problem.errors === 'object') {
    err.fieldErrors = Object.fromEntries(
      Object.entries(problem.errors).map(([field, messages]) => [
        field.charAt(0).toLowerCase() + field.slice(1),
        Array.isArray(messages) ? messages.join(' ') : String(messages),
      ])
    );
  }

  return err;
}

export async function request(path, { method = 'GET', query, body } = {}) {
  const token = getToken();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(
      `Could not reach the API at ${BASE_URL}. Confirm the backend is running and its HTTPS certificate is trusted in this browser.`
    );
  }

  if (response.status === 401 && path !== '/api/auth/login') {
    clearSession();
    window.location.assign('/login');
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
