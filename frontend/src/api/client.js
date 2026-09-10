const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error || `Request failed (${res.status})`
    );
  }

  return data;
}

export const api = {
  // AUTH
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: payload
    }),

  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: payload
    }),

  changePassword: (payload) =>
    request('/auth/change-password', {
      method: 'POST',
      body: payload
    }),

  resetWithOldPassword: (payload) =>
    request('/auth/forgot-password/reset-with-old-password', {
      method: 'POST',
      body: payload
    }),

  requestOtp: (payload) =>
    request('/auth/forgot-password/request-otp', {
      method: 'POST',
      body: payload
    }),

  resetWithOtp: (payload) =>
    request('/auth/forgot-password/reset-with-otp', {
      method: 'POST',
      body: payload
    }),

  // USER
  getProfile: () => request('/users/me'),

  updateProfile: (payload) =>
    request('/users/me', {
      method: 'PATCH',
      body: payload
    }),

  deleteAccount: (payload) =>
    request('/users/me', {
      method: 'DELETE',
      body: payload
    }),

  // FAMILIES
  getFamilies: () => request('/families'),

  createFamily: (payload) =>
    request('/families', {
      method: 'POST',
      body: payload
    }),

  joinFamily: (payload) =>
    request('/families/join', {
      method: 'POST',
      body: payload
    }),

  getFamilyMembers: (familyId) =>
    request(`/families/${familyId}/members`),

  inviteToFamily: (familyId, payload) =>
    request(`/families/${familyId}/invite`, {
      method: 'POST',
      body: payload
    }),

  addRelative: (familyId, payload) =>
    request(`/families/${familyId}/relatives`, {
      method: 'POST',
      body: payload
    }),

  updateRelative: (familyId, relativeId, payload) =>
    request(`/families/${familyId}/relatives/${relativeId}`, {
      method: 'PATCH',
      body: payload
    }),

  removeRelative: (familyId, relativeId) =>
    request(`/families/${familyId}/relatives/${relativeId}`, {
      method: 'DELETE'
    }),

  deleteFamily: (familyId) =>
    request(`/families/${familyId}`, {
      method: 'DELETE'
    }),

  // DASHBOARD
  getDashboard: (familyId) =>
    request(`/dashboard/${familyId}`),

  // CARE ITEMS
  getCareItems: (familyId) =>
    request(`/care-items/${familyId}`),

  createCareItem: (payload) =>
    request('/care-items', {
      method: 'POST',
      body: payload
    }),

  updateCareItem: (id, payload) =>
    request(`/care-items/item/${id}`, {
      method: 'PATCH',
      body: payload
    }),

  // LOAN ITEMS
  getLoanItems: (familyId) =>
    request(`/loan-items/${familyId}`),

  getLoanSummary: (familyId) =>
    request(`/loan-items/${familyId}/summary`),

  createLoanItem: (payload) =>
    request('/loan-items', {
      method: 'POST',
      body: payload
    }),

  updateLoanItem: (id, payload) =>
    request(`/loan-items/item/${id}`, {
      method: 'PATCH',
      body: payload
    }),

  // TASKS
  getTasks: (familyId) =>
    request(`/tasks/${familyId}`),

  createTask: (payload) =>
    request('/tasks', {
      method: 'POST',
      body: payload
    }),

  updateTask: (id, payload) =>
    request(`/tasks/item/${id}`, {
      method: 'PATCH',
      body: payload
    }),

  remindTask: (id) =>
    request(`/tasks/item/${id}/remind`, {
      method: 'POST'
    })
};