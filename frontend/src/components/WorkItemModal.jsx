import React, { useState, useEffect } from "react";
import { useConfig } from "../hooks/useConfig.js";
import { getSprints } from "../services/api.js";
// Re-export constants for backward compatibility with other files
export { WORK_ITEM_TYPES, WORK_ITEM_STATES as STATES, PRIORITIES } from "../constants.js";

export function TypeBadge({ type }) {
  const key = (type || "Task").replace(/\s+/g, "-");
  return <span className={`type-badge type-${key}`} title={type} />;
}

export function StatePill({ state }) {
  return <span className={`state-pill state-${state}`}>{state}</span>;
}

export function PriDot({ priority }) {
  return <span className={`pri-dot pri-${priority}`} title={`Priority ${priority}`} />;
}

export function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return <span className="avatar">{initials}</span>;
}

const EMPTY = {
  work_item_type: "Task",
  title: "",
  state: "New",
  priority: 3,
  assigned_to: "",
  story_points: "",
  sprint: "",
  description: "",
  tags: "",
  parent_task_id: "",
  iteration_path: "",
  area_path: "",
  target_date: "",
};

export default function WorkItemModal({ initial = {}, workItems = [], projectId, onSave, onClose }) {
  const config = useConfig();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [sprints, setSprints] = useState([]);

  useEffect(() => {
    if (!projectId) { setSprints([]); return; }
    getSprints(projectId)
      .then(setSprints)
      .catch(() => setSprints([]));
  }, [projectId]);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      // coerce empty strings to null / correct types
      payload.priority = Number(payload.priority);
      payload.story_points = payload.story_points ? Number(payload.story_points) : null;
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const typeKey = (form.work_item_type || "Task").replace(/\s+/g, "-");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className={`type-badge type-${typeKey}`} style={{ width: 18, height: 18 }} />
            <span className="modal-title">
              {initial.task_id ? `Edit — ${initial.task_id}` : "Create Work Item"}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <form className="modal-body" onSubmit={handleSubmit} id="wi-form">
          <div className="form-grid">
            {/* Type */}
            <div className="form-group">
              <label className="form-label">Work Item Type *</label>
              <select className="form-control" value={form.work_item_type} onChange={set("work_item_type")}>
                {config.work_item_types.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* State */}
            <div className="form-group">
              <label className="form-label">State</label>
              <select className="form-control" value={form.state} onChange={set("state")}>
                {config.work_item_states.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Title – full width */}
            <div className="form-group span2">
              <label className="form-label">Title *</label>
              <input
                className="form-control"
                type="text"
                value={form.title}
                onChange={set("title")}
                placeholder="Enter a title…"
                required
                autoFocus
              />
            </div>

            {/* Assigned To */}
            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <input className="form-control" type="text" value={form.assigned_to} onChange={set("assigned_to")} placeholder="Name" />
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={set("priority")}>
                {config.priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Story Points */}
            <div className="form-group">
              <label className="form-label">Story Points</label>
              <input className="form-control" type="number" min="0" step="0.5" value={form.story_points} onChange={set("story_points")} placeholder="e.g. 5" />
            </div>

            {/* Sprint */}
            <div className="form-group">
              <label className="form-label">Sprint</label>
              {sprints.length > 0 ? (
                <select className="form-control" value={form.sprint || ""} onChange={set("sprint")}>
                  <option value="">— Select a sprint —</option>
                  {sprints.map((s) => {
                    const dateRange = s.start_date && s.end_date
                      ? ` (${s.start_date} → ${s.end_date})`
                      : s.start_date ? ` (from ${s.start_date})` : "";
                    return (
                      <option key={s.id} value={s.name}>
                        {s.name}{dateRange}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  className="form-control"
                  type="text"
                  value={form.sprint || ""}
                  onChange={set("sprint")}
                  placeholder={projectId ? "No sprints yet — type manually" : "Select a project first"}
                />
              )}
            </div>

            {/* Parent */}
            <div className="form-group">
              <label className="form-label">Parent (Task ID)</label>
              <input
                className="form-control"
                type="text"
                value={form.parent_task_id}
                onChange={set("parent_task_id")}
                placeholder="e.g. EPIC-1"
                list="parent-options"
              />
              <datalist id="parent-options">
                {workItems.map((w) => (
                  <option key={w.task_id} value={w.task_id}>{w.title}</option>
                ))}
              </datalist>
            </div>

            {/* Target Date */}
            <div className="form-group">
              <label className="form-label">Target Date</label>
              <input className="form-control" type="date" value={form.target_date} onChange={set("target_date")} />
            </div>

            {/* Iteration Path */}
            <div className="form-group">
              <label className="form-label">Iteration Path</label>
              <input className="form-control" type="text" value={form.iteration_path} onChange={set("iteration_path")} placeholder="e.g. MyProject\\Sprint 1" />
            </div>

            {/* Area Path */}
            <div className="form-group">
              <label className="form-label">Area Path</label>
              <input className="form-control" type="text" value={form.area_path} onChange={set("area_path")} placeholder="e.g. MyProject\\Frontend" />
            </div>

            {/* Tags – full width */}
            <div className="form-group span2">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-control" type="text" value={form.tags} onChange={set("tags")} placeholder="e.g. backend, api, urgent" />
            </div>

            {/* Description – full width */}
            <div className="form-group span2">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={4} value={form.description} onChange={set("description")} placeholder="Describe the work item…" />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="wi-form" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
