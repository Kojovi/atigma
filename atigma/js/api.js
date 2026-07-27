// Shared API helper used by every page.
// All requests go to the PHP scripts in the api/ folder, e.g.
// apiGet('/products') calls api/products.php.

const API_BASE = 'api';
const TOKEN_KEY = 'atigma_admin_token';

function endpointUrl(path) {
  return `${API_BASE}${path}.php`;
}

function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setAdminToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}
function isLoggedIn() {
  return !!getAdminToken();
}

async function apiGet(path) {
  const res = await fetch(endpointUrl(path));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiSend(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(endpointUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function formatPrice(v) {
  const n = Number(v);
  return 'GHS ' + n.toFixed(2);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
