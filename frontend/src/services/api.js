import { getAuthToken } from './auth.js';

const API_BASE = "http://localhost:3000/api";

// ── Helper function to get auth headers ───────────────────────────────────────
function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

// ── Helper fetch functions with CORS and auth support ─────────────────────────
async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies in cross-origin requests
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function patchJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function deleteJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── User & Role Management ──────────────────────────────────────────────────
export const getUser = (userId) => fetchJson(`/users/${userId}`);
export const listUsers = () => fetchJson(`/users`);
export const createUser = (data) => postJson(`/users`, data);
export const updateUser = (userId, data) => patchJson(`/users/${userId}`, data);
export const deleteUser = (userId) => deleteJson(`/users/${userId}`);
export const getProjectRole = (userId, projectId) => fetchJson(`/projects/${projectId}/roles/${userId}`);
export const assignRole = (data) => postJson(`/projects/${data.project_id}/roles`, data);
export const updateRole = (roleId, data) => patchJson(`/roles/${roleId}`, data);
export const deleteRole = (roleId) => deleteJson(`/roles/${roleId}`);
export const getDailyReport   = () => fetchJson("/reports/daily");
export const getWeeklyReport  = () => fetchJson("/reports/weekly");
export const getMonthlyReport = () => fetchJson("/reports/monthly");

// ── Work items (new ADO endpoints) ───────────────────────────────────
export function getWorkItems({ type, state, assigned_to, sprint, search } = {}) {
  const params = new URLSearchParams();
  if (type)        params.set("work_item_type", type);
  if (state)       params.set("state", state);
  if (assigned_to) params.set("assigned_to", assigned_to);
  if (sprint)      params.set("sprint", sprint);
  if (search)      params.set("search", search);
  const qs = params.toString();
  return fetchJson(`/workitems${qs ? `?${qs}` : ""}`);
}

export function createWorkItem(payload) {
  return postJson("/workitems", payload);
}

export async function updateWorkItem(taskId, payload) {
  return patchJson(`/workitems/${encodeURIComponent(taskId)}`, payload);
}

export async function deleteWorkItem(taskId) {
  await deleteJson(`/workitems/${encodeURIComponent(taskId)}`);
}

// ── Legacy task list (kept for Dashboard backward-compat) ─────────────
export const getTasks = () => fetchJson("/tasks");

