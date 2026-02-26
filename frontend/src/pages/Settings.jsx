import React, { useState, useEffect, useCallback } from "react";
import {
  getOrganizations, createOrganization, updateOrganization, deleteOrganization,
  getConfig, upsertConfig, resetConfig,
} from "../services/api.js";
import { DEFAULT_CONFIG } from "../constants.js";
import { invalidateConfigCache } from "../hooks/useConfig.js";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove,
  verticalListSortingStrategy, horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ─── Theme palette ──────────────────────────────────────────── */
const THEME_COLORS = [
  "#0078d4","#106ebe","#107c10","#498205","#ca5010","#d83b01",
  "#8764b8","#7719aa","#038387","#005b70","#d9a800","#986f0b",
  "#e3008c","#b4009e","#243a5e","#004e8c",
];

/* ─── Left nav items ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "organizations", icon: "\uD83C\uDFE2", label: "Organizations" },
  { id: "configuration", icon: "\uD83D\uDD27", label: "Configuration" },
  { id: "appearance",    icon: "\uD83C\uDFA8", label: "Appearance"    },
  { id: "general",       icon: "\u2139\uFE0F",  label: "About"        },
];

/* ─── Config meta ────────────────────────────────────────────── */
const CONFIG_META = {
  work_item_types:    { label: "Work Item Types",    desc: "Types of work items (Epic, User Story, Bug...)",     kind: "string-list", icon: "\uD83D\uDCCB" },
  work_item_states:   { label: "Work Item States",   desc: "Lifecycle states (New, Active, Closed...)",          kind: "string-list", icon: "\uD83D\uDD04" },
  methodologies:      { label: "Methodologies",      desc: "Project management methods shown in project creation", kind: "string-list", icon: "\uD83D\uDE80" },
  sprint_states:      { label: "Sprint States",      desc: "Lifecycle states for sprints",                       kind: "string-list", icon: "\uD83C\uDFC3" },
  project_states:     { label: "Project States",     desc: "Lifecycle states for projects",                      kind: "string-list", icon: "\uD83D\uDCC1" },
  criticality_levels: { label: "Criticality Levels", desc: "Risk / severity labels",                             kind: "string-list", icon: "\u26A0\uFE0F" },
  sub_states:         { label: "Sub-States",         desc: "Detailed sub-states for richer task tracking",       kind: "string-list", icon: "\uD83D\uDD00" },
  preset_colors:      { label: "Preset Colors",      desc: "Accent color swatches for projects and orgs",        kind: "color-list",  icon: "\uD83C\uDFA8" },
  preset_icons:       { label: "Preset Icons",       desc: "Emoji icon options for project cards",               kind: "string-list", icon: "\u2728"       },
  priorities:         { label: "Priorities",         desc: "Priority levels with value, label, color",           kind: "json",        icon: "\uD83D\uDCCA" },
  type_hierarchy:     { label: "Type Hierarchy",     desc: "Parent-child relationships between work item types",  kind: "json",        icon: "\uD83D\uDDC2\uFE0F" },
};

/* =========================================================
   DRAG-AND-DROP CHIPS
   ========================================================= */

function SortableChip({ id, label, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <span ref={setNodeRef} style={style} className="s-chip" {...attributes}>
      <span className="s-chip-handle" {...listeners} title="Drag to reorder">::</span>
      <span className="s-chip-label">{label}</span>
      <button type="button" className="s-chip-del" onClick={() => onRemove(id)}>x</button>
    </span>
  );
}

