import React, { useState, useEffect, useCallback } from "react";
import TeamModal from "../components/TeamModal.jsx";
import {
  getTeams, createTeam, updateTeam, deleteTeam,
  getTeamMembers2, addUserToTeam, removeUserFromTeam,
  getProjectTeams, assignTeamToProject, unassignTeamFromProject,
  listUsers, getProjects,
} from "../services/api.js";

// ── Small avatar chip ────────────────────────────────────────────────────────
function Avatar({ name, size = 32 }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colors = ["#0078d4", "#107c10", "#8764b8", "#ca5010", "#038387", "#d13438"];
  const color = colors[(name || "?").charCodeAt(0) % colors.length];
  return (
    <div
      className="team-avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Add-user modal (pick existing or create new) ─────────────────────────────
function AddUserModal({ teamId, existingUsers, teamMemberIds, onAdded, onClose }) {
  const [tab, setTab] = useState("existing"); // "existing" | "new"
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const available = existingUsers.filter((u) => !teamMemberIds.includes(u.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload =
        tab === "existing"
          ? { user_id: parseInt(selectedUserId, 10), team_role: teamRole || null }
          : { name: newName.trim(), email: newEmail.trim(), team_role: teamRole || null };
      const member = await addUserToTeam(teamId, payload);
      onAdded(member);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box add-user-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add User to Team</h3>
        <div className="tab-switch">
          <button
            className={`tab-switch-btn ${tab === "existing" ? "active" : ""}`}
            onClick={() => setTab("existing")}
          >
            Existing User
          </button>
          <button
            className={`tab-switch-btn ${tab === "new" ? "active" : ""}`}
            onClick={() => setTab("new")}
          >
            Create New User
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === "existing" ? (
            <div className="form-group">
              <label>Select User *</label>
              {available.length === 0 ? (
                <p className="form-hint">All existing users are already in this team.</p>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="">— choose a user —</option>
                  {available.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Name *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Role in Team</label>
            <input
              value={teamRole}
              onChange={(e) => setTeamRole(e.target.value)}
              placeholder="e.g. Developer, QA, Lead…"
            />
          </div>

          <div className="modal-footer">
            <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving || (tab === "existing" && !selectedUserId && available.length > 0)}
            >
              {saving ? "Adding…" : "Add to Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Assign-project modal ─────────────────────────────────────────────────────
function AssignProjectModal({ teamId, allProjects, assignedProjectIds, onAssigned, onClose }) {
  const available = allProjects.filter((p) => !assignedProjectIds.includes(p.id));
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      await assignTeamToProject(parseInt(selectedId, 10), teamId);
      onAssigned();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>Assign Team to Project</h3>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Project *</label>
            {available.length === 0 ? (
              <p className="form-hint">This team is already assigned to all projects.</p>
            ) : (
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required>
                <option value="">— choose a project —</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon || "📋"} {p.name} ({p.key})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={saving || !selectedId}>
              {saving ? "Assigning…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main TeamsPage ────────────────────────────────────────────────────────────
export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [selected, setSelected] = useState(null); // { team, members, projectTeams }
  const [allUsers, setAllUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAssignProject, setShowAssignProject] = useState(false);
  const [confirmDelTeam, setConfirmDelTeam] = useState(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);
  const [confirmUnassignProject, setConfirmUnassignProject] = useState(null);

  // ── Load list ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ts, us, ps] = await Promise.all([getTeams(), listUsers(), getProjects()]);
      setTeams(ts);
      setAllUsers(us);
      setAllProjects(ps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Load team detail ───────────────────────────────────────────────────────
  const loadTeamDetail = useCallback(async (team) => {
    try {
      const [members, projectTeams] = await Promise.all([
        getTeamMembers2(team.id),
        getProjectTeams(team.id),
      ]);
      setSelected({ team, members, projectTeams });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const selectTeam = (t) => loadTeamDetail(t);

  // ── Team CRUD ──────────────────────────────────────────────────────────────
  const handleSaveTeam = async (data) => {
    if (editTeam) {
      await updateTeam(editTeam.id, data);
    } else {
      await createTeam(data);
    }
    setShowTeamModal(false);
    setEditTeam(null);
    await loadAll();
    if (selected && editTeam?.id === selected.team.id) {
      loadTeamDetail({ ...selected.team, ...data });
    }
  };

  const handleDeleteTeam = async () => {
    await deleteTeam(confirmDelTeam.id);
    setConfirmDelTeam(null);
    if (selected?.team.id === confirmDelTeam.id) setSelected(null);
    loadAll();
  };

  // ── Members ────────────────────────────────────────────────────────────────
  const handleMemberAdded = async () => {
    setShowAddUser(false);
    await loadAll();
    if (selected) await loadTeamDetail(selected.team);
  };

  const handleRemoveMember = async () => {
    await removeUserFromTeam(selected.team.id, confirmRemoveMember.user_id);
    setConfirmRemoveMember(null);
    await loadAll();
    loadTeamDetail(selected.team);
  };

  // ── Project assignments ────────────────────────────────────────────────────
  const handleProjectAssigned = async () => {
    setShowAssignProject(false);
    if (selected) await loadTeamDetail(selected.team);
  };

  const handleUnassignProject = async () => {
    await unassignTeamFromProject(
      confirmUnassignProject.project_id,
      selected.team.id
    );
    setConfirmUnassignProject(null);
    loadTeamDetail(selected.team);
  };

  // ── Filtered teams ─────────────────────────────────────────────────────────
  const visible = teams.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="teams-page">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">
            Manage teams, assign users, and map teams to projects to control board access.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditTeam(null); setShowTeamModal(true); }}
        >
          + New Team
        </button>
      </div>

      <div className="teams-layout">
        {/* ── Team list panel ── */}
        <div className="teams-list-panel">
          <div className="teams-list-search">
            <input
              className="filter-search"
              placeholder="Search teams…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No teams yet</div>
              <div className="empty-sub">Create a team to get started</div>
              <button className="btn btn-primary" onClick={() => setShowTeamModal(true)}>
                + New Team
              </button>
            </div>
          ) : (
            <ul className="teams-list">
              {visible.map((t) => (
                <li
                  key={t.id}
                  className={`teams-list-item ${selected?.team.id === t.id ? "active" : ""}`}
                  onClick={() => selectTeam(t)}
                >
                  <div className="teams-list-item-icon">
                    <Avatar name={t.name} size={36} />
                  </div>
                  <div className="teams-list-item-info">
                    <div className="teams-list-item-name">{t.name}</div>
                    <div className="teams-list-item-count">
                      {t.member_count} member{t.member_count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="teams-list-item-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-btn"
                      title="Edit team"
                      onClick={() => { setEditTeam(t); setShowTeamModal(true); }}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn danger"
                      title="Delete team"
                      onClick={() => setConfirmDelTeam(t)}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Team detail panel ── */}
        {selected ? (
          <div className="teams-detail-panel">
            {/* Header */}
            <div className="teams-detail-header">
              <Avatar name={selected.team.name} size={44} />
              <div className="teams-detail-title-wrap">
                <h2 className="teams-detail-name">{selected.team.name}</h2>
                {selected.team.description && (
                  <p className="teams-detail-desc">{selected.team.description}</p>
                )}
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => { setEditTeam(selected.team); setShowTeamModal(true); }}
              >
                Edit
              </button>
            </div>

            {/* ── Members ── */}
            <div className="teams-section">
              <div className="teams-section-header">
                <h3>Members ({selected.members.length})</h3>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowAddUser(true)}
                >
                  + Add User
                </button>
              </div>

              {selected.members.length === 0 ? (
                <div className="empty-state-sm">No members yet — add users to this team.</div>
              ) : (
                <ul className="team-members-roster">
                  {selected.members.map((m) => (
                    <li key={m.user_id} className="roster-item">
                      <Avatar name={m.name} size={34} />
                      <div className="roster-item-info">
                        <span className="roster-item-name">{m.name}</span>
                        <span className="roster-item-email">{m.email}</span>
                      </div>
                      {m.team_role && (
                        <span className="roster-item-role">{m.team_role}</span>
                      )}
                      <button
                        className="icon-btn danger"
                        title="Remove from team"
                        onClick={() => setConfirmRemoveMember(m)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Assigned Projects ── */}
            <div className="teams-section">
              <div className="teams-section-header">
                <h3>Assigned Projects ({selected.projectTeams.length})</h3>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowAssignProject(true)}
                >
                  + Assign Project
                </button>
              </div>
              <p className="form-hint" style={{ marginBottom: 8 }}>
                Only users in this team can view boards for the projects below.
                Projects with no team assigned remain open to all.
              </p>

              {selected.projectTeams.length === 0 ? (
                <div className="empty-state-sm">No projects assigned yet.</div>
              ) : (
                <ul className="assigned-projects-list">
                  {selected.projectTeams.map((pt) => {
                    const proj = allProjects.find((p) => p.id === pt.project_id);
                    return (
                      <li key={pt.team_id + "-" + pt.project_id} className="assigned-project-item">
                        <span className="assigned-project-icon">{proj?.icon || "📋"}</span>
                        <span className="assigned-project-name">{proj?.name || pt.project_id}</span>
                        <span className="assigned-project-key">{proj?.key}</span>
                        <button
                          className="icon-btn danger"
                          title="Unassign project"
                          onClick={() => setConfirmUnassignProject(pt)}
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="teams-detail-empty">
            <div className="empty-icon" style={{ fontSize: 48 }}>👥</div>
            <p>Select a team to view its members and project assignments.</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showTeamModal && (
        <TeamModal
          initial={editTeam || {}}
          onSave={handleSaveTeam}
          onClose={() => { setShowTeamModal(false); setEditTeam(null); }}
        />
      )}

      {showAddUser && selected && (
        <AddUserModal
          teamId={selected.team.id}
          existingUsers={allUsers}
          teamMemberIds={selected.members.map((m) => m.user_id)}
          onAdded={handleMemberAdded}
          onClose={() => setShowAddUser(false)}
        />
      )}

      {showAssignProject && selected && (
        <AssignProjectModal
          teamId={selected.team.id}
          allProjects={allProjects}
          assignedProjectIds={selected.projectTeams.map((pt) => pt.project_id)}
          onAssigned={handleProjectAssigned}
          onClose={() => setShowAssignProject(false)}
        />
      )}

      {/* Confirm delete team */}
      {confirmDelTeam && (
        <div className="modal-overlay" onClick={() => setConfirmDelTeam(null)}>
          <div className="modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Team?</h3>
            <p>
              Delete <strong>{confirmDelTeam.name}</strong>? All memberships and project
              assignments for this team will be removed.
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmDelTeam(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteTeam}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove member */}
      {confirmRemoveMember && (
        <div className="modal-overlay" onClick={() => setConfirmRemoveMember(null)}>
          <div className="modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Member?</h3>
            <p>
              Remove <strong>{confirmRemoveMember.name}</strong> from{" "}
              <strong>{selected?.team.name}</strong>?
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmRemoveMember(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleRemoveMember}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm unassign project */}
      {confirmUnassignProject && (
        <div className="modal-overlay" onClick={() => setConfirmUnassignProject(null)}>
          <div className="modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Unassign Project?</h3>
            <p>
              Remove project assignment from this team? Users in this team will no longer have
              exclusive access to the project board.
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmUnassignProject(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleUnassignProject}>Unassign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