// ── Import ────────────────────────────────────────────────────────────
export async function uploadAdoDump(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  // For file uploads, we use a custom fetch to handle FormData properly
  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}/import`, {
    method: "POST",
    headers,
    body: formData,
    credentials: 'include',
  });
  
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || "Upload failed");
  }
  return res.json();
}

// ── Task status patch ─────────────────────────────────────────────────
export async function updateTaskStatus(taskId, payload) {
  return patchJson(`/tasks/${encodeURIComponent(taskId)}`, payload);
}

// ── Task update history ────────────────────────────────────────────────
export const getTaskUpdates = (taskId) => fetchJson(`/tasks/${encodeURIComponent(taskId)}/updates`);

// ── Organizations ──────────────────────────────────────────────────────
export const getOrganizations  = ()           => fetchJson("/organizations");
export const createOrganization = (data)      => postJson("/organizations", data);
export const updateOrganization = (orgId, data) => patchJson(`/organizations/${orgId}`, data);
export const deleteOrganization = (orgId)     => deleteJson(`/organizations/${orgId}`);

// ── Projects ───────────────────────────────────────────────────────────
export const getProjects   = (orgId) => fetchJson(`/projects${orgId ? `?org_id=${orgId}` : ""}`);
export const getProject    = (id)    => fetchJson(`/projects/${id}`);
export const createProject = (data)  => postJson("/projects", data);
export const updateProject = (id, data) => patchJson(`/projects/${id}`, data);
export const deleteProject = (id)    => deleteJson(`/projects/${id}`);

// ── Sprints ────────────────────────────────────────────────────────────
// ── Team Members ───────────────────────────────────────────────────────
// ── Retrospectives ─────────────────────────────────────────────────────
export const getRetrospective = (sprintId) => fetchJson(`/sprints/${sprintId}/retrospective`);
export const createRetrospective = (sprintId, data) => postJson(`/sprints/${sprintId}/retrospective`, data);
export const updateRetrospective = (sprintId, data) => patchJson(`/sprints/${sprintId}/retrospective`, data);
export const getTeamMembers = (projectId) => fetchJson(`/projects/${projectId}/team_members`);
export const addTeamMember = (projectId, data) => postJson(`/projects/${projectId}/team_members`, data);
export const updateTeamMember = (projectId, memberId, data) => patchJson(`/projects/${projectId}/team_members/${memberId}`, data);
export const deleteTeamMember = (projectId, memberId) => deleteJson(`/projects/${projectId}/team_members/${memberId}`);
// ── Sprints ────────────────────────────────────────────────────────────
export const getSprints    = (projectId) => fetchJson(`/projects/${projectId}/sprints`);
export const createSprint  = (projectId, data) => postJson(`/projects/${projectId}/sprints`, data);
export const updateSprint  = (sprintId, data) => patchJson(`/sprints/${sprintId}`, data);
export const activateSprint = (sprintId) => postJson(`/sprints/${sprintId}/activate`, {});
export const completeSprint = (sprintId) => postJson(`/sprints/${sprintId}/complete`, {});
export const deleteSprint  = (sprintId) => deleteJson(`/sprints/${sprintId}`);

// ── Config ─────────────────────────────────────────────────────────────────

/** Return the effective config for an org (or global defaults). */
export async function getConfig(orgId = null) {
  const q = orgId != null ? `?org_id=${orgId}` : "";
  return fetchJson(`/config${q}`);
}

/** Return the raw system defaults (no org overrides). */
export async function getConfigDefaults() {
  return fetchJson("/config/defaults");
}

/**
 * Create or update one config key.
 * @param {string}      configKey  e.g. "work_item_types"
 * @param {any}         value      Any JSON-serialisable value
 * @param {number|null} orgId      null = global override
 */
export async function upsertConfig(configKey, value, orgId = null) {
  return postJson("/config", { config_key: configKey, value, org_id: orgId });
}

/**
 * Reset a config key to system defaults by deleting the override.
 * @param {string}      configKey
 * @param {number|null} orgId      null = delete global override
 */
export async function resetConfig(configKey, orgId = null) {
  const q = orgId != null ? `?org_id=${orgId}` : "";
  const res = await fetch(`${API_BASE}/config/${configKey}${q}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Reset failed: ${res.status}`);
}

// ── Teams ──────────────────────────────────────────────────────────────────
export const getTeams           = () => fetchJson("/teams");
export const createTeam         = (data) => postJson("/teams", data);
export const updateTeam         = (id, data) => patchJson(`/teams/${id}`, data);
export const deleteTeam         = (id) => deleteJson(`/teams/${id}`);

// ── Team members ───────────────────────────────────────────────────────────
export const getTeamMembers2 = (teamId)         => fetchJson(`/teams/${teamId}/members`);
export const addUserToTeam   = (teamId, payload) => postJson(`/teams/${teamId}/members`, payload);
export const removeUserFromTeam = (teamId, userId) => deleteJson(`/teams/${teamId}/members/${userId}`);

// ── Project ↔ Team mapping ──────────────────────────────────────────────────
export const getProjectTeams = (projectId) => fetchJson(`/projects/${projectId}/teams`);
export const assignTeamToProject = (projectId, teamId) => postJson(`/projects/${projectId}/teams/${teamId}`, {});
export const unassignTeamFromProject = (projectId, teamId) => deleteJson(`/projects/${projectId}/teams/${teamId}`);

export const checkProjectAccess = (projectId, userId) => fetchJson(`/projects/${projectId}/access/${userId}`);
