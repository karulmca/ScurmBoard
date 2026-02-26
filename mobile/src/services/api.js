import { Platform } from 'react-native';

/**
 * Base URL for the Express gateway.
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  Platform      │  Host to reach "localhost" on PC   │
 * │─────────────────────────────────────────────────────│
 * │  Android emu   │  10.0.2.2                          │
 * │  iOS sim       │  127.0.0.1 / localhost             │
 * │  Web (Expo)    │  localhost                         │
 * └─────────────────────────────────────────────────────┘
 *
 * For a real device on the same network, replace with the PC's LAN IP
 * e.g. http://192.168.1.x:3000
 */
const GATEWAY_HOST =
  Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const BASE_URL = `http://${GATEWAY_HOST}:3000/api`;

// ── Generic request helper ────────────────────────────────────────────────────
async function request(method, path, body, isFormData = false) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const resp = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (resp.status === 204) return null;

  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!resp.ok) {
    const msg = data?.detail || data?.error || `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return data;
}

// ── Work Items ────────────────────────────────────────────────────────────────
/**
 * @param {{ type?, state?, assigned_to?, sprint?, search? }} filters
 */
export function getWorkItems(filters = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null && v !== ''))
  ).toString();
  return request('GET', `/workitems${qs ? '?' + qs : ''}`);
}

export function createWorkItem(payload) {
  return request('POST', '/workitems', payload);
}

export function deleteWorkItem(taskId) {
  return request('DELETE', `/workitems/${taskId}`);
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export function getTasks() {
  return request('GET', '/tasks');
}

export function updateTaskStatus(taskId, payload) {
  return request('PATCH', `/tasks/${taskId}`, payload);
}

export function getTaskUpdates(taskId) {
  return request('GET', `/tasks/${taskId}/updates`);
}

// ── Reports ───────────────────────────────────────────────────────────────────
export function getDailyReport()   { return request('GET', '/reports/daily');   }
export function getWeeklyReport()  { return request('GET', '/reports/weekly');  }
export function getMonthlyReport() { return request('GET', '/reports/monthly'); }

// ── Import (file upload) ──────────────────────────────────────────────────────
/**
 * @param {{ uri: string, name: string, type: string }} file  — from expo-document-picker
 */
export async function uploadAdoDump(file) {
  const formData = new FormData();
  formData.append('file', {
    uri:  file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  });
  return request('POST', '/import', formData, true);
}
