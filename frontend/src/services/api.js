// ── User & Role Management ─────────────────────────────────────────────
export const getUser = (userId) => fetchJson(`/users/${userId}`);
export const createUser = (data) => postJson(`/users`, data);
export async function updateUser(userId, data) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Update failed"); }
  return res.json();
}
export async function getProjectRole(userId, projectId) {
  return fetchJson(`/projects/${projectId}/roles/${userId}`);
}
export async function assignRole(data) {
  return postJson(`/projects/${data.project_id}/roles`, data);
}
export async function updateRole(roleId, data) {
  const res = await fetch(`${API_BASE}/roles/${roleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Update failed"); }
  return res.json();
}
const API_BASE = "http://localhost:3000/api";

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Reports ──────────────────────────────────────────────────────────
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
  const res = await fetch(`${API_BASE}/workitems/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Update failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteWorkItem(taskId) {
  const res = await fetch(`${API_BASE}/workitems/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete failed: ${res.status}`);
  }
}

// ── Legacy task list (kept for Dashboard backward-compat) ─────────────
export const getTasks = () => fetchJson("/tasks");

// ── Import ────────────────────────────────────────────────────────────
export async function uploadAdoDump(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/import`, { method: "POST", body: formData });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || "Upload failed");
  }
  return res.json();
}

// ── Task status patch ─────────────────────────────────────────────────
export async function updateTaskStatus(taskId, payload) {
  const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || "Update failed");
  }
  return res.json();
}

// ── Task update history ────────────────────────────────────────────────
export const getTaskUpdates = (taskId) => fetchJson(`/tasks/${encodeURIComponent(taskId)}/updates`);

// ── Organizations ──────────────────────────────────────────────────────
export const getOrganizations  = ()           => fetchJson("/organizations");
export const createOrganization = (data)      => postJson("/organizations", data);

export async function updateOrganization(orgId, data) {
  const res = await fetch(`${API_BASE}/organizations/${orgId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Update failed"); }
  return res.json();
}

export async function deleteOrganization(orgId) {
  const res = await fetch(`${API_BASE}/organizations/${orgId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
}

// ── Projects ───────────────────────────────────────────────────────────
export const getProjects   = (orgId) => fetchJson(`/projects${orgId ? `?org_id=${orgId}` : ""}`);
export const getProject    = (id)    => fetchJson(`/projects/${id}`);
export const createProject = (data)  => postJson("/projects", data);

export async function updateProject(id, data) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Update failed"); }
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
}

// ── Sprints ────────────────────────────────────────────────────────────
// ── Team Members ───────────────────────────────────────────────────────
// ── Retrospectives ─────────────────────────────────────────────────────
export const getRetrospective = (sprintId) => fetchJson(`/sprints/${sprintId}/retrospective`);
export const createRetrospective = (sprintId, data) => postJson(`/sprints/${sprintId}/retrospective`, data);
export async function updateRetrospective(sprintId, data) {
  const res = await fetch(`${API_BASE}/sprints/${sprintId}/retrospective`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Update failed"); }
  return res.json();
}
export const getTeamMembers = (projectId) => fetchJson(`/projects/${projectId}/team_members`);
export const addTeamMember = (projectId, data) => postJson(`/projects/${projectId}/team_members`, data);
export async function updateTeamMember(projectId, memberId, data) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/team_members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Update failed"); }
  return res.json();
}
export async function deleteTeamMember(projectId, memberId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/team_members/${memberId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
}
export const getSprints    = (projectId) => fetchJson(`/projects/${projectId}/sprints`);
export const createSprint  = (projectId, data) => postJson(`/projects/${projectId}/sprints`, data);

export async function updateSprint(sprintId, data) {
  const res = await fetch(`${API_BASE}/sprints/${sprintId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Update failed"); }
  return res.json();
}

export async function activateSprint(sprintId) {
  const res = await fetch(`${API_BASE}/sprints/${sprintId}/activate`, { method: "POST" });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Activate failed"); }
  return res.json();
}

export async function completeSprint(sprintId) {
  const res = await fetch(`${API_BASE}/sprints/${sprintId}/complete`, { method: "POST" });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Complete failed"); }
  return res.json();
}

export async function deleteSprint(sprintId) {
  const res = await fetch(`${API_BASE}/sprints/${sprintId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
}

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

// ── Users (list) ───────────────────────────────────────────────────────────
export const listUsers = () => fetchJson("/users");

// ── Teams ──────────────────────────────────────────────────────────────────
export const getTeams      = ()              => fetchJson("/teams");
export const getTeam       = (id)            => fetchJson(`/teams/${id}`);
export const createTeam    = (data)          => postJson("/teams", data);

export async function updateTeam(id, data) {
  const res = await fetch(`${API_BASE}/teams/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Update failed"); }
  return res.json();
}

export async function deleteTeam(id) {
  const res = await fetch(`${API_BASE}/teams/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
}

// ── Team members ───────────────────────────────────────────────────────────
export const getTeamMembers2 = (teamId)         => fetchJson(`/teams/${teamId}/members`);
export const addUserToTeam   = (teamId, payload) => postJson(`/teams/${teamId}/members`, payload);

export async function removeUserFromTeam(teamId, userId) {
  const res = await fetch(`${API_BASE}/teams/${teamId}/members/${userId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Remove failed: ${res.status}`);
}

// ── Project ↔ Team mapping ──────────────────────────────────────────────────
export const getProjectTeams = (projectId)          => fetchJson(`/projects/${projectId}/teams`);

export async function assignTeamToProject(projectId, teamId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/teams/${teamId}`, { method: "POST" });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Assign failed"); }
  return res.json().catch(() => ({}));
}

export async function unassignTeamFromProject(projectId, teamId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/teams/${teamId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Unassign failed: ${res.status}`);
}

export const checkProjectAccess = (projectId, userId) => fetchJson(`/projects/${projectId}/access/${userId}`);