function StringListEditor({ value, onChange }) {
  const [draft, setDraft] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = value.map((v, i) => `chip-${i}-${v}`);

  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) { onChange([...value, t]); setDraft(""); }
  };
  const remove = (chipId) => {
    const idx = ids.indexOf(chipId);
    onChange(value.filter((_, i) => i !== idx));
  };
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onChange(arrayMove(value, ids.indexOf(active.id), ids.indexOf(over.id)));
  };

  return (
    <div className="sle-wrap">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          <div className="sle-chips">
            {value.map((v, i) => (
              <SortableChip key={ids[i]} id={ids[i]} label={v} onRemove={remove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="sle-add-row">
        <input className="s-add-input" placeholder="Add new value and press Enter..."
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} />
        <button type="button" className="s-add-btn" onClick={add}>+ Add</button>
      </div>
    </div>
  );
}

function SortableColorChip({ id, color, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <span ref={setNodeRef} style={{ ...style, background: color }} className="s-color-chip"
      {...attributes}>
      <span className="s-chip-handle" {...listeners}>::</span>
      <span className="s-color-hex">{color}</span>
      <button type="button" className="s-chip-del light" onClick={() => onRemove(id)}>x</button>
    </span>
  );
}

function ColorListEditor({ value, onChange }) {
  const [draft, setDraft] = useState("#0078d4");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = value.map((c, i) => `color-${i}-${c}`);

  const add = () => { if (!value.includes(draft)) onChange([...value, draft]); };
  const remove = (chipId) => {
    const idx = ids.indexOf(chipId);
    onChange(value.filter((_, i) => i !== idx));
  };
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onChange(arrayMove(value, ids.indexOf(active.id), ids.indexOf(over.id)));
  };

  return (
    <div className="sle-wrap">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          <div className="sle-chips">
            {value.map((c, i) => (
              <SortableColorChip key={ids[i]} id={ids[i]} color={c} onRemove={remove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="sle-add-row">
        <input type="color" className="s-color-picker" value={draft}
          onChange={e => setDraft(e.target.value)} />
        <code className="s-color-code" style={{ color: draft }}>{draft}</code>
        <button type="button" className="s-add-btn" onClick={add}>+ Add</button>
      </div>
    </div>
  );
}

function JsonEditor({ value, onChange }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [err, setErr]   = useState("");
  const handle = (val) => {
    setText(val);
    try { onChange(JSON.parse(val)); setErr(""); } catch { setErr("Invalid JSON"); }
  };
  return (
    <div className="json-editor-wrap">
      <textarea className="json-editor" rows={10} value={text} spellCheck={false}
        onChange={e => handle(e.target.value)} />
      {err && <div className="s-form-error">{err}</div>}
    </div>
  );
}

/* =========================================================
   ORGANIZATION CARD (sortable)
   ========================================================= */

function SortableOrgCard({ org, isActive, onSelect, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: org.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 100 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}
      className={`s-org-card ${isActive ? "s-org-card--active" : ""}`}
      onClick={() => onSelect(org)}>

      <div className="s-org-accent" style={{ background: org.theme_color || "#0078d4" }} />

      <span className="s-org-drag-handle" {...attributes} {...listeners}
        onClick={e => e.stopPropagation()} title="Drag to reorder">
        &#8942;&#8942;
      </span>

      <div className="s-org-avatar" style={{ background: org.theme_color || "#0078d4" }}>
        {org.logo_url
          ? <img src={org.logo_url} alt={org.name} />
          : org.name.charAt(0).toUpperCase()}
      </div>

      <div className="s-org-info">
        <div className="s-org-name">{org.name}</div>
        <div className="s-org-slug">@{org.slug}</div>
        {org.theme_color && (
          <div className="s-org-color-dot" style={{ background: org.theme_color }} />
        )}
      </div>

      <div className="s-org-actions" onClick={e => e.stopPropagation()}>
        <button className="s-icon-btn" title="Edit" onClick={() => onEdit(org)}>Edit</button>
        <button className="s-icon-btn s-icon-btn--danger" title="Delete" onClick={() => onDelete(org)}>Del</button>
      </div>
    </div>
  );
}

/* ─── Org Form ───────────────────────────────────────────────── */
function OrgForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:        initial.name        ?? "",
    slug:        initial.slug        ?? "",
    logo_url:    initial.logo_url    ?? "",
    theme_color: initial.theme_color ?? "#0078d4",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (val) => setForm(f => ({
    ...f, name: val,
    slug: initial.id ? f.slug : val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) { setError("Name and slug are required"); return; }
    setSaving(true); setError("");
    try {
      await onSave({
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        logo_url: form.logo_url.trim() || null,
        theme_color: form.theme_color,
      });
    } catch (err) { setError(err.message); setSaving(false); }
  };

  return (
    <form className="s-form" onSubmit={handleSubmit}>
      {error && <div className="s-form-error">{error}</div>}

      <div className="s-form-row">
        <div className="s-form-col flex-2">
          <label className="s-label">Organization Name *</label>
          <input className="s-input" value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Acme Corporation" autoFocus />
        </div>
        <div className="s-form-col flex-1">
          <label className="s-label">Slug *</label>
          <input className="s-input s-mono" value={form.slug}
            onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="acme-corp" />
          <span className="s-hint">Used in URLs — must be unique</span>
        </div>
      </div>

      <div className="s-form-group">
        <label className="s-label">Logo URL</label>
        <div className="s-logo-row">
          <input className="s-input" value={form.logo_url}
            onChange={e => set("logo_url", e.target.value)}
            placeholder="https://company.com/logo.png" />
          {form.logo_url && (
            <img src={form.logo_url} className="s-logo-preview" alt="Logo preview"
              onError={e => { e.target.style.display = "none"; }} />
          )}
        </div>
      </div>

      <div className="s-form-group">
        <label className="s-label">Theme Color</label>
        <div className="s-color-row">
          {THEME_COLORS.map(c => (
            <button type="button" key={c}
              className={`s-swatch ${form.theme_color === c ? "s-swatch--active" : ""}`}
              style={{ background: c }}
              onClick={() => set("theme_color", c)}
              title={c} />
          ))}
          <div className="s-custom-color">
            <input type="color" value={form.theme_color}
              onChange={e => set("theme_color", e.target.value)} />
            <code>{form.theme_color}</code>
          </div>
        </div>
        <div className="s-preview-bar" style={{ background: form.theme_color }}>
          Preview: {form.name || "Organization Name"}
        </div>
      </div>

      <div className="s-form-footer">
        <button type="button" className="s-btn s-btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="s-btn s-btn-primary" disabled={saving}>
          {saving ? "Saving..." : initial.id ? "Save Changes" : "Create Organization"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   CONFIG KEY CARD (collapsible)
   ========================================================= */

function ConfigKeyCard({ cfgKey, meta, value, isDirty, isSaving, wasSaved, onChange, onSave, onReset }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`s-cfg-card ${isDirty ? "s-cfg-card--dirty" : ""} ${open ? "s-cfg-card--open" : ""}`}>
      <div className="s-cfg-header" onClick={() => setOpen(o => !o)}>
        <span className="s-cfg-icon">{meta.icon}</span>
        <div className="s-cfg-titles">
          <span className="s-cfg-label">{meta.label}</span>
          <code className="s-cfg-key">{cfgKey}</code>
        </div>
        <div className="s-cfg-right">
          {isDirty && <span className="s-dirty-dot" title="Unsaved changes" />}
          <div className="s-cfg-actions" onClick={e => e.stopPropagation()}>
            {isDirty && (
              <button className="s-btn s-btn-sm s-btn-primary" disabled={isSaving}
                onClick={() => onSave(cfgKey)}>
                {isSaving ? "..." : "Save"}
              </button>
            )}
            {wasSaved && <span className="s-saved-badge">Saved</span>}
            <button className="s-btn s-btn-sm s-btn-ghost" disabled={isSaving}
              onClick={() => onReset(cfgKey)} title="Reset to default">Reset</button>
          </div>
          <span className="s-cfg-chevron">{open ? "v" : ">"}</span>
        </div>
      </div>
      {open && (
        <div className="s-cfg-body">
          <p className="s-cfg-desc">{meta.desc}</p>
          {meta.kind === "string-list" && <StringListEditor value={value} onChange={v => onChange(cfgKey, v)} />}
          {meta.kind === "color-list"  && <ColorListEditor  value={value} onChange={v => onChange(cfgKey, v)} />}
          {meta.kind === "json"        && <JsonEditor        value={value} onChange={v => onChange(cfgKey, v)} />}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   CONFIGURATION TAB
   ========================================================= */

function ConfigurationTab({ orgs }) {
  const [scopeOrgId, setScopeOrgId] = useState(null);
  const [config,  setConfig]  = useState(DEFAULT_CONFIG);
  const [dirty,   setDirty]   = useState({});
  const [saving,  setSaving]  = useState(null);
  const [saved,   setSaved]   = useState(null);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    getConfig(scopeOrgId).then(setConfig).catch(console.error);
    setDirty({});
  }, [scopeOrgId]);

  const handle  = (k, v) => setDirty(p => ({ ...p, [k]: v }));
  const effVal  = (k) => (k in dirty ? dirty[k] : config[k] ?? DEFAULT_CONFIG[k]);

  const doSave = async (key) => {
    setSaving(key);
    try {
      await upsertConfig(key, dirty[key], scopeOrgId);
      const fresh = await getConfig(scopeOrgId);
      setConfig(fresh);
      setDirty(p => { const n = { ...p }; delete n[key]; return n; });
      invalidateConfigCache(scopeOrgId);
      setSaved(key); setTimeout(() => setSaved(null), 2000);
    } catch (e) { alert(e.message); } finally { setSaving(null); }
  };

  const doReset = async (key) => {
    if (!window.confirm(`Reset "${CONFIG_META[key]?.label}" to system defaults?`)) return;
    setSaving(key);
    try {
      await resetConfig(key, scopeOrgId);
      const fresh = await getConfig(scopeOrgId);
      setConfig(fresh);
      setDirty(p => { const n = { ...p }; delete n[key]; return n; });
      invalidateConfigCache(scopeOrgId);
    } catch (e) { alert(e.message); } finally { setSaving(null); }
  };

  const filtered = Object.entries(CONFIG_META).filter(([k, m]) =>
    !search || m.label.toLowerCase().includes(search.toLowerCase()) || k.includes(search.toLowerCase())
  );
  const dirtyCount = Object.keys(dirty).length;

  return (
    <div className="s-section">
      <div className="s-toolbar">
        <div className="s-toolbar-left">
          <input className="s-search" placeholder="Search settings..." value={search}
            onChange={e => setSearch(e.target.value)} />
          {dirtyCount > 0 && <span className="s-dirty-count">{dirtyCount} unsaved</span>}
        </div>
        <div className="s-toolbar-right">
          <label className="s-label" style={{ marginBottom: 0, marginRight: 8 }}>Scope</label>
          <select className="s-select" value={scopeOrgId ?? ""}
            onChange={e => setScopeOrgId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Global (all orgs)</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>
      <p className="s-desc">Drag chips to reorder. Changes to a specific organisation override global defaults.</p>
      <div className="s-cfg-list">
        {filtered.map(([key, meta]) => (
          <ConfigKeyCard key={key} cfgKey={key} meta={meta}
            value={effVal(key)}
            isDirty={key in dirty} isSaving={saving === key} wasSaved={saved === key}
            onChange={handle} onSave={doSave} onReset={doReset} />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   APPEARANCE TAB
   ========================================================= */

function AppearanceTab() {
  const [density, setDensity] = useState("comfortable");
  const [accent,  setAccent]  = useState("#0078d4");
  return (
    <div className="s-section">
      <div className="s-appear-grid">
        <div className="s-appear-card">
          <div className="s-appear-icon">Display</div>
          <div className="s-appear-title">Display Density</div>
          <div className="s-appear-desc">Choose how compact the interface looks</div>
          <div className="s-density-btns">
            {["Compact","Comfortable","Spacious"].map(d => (
              <button key={d}
                className={`s-density-btn ${density === d.toLowerCase() ? "s-density-btn--active" : ""}`}
                onClick={() => setDensity(d.toLowerCase())}>{d}</button>
            ))}
          </div>
        </div>

        <div className="s-appear-card">
          <div className="s-appear-icon">Color</div>
          <div className="s-appear-title">Accent Color</div>
          <div className="s-appear-desc">Primary action color used across the UI</div>
          <div className="s-color-row" style={{ marginTop: 12 }}>
            {THEME_COLORS.slice(0, 8).map(c => (
              <button key={c} type="button"
                className={`s-swatch ${accent === c ? "s-swatch--active" : ""}`}
                style={{ background: c }} onClick={() => setAccent(c)} />
            ))}
          </div>
          <div className="s-preview-bar" style={{ background: accent, marginTop: 10 }}>
            Button Preview
          </div>
        </div>

        <div className="s-appear-card">
          <div className="s-appear-icon">Theme</div>
          <div className="s-appear-title">Color Theme</div>
          <div className="s-appear-desc">Light mode is active. Dark mode coming soon.</div>
          <div className="s-density-btns" style={{ marginTop: 12 }}>
            <button className="s-density-btn s-density-btn--active">Light</button>
            <button className="s-density-btn" disabled style={{ opacity: 0.45 }}>Dark (soon)</button>
          </div>
        </div>

        <div className="s-appear-card">
          <div className="s-appear-icon">Font</div>
          <div className="s-appear-title">Font Size</div>
          <div className="s-appear-desc">Base font size for the application</div>
          <div className="s-density-btns" style={{ marginTop: 12 }}>
            {["Small","Medium","Large"].map(s => (
              <button key={s}
                className={`s-density-btn ${s === "Medium" ? "s-density-btn--active" : ""}`}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ABOUT TAB
   ========================================================= */

function AboutTab() {
  const features = [
    { icon: "Scrum", title: "Methodology Support",  desc: "Scrum, Kanban, SAFe, XP, Lean — each project uses its own process" },
    { icon: "Multi", title: "Multi-Tenant",          desc: "Create multiple organizations and manage projects across companies" },
    { icon: "Theme", title: "Fully Customizable",    desc: "Custom colors, icons, and branding per project and organization" },
    { icon: "ADO",   title: "ADO Import",            desc: "Import Azure DevOps work items from CSV, JSON, or Excel" },
    { icon: "Chart", title: "Reports & Analytics",   desc: "Burndown charts, velocity, cycle time, and health reports" },
    { icon: "App",   title: "Mobile App",            desc: "React Native mobile companion app for on-the-go updates" },
    { icon: "Retro", title: "Retrospectives",        desc: "ADO-style retrospective boards with Collect/Group/Vote/Act phases" },
    { icon: "API",   title: "REST API",              desc: "FastAPI backend with full OpenAPI documentation at /docs" },
  ];
  return (
    <div className="s-section">
      <div className="s-about-hero">
        <div className="s-about-logo">SB</div>
        <div>
          <h2 className="s-about-title">Scrum Board</h2>
          <p className="s-about-version">v1.0.0 &middot; React 18 &middot; FastAPI &middot; PostgreSQL</p>
        </div>
      </div>
      <div className="s-feature-grid">
        {features.map((f, i) => (
          <div key={i} className="s-feature-card">
            <div className="s-feature-badge">{f.icon}</div>
            <div className="s-feature-title">{f.title}</div>
            <div className="s-feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN SETTINGS PAGE
   ========================================================= */

export default function Settings() {
  const [orgs,      setOrgs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(null);
  const [activeOrg, setActiveOrg] = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const [section,   setSection]   = useState("organizations");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrganizations();
      setOrgs(data);
      if (!activeOrg && data.length > 0) setActiveOrg(data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  const handleSave = async (data) => {
    if (editing && editing !== "new") await updateOrganization(editing.id, data);
    else await createOrganization(data);
    setEditing(null);
    loadOrgs();
  };

  const handleDelete = async () => {
    await deleteOrganization(confirm.id);
    setConfirm(null);
    if (activeOrg?.id === confirm.id) setActiveOrg(null);
    loadOrgs();
  };

  const handleOrgDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setOrgs(prev => {
      const oldIdx = prev.findIndex(o => o.id === active.id);
      const newIdx = prev.findIndex(o => o.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const currentNav = NAV_ITEMS.find(n => n.id === section);

  return (
    <div className="s-page">

      {/* ── Left sidebar ─────────────────────────────── */}
      <nav className="s-nav">
        <div className="s-nav-header">
          <span className="s-nav-logo-text">Settings</span>
        </div>
        <ul className="s-nav-list">
          {NAV_ITEMS.map(item => (
            <li key={item.id}>
              <button
                className={`s-nav-item ${section === item.id ? "s-nav-item--active" : ""}`}
                onClick={() => setSection(item.id)}>
                <span className="s-nav-label">{item.label}</span>
                {item.id === "organizations" && orgs.length > 0 && (
                  <span className="s-nav-badge">{orgs.length}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Main content ─────────────────────────────── */}
      <main className="s-main">
        <div className="s-content-header">
          <h1 className="s-content-title">{currentNav?.label}</h1>
          {section === "organizations" && (
            <button className="s-btn s-btn-primary" onClick={() => setEditing("new")}>
              + Add Organization
            </button>
          )}
        </div>

        {/* ─── Organizations ──────────────────────────── */}
        {section === "organizations" && (
          <div className="s-section">
            {editing && (
              <div className="s-form-panel">
                <div className="s-form-panel-header">
                  <h3>{editing === "new" ? "New Organization" : `Edit: ${editing.name}`}</h3>
                  <button className="s-close-btn" onClick={() => setEditing(null)}>X</button>
                </div>
                <OrgForm
                  initial={editing === "new" ? {} : editing}
                  onSave={handleSave}
                  onCancel={() => setEditing(null)} />
              </div>
            )}

            {loading ? (
              <div className="s-loading">
                <div className="s-spinner" />
                <span>Loading organizations...</span>
              </div>
            ) : orgs.length === 0 ? (
              <div className="s-empty">
                <div className="s-empty-title">No organizations yet</div>
                <p className="s-empty-sub">Create your first organization to group your projects.</p>
                <button className="s-btn s-btn-primary" onClick={() => setEditing("new")}>
                  + Create Organization
                </button>
              </div>
            ) : (
              <>
                <p className="s-desc">Drag the handle (&nbsp;::&nbsp;) to reorder organizations.</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter}
                  onDragEnd={handleOrgDragEnd}>
                  <SortableContext items={orgs.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    <div className="s-org-list">
                      {orgs.map(o => (
                        <SortableOrgCard key={o.id} org={o}
                          isActive={activeOrg?.id === o.id}
                          onSelect={setActiveOrg}
                          onEdit={setEditing}
                          onDelete={setConfirm} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </div>
        )}

        {/* ─── Configuration ──────────────────────────── */}
        {section === "configuration" && <ConfigurationTab orgs={orgs} />}

        {/* ─── Appearance ─────────────────────────────── */}
        {section === "appearance" && <AppearanceTab />}

        {/* ─── About ──────────────────────────────────── */}
        {section === "general" && <AboutTab />}
      </main>

      {/* ─── Delete confirm modal ───────────────────── */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="s-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="s-confirm-title">Delete Organization?</h3>
            <p className="s-confirm-body">
              Delete <strong>{confirm.name}</strong>? Projects in this organization will become
              unassigned. This action cannot be undone.
            </p>
            <div className="s-confirm-footer">
              <button className="s-btn s-btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="s-btn s-btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
