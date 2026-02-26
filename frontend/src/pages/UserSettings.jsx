import React, { useState, useEffect } from "react";
import {
  getUser, updateUser, getProjects, getProjectRole, assignRole, updateRole,
} from "../services/api.js";

/* ─── Constants ──────────────────────────────────────────────── */
const SECTIONS = ["tasks", "sprints", "retrospectives", "team", "settings"];
const ACTIONS  = ["view", "create", "update", "delete", "add"];
const ROLES    = ["Admin", "Member", "Viewer"];

const AVATAR_COLORS = [
  "#0078d4","#107c10","#ca5010","#8764b8","#038387","#d9a800","#e3008c","#243a5e",
];

const NAV = [
  { id: "profile",       label: "Profile"             },
  { id: "preferences",   label: "Preferences"         },
  { id: "notifications", label: "Notifications", badge: "3" },
  { id: "roles",         label: "Roles & Permissions" },
  { id: "security",      label: "Security"            },
];

const ROLE_META = {
  Admin:  { color: "#d83b01", bg: "#fde7d9" },
  Member: { color: "#107c10", bg: "#dff6dd" },
  Viewer: { color: "#605e5c", bg: "#f3f2f1" },
  None:   { color: "#8a8886", bg: "#f3f2f1" },
};

/* ─── Reusable sub-components ────────────────────────────────── */
function Avatar({ name = "", color = "#0078d4", size = 56, imgUrl = "" }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";
  return (
    <div className="us-avatar" style={{ width: size, height: size, minWidth: size,
      fontSize: size * 0.38, background: color }}>
      {imgUrl
        ? <img src={imgUrl} alt={name} onError={e => { e.target.style.display = "none"; }} />
        : initials}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="us-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="us-toggle-track"><span className="us-toggle-thumb" /></span>
      {label && <span className="us-toggle-label">{label}</span>}
    </label>
  );
}

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.None;
  return (
    <span className="us-role-badge"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.color}40` }}>
      {role || "None"}
    </span>
  );
}

/* =========================================================
   PROFILE TAB
   ========================================================= */
function ProfileTab({ user, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", avatar_color: "#0078d4", bio: "", department: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (user) setForm({
      name:         user.name         || "",
      email:        user.email        || "",
      avatar_color: user.avatar_color || "#0078d4",
      bio:          user.bio          || "",
      department:   user.department   || "",
      location:     user.location     || "",
    });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try { await updateUser(user.id, form); setEditing(false); onSaved(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (!user) return <div className="us-loading"><div className="us-spinner" /> Loading profile...</div>;

  return (
    <div className="us-tab-content">
      <div className="us-profile-hero">
        <div className="us-profile-hero-left">
          <Avatar name={form.name} color={form.avatar_color} size={72} />
          <div className="us-profile-hero-info">
            <h2 className="us-profile-name">{user.name}</h2>
            <div className="us-profile-email">{user.email}</div>
            <div className="us-profile-meta-row">
              {form.department && <span className="us-meta-chip">{form.department}</span>}
              {form.location   && <span className="us-meta-chip">{form.location}</span>}
              <span className="us-meta-chip us-meta-chip--muted">Member since Feb 2026</span>
            </div>
          </div>
        </div>
        {!editing && (
          <button className="s-btn s-btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>

      {editing ? (
        <div className="us-card us-card--form">
          <div className="us-card-header">
            <h3 className="us-card-title">Edit Profile</h3>
          </div>
          <form onSubmit={handleSubmit} className="us-form">
            {error && <div className="s-form-error">{error}</div>}
            <div className="us-form-row">
              <div className="us-form-col">
                <label className="s-label">Full Name *</label>
                <input className="s-input" value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="us-form-col">
                <label className="s-label">Email *</label>
                <input className="s-input" type="email" value={form.email} required
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="us-form-row">
              <div className="us-form-col">
                <label className="s-label">Department</label>
                <input className="s-input" value={form.department} placeholder="Engineering"
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              <div className="us-form-col">
                <label className="s-label">Location</label>
                <input className="s-input" value={form.location} placeholder="Chennai, India"
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <div className="us-form-group">
              <label className="s-label">Bio</label>
              <textarea className="s-input us-textarea" rows={3} value={form.bio}
                placeholder="A short description about yourself..."
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="us-form-group">
              <label className="s-label">Avatar Color</label>
              <div className="us-color-swatches">
                {AVATAR_COLORS.map(c => (
                  <button key={c} type="button"
                    className={`us-swatch ${form.avatar_color === c ? "us-swatch--active" : ""}`}
                    style={{ background: c }} onClick={() => setForm(f => ({ ...f, avatar_color: c }))} />
                ))}
                <div className="us-swatch-custom">
                  <input type="color" value={form.avatar_color}
                    onChange={e => setForm(f => ({ ...f, avatar_color: e.target.value }))} />
                </div>
              </div>
              <div className="us-avatar-preview-row">
                <Avatar name={form.name} color={form.avatar_color} size={44} />
                <span className="us-preview-label">Preview</span>
              </div>
            </div>
            <div className="us-form-footer">
              <button type="button" className="s-btn s-btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="s-btn s-btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="us-info-grid">
          <div className="us-card">
            <div className="us-card-header"><h3 className="us-card-title">Personal Info</h3></div>
            <div className="us-info-list">
              <div className="us-info-row"><span className="us-info-key">Full Name</span><span className="us-info-val">{user.name || "—"}</span></div>
              <div className="us-info-row"><span className="us-info-key">Email</span><span className="us-info-val">{user.email || "—"}</span></div>
              <div className="us-info-row"><span className="us-info-key">Department</span><span className="us-info-val">{form.department || "—"}</span></div>
              <div className="us-info-row"><span className="us-info-key">Location</span><span className="us-info-val">{form.location || "—"}</span></div>
            </div>
          </div>
          <div className="us-card">
            <div className="us-card-header"><h3 className="us-card-title">About Me</h3></div>
            <p className="us-bio-text">{form.bio || "No bio set yet. Click Edit Profile to add one."}</p>
          </div>
          <div className="us-card">
            <div className="us-card-header"><h3 className="us-card-title">Account Info</h3></div>
            <div className="us-info-list">
              <div className="us-info-row"><span className="us-info-key">User ID</span><span className="us-info-val us-mono">#{user.id}</span></div>
              <div className="us-info-row"><span className="us-info-key">Member Since</span><span className="us-info-val">February 2026</span></div>
              <div className="us-info-row"><span className="us-info-key">Status</span>
                <span className="us-info-val"><span className="us-status-dot us-status-dot--active" /> Active</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PREFERENCES TAB
   ========================================================= */
function PreferencesTab() {
  const [density,    setDensity]    = useState("comfortable");
  const [language,   setLanguage]   = useState("en");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeZone,   setTimeZone]   = useState("Asia/Kolkata");

  return (
    <div className="us-tab-content">
      <div className="us-cards-stack">
        <div className="us-card">
          <div className="us-card-header">
            <h3 className="us-card-title">Display</h3>
            <span className="us-card-desc">Adjust how the interface looks and feels</span>
          </div>
          <div className="us-pref-list">
            <div className="us-pref-row">
              <div>
                <div className="us-pref-label">Display Density</div>
                <div className="us-pref-hint">Controls spacing between UI elements</div>
              </div>
              <div className="us-density-btns">
                {["Compact","Comfortable","Spacious"].map(d => (
                  <button key={d}
                    className={`us-density-btn ${density === d.toLowerCase() ? "us-density-btn--active" : ""}`}
                    onClick={() => setDensity(d.toLowerCase())}>{d}</button>
                ))}
              </div>
            </div>
            <div className="us-pref-row">
              <div>
                <div className="us-pref-label">Color Theme</div>
                <div className="us-pref-hint">Dark mode coming soon</div>
              </div>
              <div className="us-density-btns">
                <button className="us-density-btn us-density-btn--active">Light</button>
                <button className="us-density-btn" disabled style={{ opacity: 0.45 }}>Dark</button>
              </div>
            </div>
          </div>
        </div>

        <div className="us-card">
          <div className="us-card-header">
            <h3 className="us-card-title">Locale &amp; Time</h3>
            <span className="us-card-desc">Language, date format, and timezone</span>
          </div>
          <div className="us-pref-list">
            <div className="us-pref-row">
              <div><div className="us-pref-label">Language</div></div>
              <select className="s-select us-pref-select" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="en">English (US)</option>
                <option value="en-gb">English (UK)</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
            <div className="us-pref-row">
              <div><div className="us-pref-label">Date Format</div></div>
              <select className="s-select us-pref-select" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
            <div className="us-pref-row">
              <div><div className="us-pref-label">Time Zone</div></div>
              <select className="s-select us-pref-select" value={timeZone} onChange={e => setTimeZone(e.target.value)}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   NOTIFICATIONS TAB
   ========================================================= */
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    email_assigned:   true,  email_mentioned: true,
    email_sprint:     false, email_digest:    true,
    inapp_assigned:   true,  inapp_mentioned: true,
    inapp_comment:    true,  inapp_status:    false,
  });
  const tog = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const groups = [
    { group: "Email Notifications", items: [
      { key: "email_assigned",  label: "Task assigned to me",       hint: "When someone assigns a work item"  },
      { key: "email_mentioned", label: "Mentioned in comments",     hint: "When @you appears in a comment"    },
      { key: "email_sprint",    label: "Sprint start / end",        hint: "Sprint lifecycle events"           },
      { key: "email_digest",    label: "Weekly summary digest",     hint: "Delivered every Monday at 9am"     },
    ]},
    { group: "In-App Notifications", items: [
      { key: "inapp_assigned",  label: "Task assigned to me",       hint: "Live badge in sidebar"             },
      { key: "inapp_mentioned", label: "Mentioned in comments",     hint: "Real-time toast notification"      },
      { key: "inapp_comment",   label: "New comment on my items",   hint: "Activity feed"                     },
      { key: "inapp_status",    label: "Status changes on my items",hint: "When a work item changes state"    },
    ]},
  ];

  return (
    <div className="us-tab-content">
      <div className="us-cards-stack">
        {groups.map(({ group, items }) => (
          <div key={group} className="us-card">
            <div className="us-card-header"><h3 className="us-card-title">{group}</h3></div>
            <div className="us-pref-list">
              {items.map(({ key, label, hint }) => (
                <div key={key} className="us-pref-row">
                  <div>
                    <div className="us-pref-label">{label}</div>
                    {hint && <div className="us-pref-hint">{hint}</div>}
                  </div>
                  <Toggle checked={prefs[key]} onChange={() => tog(key)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   ROLES & PERMISSIONS TAB
   ========================================================= */
function PermMatrix({ projectId, permEdit, onChange }) {
  return (
    <div className="us-perm-matrix">
      <div className="us-perm-table-wrap">
        <table className="us-perm-table">
          <thead>
            <tr>
              <th>Section</th>
              {ACTIONS.map(a => <th key={a}>{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map(sec => (
              <tr key={sec}>
                <td className="us-perm-section">{sec}</td>
                {ACTIONS.map(act => (
                  <td key={act} className="us-perm-cell">
                    <input type="checkbox" className="us-perm-check"
                      checked={permEdit[sec]?.includes(act) || false}
                      onChange={() => onChange(projectId, sec, act)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolesTab({ userId, projects }) {
  const [roles,    setRoles]    = useState({});
  const [roleEdit, setRoleEdit] = useState({});
  const [permEdit, setPermEdit] = useState({});
  const [permOpen, setPermOpen] = useState({});
  const [saving,   setSaving]   = useState(null);

  useEffect(() => {
    projects.forEach(p => {
      getProjectRole(userId, p.id)
        .then(r  => setRoles(prev => ({ ...prev, [p.id]: r || null })))
        .catch(() => setRoles(prev => ({ ...prev, [p.id]: null })));
    });
  }, [projects, userId]);

  const handleRoleSave = async (pid) => {
    const newRole = roleEdit[pid]; setSaving(pid);
    try {
      if (roles[pid]?.id) {
        await updateRole(roles[pid].id, { role: newRole });
        setRoles(p => ({ ...p, [pid]: { ...p[pid], role: newRole } }));
      } else {
        const r = await assignRole({ user_id: userId, project_id: pid, role: newRole });
        setRoles(p => ({ ...p, [pid]: r }));
      }
      setRoleEdit(p => { const n = { ...p }; delete n[pid]; return n; });
    } finally { setSaving(null); }
  };

  const handlePermChange = (pid, section, action) => {
    setPermEdit(prev => {
      const cur = { ...(prev[pid] || {}) };
      cur[section] = cur[section] ? [...cur[section]] : [];
      if (cur[section].includes(action)) cur[section] = cur[section].filter(a => a !== action);
      else cur[section].push(action);
      return { ...prev, [pid]: cur };
    });
  };

  const handlePermSave = async (pid) => {
    if (!roles[pid]?.id) return;
    setSaving("perm-" + pid);
    try {
      await updateRole(roles[pid].id, { permissions: JSON.stringify(permEdit[pid]) });
      setPermEdit(p => { const n = { ...p }; delete n[pid]; return n; });
      setPermOpen(p => ({ ...p, [pid]: false }));
    } finally { setSaving(null); }
  };

  const currentRole = (pid) => roles[pid]?.role || "None";

  return (
    <div className="us-tab-content">
      <p className="us-section-desc">
        Your role determines what you can do within each project. Contact an Admin to change your role.
      </p>
      {projects.length === 0 && (
        <div className="us-empty">
          <div className="us-empty-title">No projects yet</div>
          <div className="us-empty-sub">You have not been added to any projects.</div>
        </div>
      )}
      <div className="us-roles-list">
        {projects.map(p => {
          const role      = currentRole(p.id);
          const isEditing = p.id in roleEdit;
          const isPermOpen= permOpen[p.id];
          return (
            <div key={p.id} className="us-role-card">
              <div className="us-role-card-header">
                <div className="us-role-card-left">
                  <div className="us-project-icon" style={{ background: p.color || "#0078d4" }}>
                    {p.icon || p.name?.charAt(0) || "P"}
                  </div>
                  <div className="us-role-card-info">
                    <div className="us-role-project-name">{p.name}</div>
                    <code className="us-role-project-key">{p.key}</code>
                  </div>
                </div>
                <div className="us-role-card-right">
                  {isEditing ? (
                    <div className="us-role-edit-row">
                      <select className="s-select us-role-select" value={roleEdit[p.id]}
                        onChange={e => setRoleEdit(r => ({ ...r, [p.id]: e.target.value }))}>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                      <button className="s-btn s-btn-primary s-btn-sm" disabled={saving === p.id}
                        onClick={() => handleRoleSave(p.id)}>
                        {saving === p.id ? "..." : "Save"}
                      </button>
                      <button className="s-btn s-btn-ghost s-btn-sm"
                        onClick={() => setRoleEdit(r => { const n = { ...r }; delete n[p.id]; return n; })}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <RoleBadge role={role} />
                      <button className="s-btn s-btn-ghost s-btn-sm"
                        onClick={() => setRoleEdit(r => ({ ...r, [p.id]: role !== "None" ? role : "Viewer" }))}>
                        Change
                      </button>
                    </>
                  )}
                  <button className="s-btn s-btn-ghost s-btn-sm"
                    onClick={() => setPermOpen(o => ({ ...o, [p.id]: !o[p.id] }))}>
                    {isPermOpen ? "Hide" : "Permissions"}
                  </button>
                </div>
              </div>
              {isPermOpen && (
                <div className="us-role-card-body">
                  {permEdit[p.id]
                    ? <PermMatrix projectId={p.id} permEdit={permEdit[p.id]} onChange={handlePermChange} />
                    : <div className="us-perm-placeholder">
                        <span>No custom permissions. Role defaults apply.</span>
                        <button className="s-btn s-btn-ghost s-btn-sm"
                          onClick={() => setPermEdit(pe => ({ ...pe, [p.id]: {} }))}>Customize</button>
                      </div>
                  }
                  {permEdit[p.id] && (
                    <div className="us-perm-actions">
                      <button className="s-btn s-btn-ghost s-btn-sm"
                        onClick={() => setPermEdit(pe => { const n = { ...pe }; delete n[p.id]; return n; })}>
                        Discard
                      </button>
                      <button className="s-btn s-btn-primary s-btn-sm"
                        disabled={saving === "perm-" + p.id} onClick={() => handlePermSave(p.id)}>
                        {saving === "perm-" + p.id ? "Saving..." : "Save Permissions"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   SECURITY TAB
   ========================================================= */
function SecurityTab() {
  const [changePw, setChangePw] = useState(false);
  const [pw,       setPw]       = useState({ current: "", next: "", confirm: "" });
  const [twoFA,    setTwoFA]    = useState(false);
  const [pwerr,    setPwErr]    = useState("");

  const handlePwSubmit = (e) => {
    e.preventDefault();
    if (pw.next.length < 8) { setPwErr("Password must be at least 8 characters"); return; }
    if (pw.next !== pw.confirm) { setPwErr("Passwords do not match"); return; }
    setPwErr(""); alert("Password updated (demo)");
    setChangePw(false); setPw({ current: "", next: "", confirm: "" });
  };

  const sessions = [
    { id: 1, device: "Chrome on Windows 11", ip: "192.168.1.10", last: "Just now",   current: true  },
    { id: 2, device: "Firefox on macOS",     ip: "10.0.0.44",   last: "2 days ago", current: false },
    { id: 3, device: "Safari on iPhone 15",  ip: "172.16.0.5",  last: "5 days ago", current: false },
  ];

  return (
    <div className="us-tab-content">
      <div className="us-cards-stack">
        <div className="us-card">
          <div className="us-card-header">
            <h3 className="us-card-title">Password</h3>
            {!changePw && (
              <button className="s-btn s-btn-ghost s-btn-sm" onClick={() => setChangePw(true)}>Change Password</button>
            )}
          </div>
          {changePw ? (
            <form className="us-form" onSubmit={handlePwSubmit}>
              {pwerr && <div className="s-form-error">{pwerr}</div>}
              <div className="us-form-group">
                <label className="s-label">Current Password</label>
                <input className="s-input" type="password" value={pw.current} required
                  onChange={e => setPw(p => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="us-form-row">
                <div className="us-form-col">
                  <label className="s-label">New Password</label>
                  <input className="s-input" type="password" value={pw.next} required
                    onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
                </div>
                <div className="us-form-col">
                  <label className="s-label">Confirm Password</label>
                  <input className="s-input" type="password" value={pw.confirm} required
                    onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
                </div>
              </div>
              <div className="us-form-footer">
                <button type="button" className="s-btn s-btn-ghost"
                  onClick={() => { setChangePw(false); setPw({ current: "", next: "", confirm: "" }); }}>
                  Cancel
                </button>
                <button type="submit" className="s-btn s-btn-primary">Update Password</button>
              </div>
            </form>
          ) : (
            <div className="us-info-list">
              <div className="us-info-row">
                <span className="us-info-key">Password</span>
                <span className="us-info-val">
                  <span className="us-pw-dots">&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</span>
                  <span className="us-meta-chip us-meta-chip--muted" style={{ marginLeft: 10 }}>Last changed: Never</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="us-card">
          <div className="us-card-header"><h3 className="us-card-title">Two-Factor Authentication</h3></div>
          <div className="us-pref-list">
            <div className="us-pref-row">
              <div>
                <div className="us-pref-label">Enable 2FA</div>
                <div className="us-pref-hint">Adds a second sign-in step via a TOTP app</div>
              </div>
              <Toggle checked={twoFA} onChange={setTwoFA} />
            </div>
            {twoFA && (
              <div className="us-2fa-setup">
                <div className="us-2fa-qr">QR Code Placeholder</div>
                <p className="us-pref-hint">Scan with Google Authenticator or Authy</p>
              </div>
            )}
          </div>
        </div>

        <div className="us-card">
          <div className="us-card-header">
            <h3 className="us-card-title">Active Sessions</h3>
            <span className="us-card-desc">Signed-in devices</span>
          </div>
          <div className="us-session-list">
            {sessions.map(s => (
              <div key={s.id} className={`us-session-row ${s.current ? "us-session-row--current" : ""}`}>
                <div className="us-session-icon">
                  {s.device.includes("iPhone") ? "M" : s.device.includes("Firefox") ? "F" : "C"}
                </div>
                <div className="us-session-info">
                  <div className="us-session-device">{s.device}</div>
                  <div className="us-session-ip">{s.ip} &middot; {s.last}</div>
                </div>
                <div className="us-session-right">
                  {s.current
                    ? <span className="us-meta-chip" style={{ color: "#107c10", background: "#dff6dd" }}>Current</span>
                    : <button className="s-btn s-btn-danger s-btn-sm">Revoke</button>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
   ========================================================= */
export default function UserSettings({ userId = 1 }) {
  const [user,     setUser]     = useState(null);
  const [projects, setProjects] = useState([]);
  const [section,  setSection]  = useState("profile");


  const loadUser = () => getUser(userId).then(setUser).catch(console.error);

  useEffect(() => {
    loadUser();
    getProjects().then(setProjects).catch(console.error);
  }, [userId]); // eslint-disable-line

  return (
    <div className="us-page">

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="us-sidebar">
        <div className="us-sidebar-profile">
          <Avatar name={user?.name || ""} color={user?.avatar_color || "#0078d4"} size={48} />
          <div className="us-sidebar-profile-info">
            <div className="us-sidebar-name">{user?.name || "Loading..."}</div>
            <div className="us-sidebar-email">{user?.email || ""}</div>
          </div>
        </div>
        <nav className="us-nav">
          {NAV.map(item => (
            <button key={item.id}
              className={`us-nav-item ${section === item.id ? "us-nav-item--active" : ""}`}
              onClick={() => setSection(item.id)}>
              <span className="us-nav-label">{item.label}</span>
              {item.badge && <span className="us-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Content ──────────────────────────────────── */}
      <main className="us-main">
        <div className="us-main-header">
          <h1 className="us-main-title">{NAV.find(n => n.id === section)?.label}</h1>
          <div className="us-breadcrumb">User Settings &rsaquo; {NAV.find(n => n.id === section)?.label}</div>
        </div>

        {section === "profile"       && <ProfileTab       user={user} onSaved={loadUser} />}
        {section === "preferences"   && <PreferencesTab   />}
        {section === "notifications" && <NotificationsTab />}
        {section === "roles"         && <RolesTab         userId={userId} projects={projects} />}
        {section === "security"      && <SecurityTab      />}
      </main>
    </div>
  );
}
