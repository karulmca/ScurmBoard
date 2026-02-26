import React, { useState } from "react";

export default function TeamMemberModal({ initial = {}, onSave, onClose }) {
  const [name, setName] = useState(initial.name || "");
  const [email, setEmail] = useState(initial.email || "");
  const [role, setRole] = useState(initial.role || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, email, role });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box team-member-modal" onClick={e => e.stopPropagation()}>
        <h3>{initial.id ? "Edit Team Member" : "Add Team Member"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Developer, QA" />
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit">{initial.id ? "Save" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
