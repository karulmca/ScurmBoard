import React, { useState, useEffect, useRef } from "react";
import { getSprints, getRetrospective, createRetrospective, updateRetrospective } from "../services/api.js";

/* ─── helpers ────────────────────────────────────────────────── */
function parseItems(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return raw.split("\n").filter(Boolean).map((t, i) => ({ id: i + 1, text: t })); }
}
function serializeItems(items) { return JSON.stringify(items); }
let _seq = Date.now();
function uid() { return ++_seq; }

/* ─── column config ──────────────────────────────────────────── */
const COLUMNS = [
  { key: "positives",     label: "What went well",        icon: "😊", accent: "#107c10" },
  { key: "negatives",     label: "What didn't go well",   icon: "😟", accent: "#d13438" },
  { key: "needs_improve", label: "What need to improve",  icon: "❓", accent: "#ca5010" },
  { key: "actions",       label: "Action items",          icon: "👁", accent: "#0078d4" },
];
const PHASES = ["Collect", "Group", "Vote", "Act"];

/* ─── FeedbackCard ───────────────────────────────────────────── */
function FeedbackCard({ item, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);

  function save() {
    if (text.trim()) onEdit(item.id, text.trim());
    setEditing(false);
  }
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === "Escape") { setText(item.text); setEditing(false); }
  }

  if (editing) {
    return (
      <div className="retro-card retro-card--editing">
        <textarea autoFocus className="retro-card-input" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={handleKey} rows={3} />
        <div className="retro-card-footer">
          <button className="retro-btn-sm retro-btn-primary" onClick={save}>Save</button>
          <button className="retro-btn-sm retro-btn-ghost" onClick={() => { setText(item.text); setEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-card" onClick={() => setEditing(true)}>
      <div className="retro-card-text">{item.text}</div>
      <button className="retro-card-del" title="Delete"
        onClick={e => { e.stopPropagation(); onDelete(item.id); }}>×</button>
    </div>
  );
}

/* ─── AddFeedback ────────────────────────────────────────────── */
function AddFeedback({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const taRef = useRef();

  function submit() { if (text.trim()) { onAdd(text.trim()); setText(""); setOpen(false); } }
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
    if (e.key === "Escape") { setText(""); setOpen(false); }
  }
  useEffect(() => { if (open && taRef.current) taRef.current.focus(); }, [open]);

  if (open) {
    return (
      <div className="retro-add-open">
        <textarea ref={taRef} className="retro-card-input" value={text}
          onChange={e => setText(e.target.value)} onKeyDown={handleKey}
          rows={3} placeholder="Enter feedback… (Enter to save)" />
        <div className="retro-card-footer">
          <button className="retro-btn-sm retro-btn-primary" onClick={submit}>Add</button>
          <button className="retro-btn-sm retro-btn-ghost" onClick={() => { setText(""); setOpen(false); }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <button className="retro-add-btn" onClick={() => setOpen(true)}>
      <span className="retro-add-plus">＋</span> Add new feedback
    </button>
  );
}

/* ─── Column ─────────────────────────────────────────────────── */
function RetroColumn({ col, items, onAdd, onEdit, onDelete }) {
  return (
    <div className="retro-col">
      <div className="retro-col-header" style={{ borderTop: `3px solid ${col.accent}` }}>
        <span className="retro-col-icon">{col.icon}</span>
        <span className="retro-col-label">{col.label}</span>
        <span className="retro-col-count">{items.length}</span>
        <span className="retro-col-flag" title="Flag column">⚑</span>
      </div>
      <div className="retro-col-body">
        {items.map(item => (
          <FeedbackCard key={item.id} item={item}
            onEdit={(id, t) => onEdit(col.key, id, t)}
            onDelete={id => onDelete(col.key, id)} />
        ))}
        <AddFeedback onAdd={t => onAdd(col.key, t)} />
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function Retrospectives({ projectId }) {
  const [sprints, setSprints]               = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [retro, setRetro]                   = useState(null);
  const [items, setItems]                   = useState({ positives: [], negatives: [], needs_improve: [], actions: [] });
  const [activeTab, setActiveTab]           = useState("Board");
  const [activePhase, setActivePhase]       = useState("Collect");
  const [saving, setSaving]                 = useState(false);

  useEffect(() => { if (projectId) getSprints(projectId).then(setSprints); }, [projectId]);

  useEffect(() => {
    if (!selectedSprint) return;
    getRetrospective(selectedSprint.id)
      .then(r => {
        setRetro(r);
        setItems({
          positives:     parseItems(r?.positives),
          negatives:     parseItems(r?.negatives),
          needs_improve: parseItems(r?.needs_improve),
          actions:       parseItems(r?.actions),
        });
      })
      .catch(() => {
        setRetro(null);
        setItems({ positives: [], negatives: [], needs_improve: [], actions: [] });
      });
  }, [selectedSprint]);

  /* debounced auto-save */
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!selectedSprint) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 800);
    return () => clearTimeout(saveTimer.current);
  }, [items]);   // eslint-disable-line

  async function doSave() {
    if (!selectedSprint) return;
    setSaving(true);
    const payload = {
      positives:     serializeItems(items.positives),
      negatives:     serializeItems(items.negatives),
      needs_improve: serializeItems(items.needs_improve),
      actions:       serializeItems(items.actions),
    };
    try {
      if (retro) { await updateRetrospective(selectedSprint.id, payload); }
      else { const r = await createRetrospective(selectedSprint.id, payload); setRetro(r); }
    } catch {}
    setSaving(false);
  }

  function addItem(key, text) {
    setItems(p => ({ ...p, [key]: [...p[key], { id: uid(), text }] }));
  }
  function editItem(key, id, text) {
    setItems(p => ({ ...p, [key]: p[key].map(it => it.id === id ? { ...it, text } : it) }));
  }
  function deleteItem(key, id) {
    setItems(p => ({ ...p, [key]: p[key].filter(it => it.id !== id) }));
  }

  return (
    <div className="retro-page">

      {/* ── Header ──────────────────────────────────── */}
      <div className="retro-page-header">
        <div className="retro-page-header-left">
          <h1 className="retro-page-title">Retrospectives</h1>
          {saving && <span className="retro-saving-badge">Saving…</span>}
        </div>
        <div className="retro-page-header-right">
          <span className="retro-timer-badge">⏱ 5 min</span>
        </div>
      </div>

      {/* ── Sub-nav ─────────────────────────────────── */}
      <div className="retro-subnav">
        <div className="retro-subnav-left">
          {["Board", "History"].map(tab => (
            <button key={tab}
              className={`retro-tab-btn ${activeTab === tab ? "retro-tab-btn--active" : ""}`}
              onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}

          <span className="retro-subnav-sep" />

          <div className="retro-sprint-pill">
            <span className="retro-sprint-ico">📅</span>
            <select className="retro-sprint-sel"
              value={selectedSprint?.id || ""}
              onChange={e => setSelectedSprint(sprints.find(s => s.id === Number(e.target.value)) || null)}>
              <option value="">— Select Sprint —</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <button className="retro-tab-btn retro-tab-btn--secondary">⋯</button>
          <button className="retro-tab-btn retro-tab-btn--secondary">👥 Team Assessment</button>
        </div>

        <div className="retro-phases">
          {PHASES.map(ph => (
            <button key={ph}
              className={`retro-phase-btn ${activePhase === ph ? "retro-phase-btn--active" : ""}`}
              onClick={() => setActivePhase(ph)}>{ph}</button>
          ))}
        </div>
      </div>

      {/* ── Board ───────────────────────────────────── */}
      {activeTab === "Board" && (
        !selectedSprint ? (
          <div className="retro-empty">
            <div className="retro-empty-ico">📋</div>
            <p className="retro-empty-msg">Select a sprint to view or start a retrospective</p>
          </div>
        ) : (
          <div className="retro-board">
            {COLUMNS.map(col => (
              <RetroColumn key={col.key} col={col} items={items[col.key]}
                onAdd={addItem} onEdit={editItem} onDelete={deleteItem} />
            ))}
          </div>
        )
      )}

      {/* ── History ─────────────────────────────────── */}
      {activeTab === "History" && (
        <div className="retro-history">
          <table className="retro-history-tbl">
            <thead>
              <tr>
                <th>Sprint</th>
                {COLUMNS.map(c => <th key={c.key}>{c.icon} {c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {sprints.length === 0
                ? <tr><td colSpan={5} className="retro-muted" style={{ textAlign:"center", padding:"32px" }}>No sprints found</td></tr>
                : sprints.map(s => (
                    <tr key={s.id} className={s.id === selectedSprint?.id ? "retro-history-row--active" : ""}>
                      <td><b>{s.name}</b></td>
                      {COLUMNS.map(c => (
                        <td key={c.key}>
                          {s.id === selectedSprint?.id
                            ? items[c.key].map(i => <div key={i.id} className="retro-history-pill">• {i.text}</div>)
                            : <span className="retro-muted">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
