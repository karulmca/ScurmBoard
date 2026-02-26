import React, { useState, useEffect } from "react";
import { useConfig } from "../hooks/useConfig.js";

export default function ProjectModal({ initial = {}, organizations = [], onSave, onClose }) {
  const config = useConfig();
  const isEdit = !!initial.id;
  const [form, setForm] = useState({
    name:            initial.name            ?? "",
    key:             initial.key             ?? "",
    description:     initial.description     ?? "",
    methodology:     initial.methodology     ?? "Scrum",
    lead:            initial.lead            ?? "",
    color:           initial.color           ?? "#0078d4",
    icon:            initial.icon            ?? "📁",
    sprint_duration: initial.sprint_duration ?? 14,
    org_id:          initial.org_id          ?? "",
    state:           initial.state           ?? "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate key from name
  const handleNameChange = (val) => {
    setForm((f) => ({
      ...f,
      name: val,
      key: isEdit ? f.key : val.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase(),
    }));
  };

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required"); return; }
    if (!form.key.trim())  { setError("Project key is required"); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        key: form.key.toUpperCase(),
        sprint_duration: Number(form.sprint_duration) || 14,
        org_id: form.org_id ? Number(form.org_id) : null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <span className="modal-icon" style={{ background: form.color }}>{form.icon}</span>
          <h2 className="modal-title">{isEdit ? "Edit Project" : "Create New Project"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          {/* Name + Key */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label className="form-label">Project Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Customer Portal"
                autoFocus
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Key *</label>
              <input
                className="form-input mono"
                value={form.key}
                onChange={(e) => set("key", e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8))}
                placeholder="PROJ"
                maxLength={8}
              />
              <span className="form-hint">Used as work item prefix</span>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of this project..."
            />
          </div>

          {/* Methodology + Lead */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Methodology</label>
              <select className="form-input" value={form.methodology} onChange={(e) => set("methodology", e.target.value)}>
                {config.methodologies.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Project Lead</label>
              <input
                className="form-input"
                value={form.lead}
                onChange={(e) => set("lead", e.target.value)}
                placeholder="Name or email"
              />
            </div>
            <div className="form-group" style={{ width: 120 }}>
              <label className="form-label">Sprint Length</label>
              <div className="input-with-suffix">
                <input
                  className="form-input"
                  type="number"
                  min={1} max={90}
                  value={form.sprint_duration}
                  onChange={(e) => set("sprint_duration", e.target.value)}
                />
                <span className="input-suffix">days</span>
              </div>
            </div>
          </div>

          {/* Organization */}
          {organizations.length > 0 && (
            <div className="form-group">
              <label className="form-label">Organization</label>
              <select className="form-input" value={form.org_id} onChange={(e) => set("org_id", e.target.value)}>
                <option value="">— None —</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Color picker */}
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-picker">
              {config.preset_colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch ${form.color === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => set("color", c)}
                />
              ))}
              <input
                type="color"
                className="color-custom"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                title="Custom color"
              />
            </div>
          </div>

          {/* Icon picker */}
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-picker">
              {config.preset_icons.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  className={`icon-swatch ${form.icon === ic ? "selected" : ""}`}
                  onClick={() => set("icon", ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
