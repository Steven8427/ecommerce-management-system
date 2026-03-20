const API_BASE = 'http://192.168.0.114:108';

function getToken() {
  return localStorage.getItem('auth_token') || '';
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

export function apiGet(url) {
  return fetch(API_BASE + url, {
    headers: authHeaders(),
  }).then(r => r.json()).then(res => {
    if (res.code === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return res;
  });
}

export function apiPost(url, data) {
  return fetch(API_BASE + url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export function apiPut(url, data) {
  return fetch(API_BASE + url, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  }).then(r => r.json());
}

export function apiDelete(url) {
  return fetch(API_BASE + url, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(r => r.json());
}

export function apiUpload(url, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return fetch(API_BASE + url, {
    method: 'POST',
    headers,
    body: formData
  }).then(r => r.json());
}

export default API_BASE;
