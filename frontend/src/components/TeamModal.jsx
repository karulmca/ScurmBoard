import React, { useState } from "react";

/**
 * Modal to create or edit a Team.
 */
export default function TeamModal({ initial = {}, onSave, onClose }) {
  const [name, setName] = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Team name is required"); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box team-modal" onClick={e => e.stopPropagation()}>
        <h3>{initial.id ? "Edit Team" : "Create Team"}</h3>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Frontend Squad"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={3}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : initial.id ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
