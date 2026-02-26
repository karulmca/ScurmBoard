import React, { useMemo, useState } from "react";

/* ── Helpers ─────────────────────────────────────────────────────────── */
const STATE_COLOR = {
  New:      { bg: "#f3f2f1", text: "#a6a0a0", border: "#a6a0a0" },
  Active:   { bg: "#dce9f5", text: "#0078d4", border: "#0078d4" },
  Resolved: { bg: "#dff6dd", text: "#107c10", border: "#107c10" },
  Closed:   { bg: "#e1dfdd", text: "#323130", border: "#323130" },
};

const PRIORITY_LABEL = { 1: "Critical", 2: "High", 3: "Medium", 4: "Low" };
const PRIORITY_COLOR  = { 1: "#cc293d", 2: "#ca5010", 3: "#d9a800", 4: "#a19f9d" };

function sprintNum(s) {
  if (!s) return null;
  const m = String(s).match(/\d+/);
  return m ? parseInt(m[0]) : null;
}

function quarterLabel(sprintN, baseDate = new Date(new Date().getFullYear(), 0, 1)) {
  if (!sprintN) return "Backlog";
  const d = new Date(baseDate);
  d.setDate(d.getDate() + (sprintN - 1) * 14);
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

/* ── EpicCard ────────────────────────────────────────────────────────── */
function EpicCard({ epic, features, allWorkItems }) {
  const [expanded, setExpanded] = useState(false);

  const state = epic.state || "New";
  const sc = STATE_COLOR[state] || STATE_COLOR.New;
  const priority = epic.priority || 3;

  // Compute progress
  const relatedItems = allWorkItems.filter(w =>
    w.parent_id === epic.task_id ||
    w.epic_id === epic.task_id ||
    features.some(f => f.task_id === w.parent_id)
  );
  const total     = relatedItems.length;
  const completed = relatedItems.filter(w => w.state === "Closed" || w.state === "Resolved").length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  const sn = sprintNum(epic.sprint);
  const quarter = quarterLabel(sn);

  return (
    <div className="roadmap-epic-card">
      <div className="roadmap-epic-header" onClick={() => setExpanded(e => !e)}>
        <div className="roadmap-epic-top">
          <span className="roadmap-epic-icon">◆</span>
          <span className="roadmap-epic-id" style={{ color: "#5c2d91" }}>{epic.task_id}</span>
          <span className="roadmap-epic-title">{epic.title || "(No title)"}</span>
          <div className="roadmap-epic-meta">
            <span
              className="roadmap-state-badge"
              style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
            >
              {state}
            </span>
            <span
              className="roadmap-priority-dot"
              style={{ background: PRIORITY_COLOR[priority] }}
              title={PRIORITY_LABEL[priority]}
            />
            <span className="roadmap-quarter">{quarter}</span>
          </div>
          <span className="roadmap-expand-btn">{expanded ? "▾" : "▸"}</span>
        </div>

        <div className="roadmap-progress-row">
          <div className="roadmap-progress-bar-track">
            <div
              className="roadmap-progress-bar-fill"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? "#107c10" : "#0078d4",
              }}
            />
          </div>
          <span className="roadmap-progress-label">
            {completed}/{total} items · {pct}%
          </span>
        </div>
      </div>

      {expanded && (
        <div className="roadmap-features-list">
          {features.length === 0 ? (
            <div className="roadmap-no-features">No features linked to this epic.</div>
          ) : (
            features.map(f => {
              const fs = f.state || "New";
              const fsc = STATE_COLOR[fs] || STATE_COLOR.New;
              const fsn = sprintNum(f.sprint);
              return (
                <div key={f.task_id} className="roadmap-feature-row">
                  <span className="roadmap-feature-icon">▬</span>
                  <span className="roadmap-feature-id" style={{ color: "#773b93" }}>{f.task_id}</span>
                  <span className="roadmap-feature-title">{f.title || "(No title)"}</span>
                  <div className="roadmap-feature-meta">
                    <span
                      className="roadmap-state-badge roadmap-state-badge--sm"
                      style={{ background: fsc.bg, color: fsc.text, borderColor: fsc.border }}
                    >
                      {fs}
                    </span>
                    {fsn && (
                      <span className="roadmap-sprint-label">Sprint {fsn}</span>
                    )}
                    {f.story_points != null && (
                      <span className="roadmap-sp">{f.story_points} pts</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ── EpicRoadmap ─────────────────────────────────────────────────────── */
export default function EpicRoadmap({ workItems }) {
  const [filter, setFilter] = useState("All");

  const epics = useMemo(
    () => workItems.filter(w => w.work_item_type === "Epic"),
    [workItems]
  );

  const features = useMemo(
    () => workItems.filter(w => w.work_item_type === "Feature"),
    [workItems]
  );

  // Group features by parent epic
  const featuresByEpic = useMemo(() => {
    const map = {};
    features.forEach(f => {
      const key = f.parent_id || f.epic_id || "__none__";
      if (!map[key]) map[key] = [];
      map[key].push(f);
    });
    return map;
  }, [features]);

  // Filter epics by state
  const filteredEpics = useMemo(() => {
    if (filter === "All") return epics;
    return epics.filter(e => (e.state || "New") === filter);
  }, [epics, filter]);

  // Unassigned features (no parent epic in list)
  const epicIds = new Set(epics.map(e => e.task_id));
  const orphanFeatures = features.filter(f => {
    const key = f.parent_id || f.epic_id;
    return !key || !epicIds.has(key);
  });

  const states = ["All", "New", "Active", "Resolved", "Closed"];

  if (epics.length === 0 && features.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="timeline-empty-icon">🗺️</div>
        <div className="timeline-empty-text">No Epics or Features found.</div>
        <div className="timeline-empty-sub">
          Create Epic work items to see the roadmap.
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-container">
      {/* Toolbar */}
      <div className="roadmap-toolbar">
        <span className="roadmap-toolbar-label">Filter by state:</span>
        {states.map(s => (
          <button
            key={s}
            className={`roadmap-filter-btn ${filter === s ? "roadmap-filter-btn--active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
        <span className="roadmap-toolbar-count">
          {filteredEpics.length} Epic{filteredEpics.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Epic cards */}
      <div className="roadmap-epics">
        {filteredEpics.length === 0 ? (
          <div className="roadmap-no-results">No epics match the selected filter.</div>
        ) : (
          filteredEpics.map(epic => (
            <EpicCard
              key={epic.task_id}
              epic={epic}
              features={featuresByEpic[epic.task_id] || []}
              allWorkItems={workItems}
            />
          ))
        )}

        {/* Orphan features section */}
        {orphanFeatures.length > 0 && (
          <div className="roadmap-orphan-section">
            <div className="roadmap-orphan-title">Features without Epic</div>
            {orphanFeatures.map(f => {
              const fs = f.state || "New";
              const fsc = STATE_COLOR[fs] || STATE_COLOR.New;
              return (
                <div key={f.task_id} className="roadmap-feature-row roadmap-feature-row--standalone">
                  <span className="roadmap-feature-icon">▬</span>
                  <span className="roadmap-feature-id" style={{ color: "#773b93" }}>{f.task_id}</span>
                  <span className="roadmap-feature-title">{f.title || "(No title)"}</span>
                  <div className="roadmap-feature-meta">
                    <span
                      className="roadmap-state-badge roadmap-state-badge--sm"
                      style={{ background: fsc.bg, color: fsc.text, borderColor: fsc.border }}
                    >
                      {fs}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
