const API =
  import.meta.env.VITE_API_URL ||
  "https://swasthya-sakha.onrender.com/api";

export async function apiFetch(path, options = {}) {
  const auth = JSON.parse(localStorage.getItem("ss_auth") || "null");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

  const r = await fetch(`${API}${path}`, { ...options, headers });
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({}));
    const err = new Error(errorData.message || `Request failed (${r.status})`);
    err.response = { status: r.status, data: errorData };
    throw err;
  }

  return r.json();
}

// Helper methods so api.post() and api.get() work directly across frontend components
export const api = {
  get: (path, options = {}) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
};

export { API };