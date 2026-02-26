import React, { useMemo, useState } from "react";

/* ── helpers ─────────────────────────────────────────────────────────── */
const TYPE_COLORS = {
  Epic:    { bg: "#5c2d91", text: "#fff" },
  Feature: { bg: "#773b93", text: "#fff" },
  Story:   { bg: "#009ccc", text: "#fff" },
  Task:    { bg: "#d9a800", text: "#fff" },
  Bug:     { bg: "#cc293d", text: "#fff" },
};

const STATE_DOT = {
  New:      "#a6a0a0",
  Active:   "#0078d4",
  Resolved: "#107c10",
  Closed:   "#323130",
};

function sprintNum(s) {
  if (!s) return null;
  const m = String(s).match(/\d+/);
  return m ? parseInt(m[0]) : null;
}

/**
 * EpicFeatureTimeline
 * Shows Epics with their children Features as a sprint-based Gantt chart.
 * types prop: array of types to include (default: ["Epic","Feature"])
 */
export default function EpicFeatureTimeline({ workItems, types = ["Epic", "Feature"] }) {
  const [expandedEpics, setExpandedEpics] = useState(new Set());

  // Collect sprint range
  const sprintNums = useMemo(() => {
    const nums = workItems
      .map(w => sprintNum(w.sprint))
      .filter(n => n !== null);
    if (!nums.length) return [1, 2, 3, 4, 5, 6];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [workItems]);

  const minSprint = sprintNums[0];
  const maxSprint = sprintNums[sprintNums.length - 1];
  const totalSprints = maxSprint - minSprint + 1;

  // Filter only relevant types
  const filtered = useMemo(
    () => workItems.filter(w => types.includes(w.work_item_type)),
    [workItems, types]
  );

  // Group features/stories under epics
  const epics = useMemo(
    () => filtered.filter(w => w.work_item_type === "Epic"),
    [filtered]
  );

  const childType = types.includes("Feature") ? "Feature" : types[1] || "Story";
  const children = useMemo(
    () => filtered.filter(w => w.work_item_type !== "Epic"),
    [filtered]
  );

  // Map feature -> epic via parent_id or grouping by title prefix
  const childrenByEpic = useMemo(() => {
    const map = {};
    children.forEach(w => {
      const key = w.parent_id || w.epic_id || "unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(w);
    });
    return map;
  }, [children]);

  const toggleEpic = (id) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Compute bar position for item
  const getBar = (item) => {
    const sn = sprintNum(item.sprint);
    const sp = sn ?? (minSprint + Math.floor(Math.random() * totalSprints));
    const left = ((sp - minSprint) / totalSprints) * 100;
    const width = (1 / totalSprints) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 8)}%` };
  };

  const typeColor = (type) => TYPE_COLORS[type] || { bg: "#0078d4", text: "#fff" };

  const today = new Date();
  const SPRINT_WEEKS = 2;
  const baseDate = new Date(today.getFullYear(), 0, 1); // Jan 1 of this year

  const sprintStartDate = (n) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + (n - 1) * SPRINT_WEEKS * 7);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!filtered.length) {
    return (
      <div className="timeline-empty">
        <div className="timeline-empty-icon">📅</div>
        <div className="timeline-empty-text">
          No {types.join(" or ")} items found.
        </div>
        <div className="timeline-empty-sub">
          Create {types[0]} work items with sprint assignments to see the timeline.
        </div>
      </div>
    );
  }

  // If no epics, show flat list of filtered items
  const hasEpics = epics.length > 0;
  const rows = hasEpics ? epics : filtered;

  return (
    <div className="timeline-container">
      {/* Header */}
      <div className="timeline-header-row">
        <div className="timeline-label-col timeline-label-header">Work Item</div>
        <div className="timeline-chart-col">
          <div className="timeline-sprint-headers">
            {sprintNums.map(n => (
              <div key={n} className="timeline-sprint-header">
                <span className="timeline-sprint-label">Sprint {n}</span>
                <span className="timeline-sprint-date">{sprintStartDate(n)}</span>
              </div>
            ))}
          </div>
          {/* Today marker */}
          <div className="timeline-today-line" style={{
            left: `${Math.min(100, Math.max(0,
              ((today - baseDate) / (totalSprints * SPRINT_WEEKS * 7 * 86400000)) * 100
            ))}%`
          }} />
        </div>
      </div>

      {/* Rows */}
      <div className="timeline-body">
        {rows.map(epic => {
          const bar = getBar(epic);
          const epicChildren = childrenByEpic[epic.task_id] || [];
          const isExpanded = expandedEpics.has(epic.task_id);
          const tc = typeColor(epic.work_item_type);

          return (
            <React.Fragment key={epic.task_id}>
              {/* Epic / parent row */}
              <div className="timeline-row timeline-row--parent">
                <div className="timeline-label-col">
                  <div className="timeline-item-info">
                    {hasEpics && epicChildren.length > 0 && (
                      <button
                        className="timeline-expand-btn"
                        onClick={() => toggleEpic(epic.task_id)}
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? "▾" : "▸"}
                      </button>
                    )}
                    {(!hasEpics || epicChildren.length === 0) && (
                      <span style={{ width: 18, display: "inline-block" }} />
                    )}
                    <span
                      className="timeline-type-badge"
                      style={{ background: tc.bg, color: tc.text }}
                    >
                      {epic.work_item_type}
                    </span>
                    <span className="timeline-item-id">{epic.task_id}</span>
                    <span
                      className="timeline-dot"
                      style={{ background: STATE_DOT[epic.state || "New"] }}
                      title={epic.state || "New"}
                    />
                    <span className="timeline-item-title" title={epic.title}>
                      {epic.title || "(No title)"}
                    </span>
                  </div>
                </div>
                <div className="timeline-chart-col">
                  <div className="timeline-grid">
                    {sprintNums.map(n => (
                      <div key={n} className="timeline-grid-cell" />
                    ))}
                  </div>
                  <div
                    className={`timeline-bar timeline-bar--${epic.work_item_type.toLowerCase()}`}
                    style={{ left: bar.left, width: bar.width }}
                    title={`${epic.task_id}: ${epic.title} (Sprint ${sprintNum(epic.sprint) ?? "?"})`}
                  >
                    <span className="timeline-bar-label">{epic.title}</span>
                  </div>
                </div>
              </div>

              {/* Children rows */}
              {isExpanded && epicChildren.map(child => {
                const cbar = getBar(child);
                const cc = typeColor(child.work_item_type);
                return (
                  <div key={child.task_id} className="timeline-row timeline-row--child">
                    <div className="timeline-label-col">
                      <div className="timeline-item-info timeline-item-info--child">
                        <span style={{ width: 36, display: "inline-block" }} />
                        <span
                          className="timeline-type-badge"
                          style={{ background: cc.bg, color: cc.text }}
                        >
                          {child.work_item_type}
                        </span>
                        <span className="timeline-item-id">{child.task_id}</span>
                        <span
                          className="timeline-dot"
                          style={{ background: STATE_DOT[child.state || "New"] }}
                          title={child.state || "New"}
                        />
                        <span className="timeline-item-title" title={child.title}>
                          {child.title || "(No title)"}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-chart-col">
                      <div className="timeline-grid">
                        {sprintNums.map(n => (
                          <div key={n} className="timeline-grid-cell" />
                        ))}
                      </div>
                      <div
                        className={`timeline-bar timeline-bar--${child.work_item_type.toLowerCase()}`}
                        style={{ left: cbar.left, width: cbar.width }}
                        title={`${child.task_id}: ${child.title}`}
                      >
                        <span className="timeline-bar-label">{child.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
