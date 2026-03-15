import axios from 'axios';

// ================================================================
// IMPORTANT: Replace this URL with your deployed GAS Web App URL
// Format: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
// ================================================================
const GAS_URL = import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// Axios instance
const api = axios.create({
  baseURL: GAS_URL,
  timeout: 15000,
});

// ----------------------------------------------------------------
// GET Requests
// ----------------------------------------------------------------
export const getProjects = async () => {
  const res = await api.get('', { params: { action: 'getProjects' } });
  return res.data;
};

export const getTransactions = async () => {
  const res = await api.get('', { params: { action: 'getTransactions' } });
  return res.data;
};

export const getProjectById = async (id) => {
  const res = await api.get('', { params: { action: 'getProjectById', id } });
  return res.data;
};

export const getTransactionsByProject = async (project_id) => {
  const res = await api.get('', { params: { action: 'getTransactionsByProject', project_id } });
  return res.data;
};

// ----------------------------------------------------------------
// POST Requests
// GAS has CORS redirect issue with JSON content-type.
// Workaround: send as text/plain to avoid preflight, then parse on GAS side.
// ----------------------------------------------------------------
const postToGAS = async (action, payload) => {
  const body = JSON.stringify({ action, payload });
  // Use fetch with no-cors mode isn't helpful for reading response,
  // so we use axios with text/plain to avoid OPTIONS preflight
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'text/plain',
    },
    redirect: 'follow',
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { result: 'success', raw: text };
  }
};

export const addProject = async (payload) => postToGAS('addProject', payload);
export const addTransaction = async (payload) => postToGAS('addTransaction', payload);
export const updateProjectStatus = async (payload) => postToGAS('updateProjectStatus', payload);

export default api;
