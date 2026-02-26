import React, { useState, useEffect, useCallback } from "react";
import ProjectModal from "../components/ProjectModal.jsx";
import SprintModal  from "../components/SprintModal.jsx";
import TeamMemberModal from "../components/TeamMemberModal.jsx";
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from "../services/api.js";
import {
  getProjects, createProject, updateProject, deleteProject,
  getSprints, createSprint, updateSprint, activateSprint, completeSprint, deleteSprint,
  getOrganizations,
  getTeams, getProjectTeams, assignTeamToProject, unassignTeamFromProject,
} from "../services/api.js";

const METHODOLOGY_COLOR = {
  Scrum:  "#0078d4",
  Kanban: "#107c10",
  SAFe:   "#8764b8",
  XP:     "#ca5010",
  Lean:   "#038387",
};

const SPRINT_STATE_BADGE = {
  planning:  { label: "Planning",  cls: "sprint-badge-planning"  },
  active:    { label: "Active",    cls: "sprint-badge-active"    },
  completed: { label: "Completed", cls: "sprint-badge-completed" },
};

function SprintTimeline({ start, end }) {
  if (!start || !end) return null;
  const s = new Date(start), e = new Date(end), now = new Date();
  const total = e - s;
  const elapsed = Math.min(Math.max(now - s, 0), total);
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const daysLeft = Math.ceil((e - now) / 86400000);
  return (
    <div className="sprint-timeline">
      <div className="sprint-timeline-bar">
        <div className="sprint-timeline-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="sprint-timeline-label">
        {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Ends today" : "Ended"}
      </span>
    </div>
  );
}

export default function Projects({ onSelectProject }) {
  const [projects,  setProjects]  = useState([]);
  const [orgs,      setOrgs]      = useState([]);
  const [teams,     setTeams]     = useState([]);
  const [selected,  setSelected]  = useState(null);   // { project, sprints }
  const [loading,   setLoading]   = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [confirmDelMember, setConfirmDelMember] = useState(null);

  const [showProjModal,   setShowProjModal]   = useState(false);
  const [editProject,     setEditProject]     = useState(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editSprint,      setEditSprint]      = useState(null);

  const [confirmDel, setConfirmDel] = useState(null); // { type, id, name }
  const [filterOrg,  setFilterOrg]  = useState("");
  const [search,     setSearch]     = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ps, os, ts] = await Promise.all([getProjects(), getOrganizations(), getTeams()]);
      setProjects(ps);
      setOrgs(os);
      setTeams(ts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadSprints = async (project) => {
    try {
      const [sprints, members, projectTeams] = await Promise.all([
        getSprints(project.id),
        getTeamMembers(project.id),
        getProjectTeams(project.id),
      ]);
      setSelected({ project, sprints, projectTeams });
      setTeamMembers(members);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectProject = (p) => {
    loadSprints(p);
    onSelectProject?.(p);
  };

  // ── Project CRUD ────────────────────────────────────────────────────
  const handleSaveProject = async (data) => {
    const { team_ids = [], ...projectData } = data;
    let savedProject;
    if (editProject) {
      savedProject = await updateProject(editProject.id, projectData);
      // Sync team assignments: unassign removed, assign new
      const currentPT = await getProjectTeams(editProject.id);
      const currentIds = currentPT.map((pt) => pt.team_id);
      const toAdd    = team_ids.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !team_ids.includes(id));
      await Promise.all([
        ...toAdd.map((tid)    => assignTeamToProject(editProject.id, tid)),
        ...toRemove.map((tid) => unassignTeamFromProject(editProject.id, tid)),
      ]);
    } else {
      savedProject = await createProject(projectData);
      // Assign selected teams to the new project
      if (team_ids.length > 0) {
        await Promise.all(team_ids.map((tid) => assignTeamToProject(savedProject.id, tid)));
      }
    }
    setShowProjModal(false);
    setEditProject(null);
    await loadAll();
    if (selected) loadSprints(selected.project);
  };

  const handleDeleteProject = async () => {
    await deleteProject(confirmDel.id);
    setConfirmDel(null);
    setSelected(null);
    loadAll();
  };

  // ── Sprint CRUD ─────────────────────────────────────────────────────
  const handleSaveSprint = async (data) => {
    if (editSprint) {
      await updateSprint(editSprint.id, data);
    } else {
      await createSprint(selected.project.id, data);
    }
    setShowSprintModal(false);
    setEditSprint(null);
    loadSprints(selected.project);
  };

  const handleActivateSprint = async (sprintId) => {
    await activateSprint(sprintId);
    loadSprints(selected.project);
  };

  const handleCompleteSprint = async (sprintId) => {
    await completeSprint(sprintId);
    loadSprints(selected.project);
  };

  const handleDeleteSprint = async () => {
    await deleteSprint(confirmDel.id);
    setConfirmDel(null);
    loadSprints(selected.project);
  };

  // ── Filter ──────────────────────────────────────────────────────────
  const visible = projects.filter((p) => {
    if (filterOrg && String(p.org_id) !== filterOrg) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.key.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="projects-page">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage projects and sprints across your organization</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowProjModal(true); }}>
          + New Project
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {orgs.length > 0 && (
          <select className="filter-select" value={filterOrg} onChange={(e) => setFilterOrg(e.target.value)}>
            <option value="">All Organizations</option>
            {orgs.map((o) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
          </select>
        )}
        <span className="filter-count">{visible.length} project{visible.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="projects-layout">
        {/* ── Project grid ── */}
        <div className="projects-grid-panel">
          {loading ? (
            <div className="empty-state">Loading projects…</div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗂️</div>
              <div className="empty-title">No projects yet</div>
              <div className="empty-sub">Create your first project to get started</div>
              <button className="btn btn-primary" onClick={() => setShowProjModal(true)}>+ New Project</button>
            </div>
          ) : (
            <div className="project-cards">
              {visible.map((p) => (
                <div
                  key={p.id}
                  className={`project-card ${selected?.project?.id === p.id ? "selected" : ""}`}
                  onClick={() => handleSelectProject(p)}
                >
                  <div className="project-card-accent" style={{ background: p.color || "#0078d4" }} />
                  <div className="project-card-body">
                    <div className="project-card-header">
                      <span className="project-icon">{p.icon || "📁"}</span>
                      <div className="project-card-meta">
                        <div className="project-card-name">{p.name}</div>
                        <div className="project-card-key">{p.key}</div>
                      </div>
                      <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="icon-btn"
                          title="Edit"
                          onClick={async () => {
                            // pre-load current team assignments so the modal can show them checked
                            let teamIds = [];
                            try {
                              const pt = await getProjectTeams(p.id);
                              teamIds = pt.map((t) => t.team_id);
                            } catch {}
                            setEditProject({ ...p, team_ids: teamIds });
                            setShowProjModal(true);
                          }}
                        >✏️</button>
                        <button
                          className="icon-btn danger"
                          title="Delete"
                          onClick={() => setConfirmDel({ type: "project", id: p.id, name: p.name })}
                        >🗑️</button>
                      </div>
                    </div>

                    {p.description && (
                      <div className="project-card-desc">{p.description}</div>
                    )}

                    <div className="project-card-tags">
                      <span className="tag" style={{ background: METHODOLOGY_COLOR[p.methodology] + "22", color: METHODOLOGY_COLOR[p.methodology] }}>
                        {p.methodology}
                      </span>
                      {p.state === "archived" && <span className="tag tag-archived">Archived</span>}
                      {p.lead && <span className="tag tag-lead">👤 {p.lead}</span>}
                    </div>

                    <div className="project-card-stats">
                      <span>🏃 {p.sprint_count} sprint{p.sprint_count !== 1 ? "s" : ""}</span>
                      {p.active_sprint && (
                        <span className="active-sprint-badge">▶ {p.active_sprint}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sprint panel ── */}
        {selected && (
          <div className="sprint-panel">
            <div className="sprint-panel-header">
              <div className="sprint-panel-title">
                <span style={{ marginRight: 8 }}>{selected.project.icon}</span>
                {selected.project.name}
                <span className="sprint-panel-key">{selected.project.key}</span>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => { setEditSprint(null); setShowSprintModal(true); }}
              >
                + Sprint
              </button>
            </div>

              {/* ── Team Members Section ── */}
              <div className="team-members-section">
                <div className="team-members-header">
                  <h4>Team Members</h4>
                  <button className="btn btn-sm btn-primary" onClick={() => { setEditMember(null); setShowTeamModal(true); }}>+ Add</button>
                </div>
                {teamMembers.length === 0 ? (
                  <div className="empty-state-sm">No team members yet</div>
                ) : (
                  <ul className="team-members-list">
                    {teamMembers.map((m) => (
                      <li key={m.id} className="team-member-item">
                        <span className="team-member-name">{m.name}</span>
                        <span className="team-member-email">{m.email}</span>
                        <span className="team-member-role">{m.role}</span>
                        <div className="team-member-actions">
                          <button className="icon-btn" title="Edit" onClick={() => { setEditMember(m); setShowTeamModal(true); }}>✏️</button>
                          <button className="icon-btn danger" title="Delete" onClick={() => setConfirmDelMember(m)}>🗑️</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ── Assigned Teams Section ── */}
              {selected.projectTeams && selected.projectTeams.length > 0 && (
                <div className="project-teams-section">
                  <div className="project-teams-header">
                    <span className="project-teams-icon">👥</span>
                    <span className="project-teams-label">Teams with access:</span>
                    <span className="project-teams-chips">
                      {selected.projectTeams.map((pt) => (
                        <span key={pt.team_id ?? pt.id} className="project-team-chip">
                          {pt.team_name ?? pt.name}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              )}

            {selected.sprints.length === 0 ? (
              <div className="empty-state-sm">
                No sprints yet — create one to start planning
              </div>
            ) : (
              <div className="sprint-list">
                {selected.sprints.map((s) => {
                  const badge = SPRINT_STATE_BADGE[s.state] || { label: s.state, cls: "" };
                  return (
                    <div key={s.id} className={`sprint-card sprint-state-${s.state}`}>
                      <div className="sprint-card-header">
                        <div className="sprint-card-name">{s.name}</div>
                        <span className={`sprint-badge ${badge.cls}`}>{badge.label}</span>
                        <div className="sprint-card-actions">
                          <button className="icon-btn" title="Edit" onClick={() => { setEditSprint(s); setShowSprintModal(true); }}>✏️</button>
                          {s.state === "planning" && (
                            <button className="icon-btn success" title="Activate" onClick={() => handleActivateSprint(s.id)}>▶</button>
                          )}
                          {s.state === "active" && (
                            <button className="icon-btn warn" title="Complete" onClick={() => handleCompleteSprint(s.id)}>✓</button>
                          )}
                          <button className="icon-btn danger" title="Delete" onClick={() => setConfirmDel({ type: "sprint", id: s.id, name: s.name })}>🗑️</button>
                        </div>
                      </div>

                      {s.goal && <div className="sprint-card-goal">🎯 {s.goal}</div>}

                      <div className="sprint-card-dates">
                        {s.start_date && <span>📅 {s.start_date}</span>}
                        {s.end_date   && <span> → {s.end_date}</span>}
                      </div>

                      <SprintTimeline start={s.start_date} end={s.end_date} />

                      {(s.capacity || s.velocity) && (
                        <div className="sprint-card-points">
                          {s.capacity && <span>Capacity: <b>{s.capacity}</b> pts</span>}
                          {s.velocity && <span>Velocity: <b>{s.velocity}</b> pts</span>}
                          {s.capacity && s.velocity && (
                            <span className="sprint-completion">
                              {Math.round((s.velocity / s.capacity) * 100)}% complete
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showProjModal && (
        <ProjectModal
          initial={editProject || {}}
          organizations={orgs}
          teams={teams}
          onSave={handleSaveProject}
          onClose={() => { setShowProjModal(false); setEditProject(null); }}
        />
      )}

        {showTeamModal && selected && (
          <TeamMemberModal
            initial={editMember || {}}
            onSave={async (data) => {
              if (editMember) {
                await updateTeamMember(selected.project.id, editMember.id, data);
              } else {
                await addTeamMember(selected.project.id, data);
              }
              setShowTeamModal(false);
              setEditMember(null);
              loadSprints(selected.project);
            }}
            onClose={() => { setShowTeamModal(false); setEditMember(null); }}
          />
        )}

        {confirmDelMember && (
          <div className="modal-overlay" onClick={() => setConfirmDelMember(null)}>
            <div className="modal-box confirm-modal" onClick={e => e.stopPropagation()}>
              <h3>Delete Team Member?</h3>
              <p>
                Are you sure you want to delete <strong>{confirmDelMember.name}</strong> ({confirmDelMember.email})?
                This action cannot be undone.
              </p>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setConfirmDelMember(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={async () => {
                  await deleteTeamMember(selected.project.id, confirmDelMember.id);
                  setConfirmDelMember(null);
                  loadSprints(selected.project);
                }}>Delete</button>
              </div>
            </div>
          </div>
        )}

      {showSprintModal && selected && (
        <SprintModal
          initial={editSprint || {}}
          projectName={selected.project.name}
          sprintCount={selected.sprints.length}
          onSave={handleSaveSprint}
          onClose={() => { setShowSprintModal(false); setEditSprint(null); }}
        />
      )}

      {/* ── Delete confirm ── */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete {confirmDel.type === "project" ? "Project" : "Sprint"}?</h3>
            <p>
              Are you sure you want to delete <strong>{confirmDel.name}</strong>?
              {confirmDel.type === "project" && " All sprints within this project will also be removed."}
              {" This action cannot be undone."}
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={confirmDel.type === "project" ? handleDeleteProject : handleDeleteSprint}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
