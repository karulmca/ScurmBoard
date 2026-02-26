import React, { useState } from "react";
import { useConfig } from "../hooks/useConfig.js";

function formatDateInput(d) {
  if (!d) return "";
  return typeof d === "string" ? d.slice(0, 10) : "";
}

export default function SprintModal({ initial = {}, projectName = "", sprintCount = 0, onSave, onClose }) {
  const config = useConfig();
  const isEdit = !!initial.id;
  const defaultName = isEdit ? initial.name : `Sprint ${sprintCount + 1}`;

  const [form, setForm] = useState({
    name:       initial.name       ?? defaultName,
    goal:       initial.goal       ?? "",
    start_date: formatDateInput(initial.start_date),
    end_date:   formatDateInput(initial.end_date),
    state:      initial.state      ?? "planning",
    capacity:   initial.capacity   ?? "",
    velocity:   initial.velocity   ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  // Auto-fill end date based on start + project sprint duration
  const handleStartChange = (val) => {
    set("start_date", val);
    if (val && !form.end_date) {
      const d = new Date(val);
      d.setDate(d.getDate() + 14);
      set("end_date", d.toISOString().slice(0, 10));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Sprint name is required"); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({
        name:       form.name.trim(),
        goal:       form.goal.trim() || null,
        start_date: form.start_date || null,
        end_date:   form.end_date   || null,
        state:      form.state,
        capacity:   form.capacity !== "" ? Number(form.capacity) : null,
        velocity:   form.velocity !== "" ? Number(form.velocity) : null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <span className="modal-icon" style={{ background: "#0078d4" }}>🏃</span>
          <div>
            <h2 className="modal-title">{isEdit ? "Edit Sprint" : "Create Sprint"}</h2>
            {projectName && <div className="modal-subtitle">{projectName}</div>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Sprint Name *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Sprint 1"
              autoFocus
            />
          </div>

          {/* Goal */}
          <div className="form-group">
            <label className="form-label">Sprint Goal</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.goal}
              onChange={(e) => set("goal", e.target.value)}
              placeholder="What will the team accomplish in this sprint?"
            />
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={form.start_date}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </div>
          </div>

          {/* State */}
          <div className="form-group">
            <label className="form-label">State</label>
            <div className="state-toggle-row">
              {config.sprint_states.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`state-toggle-btn sprint-state-${s} ${form.state === s ? "active" : ""}`}
                  onClick={() => set("state", s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Capacity + Velocity */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Capacity (story pts)</label>
              <input
                type="number"
                className="form-input"
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                placeholder="e.g. 40"
                min={0}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Velocity (completed)</label>
              <input
                type="number"
                className="form-input"
                value={form.velocity}
                onChange={(e) => set("velocity", e.target.value)}
                placeholder="e.g. 35"
                min={0}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
