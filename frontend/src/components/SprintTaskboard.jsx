import React, { useMemo, useState } from "react";
import { TypeBadge, Avatar, PriDot } from "./WorkItemModal.jsx";
import { useConfig } from "../hooks/useConfig.js";

/* ── State dot ──────────────────────────────────────────────────────── */
const STATE_DOT_COLOR = {
  New:       "#a6a0a0",
  Active:    "#0078d4",
  Resolved:  "#107c10",
  Committed: "#ca5010",
  Blocked:   "#cc293d",
  Closed:    "#323130",
};

/* ── Task Card ──────────────────────────────────────────────────────── */
function TaskCard({ item, states, onStateChange, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeKey = (item.work_item_type || "Task").replace(/\s+/g, "-");
  const dotColor = STATE_DOT_COLOR[item.state] || "#a6a0a0";

  return (
    <div className="stb-card">
      <div className="stb-card-header">
        <span className={`type-badge type-${typeKey}`} title={item.work_item_type} />
        <span className="stb-card-id">{item.task_id}</span>
        <div className="stb-card-actions">
          <button
            className="stb-card-menu-btn"
            title="More actions"
            onClick={() => setMenuOpen(m => !m)}
          >⋯</button>
          {menuOpen && (
            <div className="stb-card-menu" onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={() => { onEdit && onEdit(item); setMenuOpen(false); }}>
                ✏️ Edit
              </button>
              {states.map(s => s !== item.state && (
                <button key={s} onClick={() => { onStateChange && onStateChange(item.task_id, s); setMenuOpen(false); }}>
                  → {s}
                </button>
              ))}
              <button
                className="stb-card-menu-danger"
                onClick={() => {
                  if (window.confirm(`Delete ${item.task_id}?`)) {
                    onDelete && onDelete(item.task_id);
                  }
                  setMenuOpen(false);
                }}
              >
                🗑 Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="stb-card-title" onClick={() => onEdit && onEdit(item)}>
        {item.title || "(No title)"}
      </div>
      <div className="stb-card-footer">
        <span className="stb-state-dot" style={{ background: dotColor }} title={item.state} />
        <span className="stb-card-state-lbl">{item.state}</span>
        {item.story_points != null && (
          <span className="stb-sp-badge">{item.story_points}</span>
        )}
        <PriDot priority={item.priority || 3} />
        {item.assigned_to ? (
          <span className="stb-card-assignee" title={item.assigned_to}>
            <Avatar name={item.assigned_to} />
            <span className="stb-card-assignee-name">{item.assigned_to.split(" ")[0]}</span>
          </span>
        ) : (
          <span className="stb-card-unassigned" title="Unassigned">—</span>
        )}
      </div>
    </div>
  );
}

/* ── Main Taskboard ─────────────────────────────────────────────────── */
export default function SprintTaskboard({
  workItems,
  sprint,
  personFilter,
  keywordFilter,
  typeFilters,
  stateFilters,
  onStateChange,
  onEdit,
  onDelete,
  onNewItem,
}) {
  const config = useConfig();
  const states = config.work_item_states || ["New", "Active", "Resolved", "Closed"];
  const [collapsed, setCollapsed] = useState({});
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Filter items for this sprint
  const sprintItems = useMemo(() => {
    let items = workItems;
    if (sprint && sprint !== "All") {
      items = items.filter(w => String(w.sprint) === String(sprint));
    }
    if (personFilter && personFilter !== "All") {
      items = items.filter(w => w.assigned_to === personFilter);
    }
    if (keywordFilter) {
      const kw = keywordFilter.toLowerCase();
      items = items.filter(w =>
        (w.title || "").toLowerCase().includes(kw) ||
        String(w.task_id).toLowerCase().includes(kw)
      );
    }
    if (typeFilters && typeFilters.length > 0) {
      items = items.filter(w => typeFilters.includes(w.work_item_type));
    }
    if (stateFilters && stateFilters.length > 0) {
      items = items.filter(w => stateFilters.includes(w.state));
    }
    return items;
  }, [workItems, sprint, personFilter, keywordFilter, typeFilters, stateFilters]);

  // Build parent → children map
  const { groups } = useMemo(() => {
    const byId = Object.fromEntries(sprintItems.map(i => [i.task_id, i]));
    const childMap = {};
    const parentIds = new Set();
    const childIds  = new Set();

    sprintItems.forEach(item => {
      const pid = item.parent_task_id;
      if (pid && byId[pid]) {
        if (!childMap[pid]) childMap[pid] = [];
        childMap[pid].push(item);
        parentIds.add(pid);
        childIds.add(item.task_id);
      }
    });

    // Parents with children visible on this sprint
    const parentItems = sprintItems.filter(i => parentIds.has(i.task_id));

    // Orphans: items that have no parent in current sprint view
    const orphans = sprintItems.filter(i =>
      !parentIds.has(i.task_id) && !childIds.has(i.task_id)
    );
    // Also items whose parent isn't in sprint but they are
    const orphan2 = sprintItems.filter(i => {
      const pid = i.parent_task_id;
      return pid && !byId[pid] && !childIds.has(i.task_id);
    });

    const allOrphans = [...orphans, ...orphan2];
    const groups = [];

    parentItems.forEach(p => {
      groups.push({ parent: p, children: childMap[p.task_id] || [] });
    });

    if (allOrphans.length > 0) {
      groups.push({ parent: null, children: allOrphans });
    }

    return { groups };
  }, [sprintItems]);

  const toggleCollapse = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const next = !allCollapsed;
    setAllCollapsed(next);
    const newCollapsed = {};
    groups.forEach(g => {
      const key = g.parent ? g.parent.task_id : "__unparented__";
      newCollapsed[key] = next;
    });
    setCollapsed(newCollapsed);
  };

  const isGroupCollapsed = (key) => collapsed[key] ?? false;

  if (groups.length === 0) {
    return (
      <div className="stb-empty">
        <div className="stb-empty-icon">📋</div>
        <div className="stb-empty-text">No work items for this sprint.</div>
        <div className="stb-empty-sub">
          Assign work items to this sprint or adjust filters.
        </div>
        <button className="btn btn-primary" onClick={() => onNewItem && onNewItem()}>
          + New Work Item
        </button>
      </div>
    );
  }

  return (
    <div className="stb-outer">
      <div className="stb-matrix-wrap">
        {/* ── Column Headers ── */}
        <div className="stb-row stb-header-row">
          <div className="stb-parent-col stb-header-cell stb-collapse-header">
            <button className="stb-collapse-all-btn" onClick={toggleAll}>
              {allCollapsed ? "▸" : "▾"} {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          </div>
          {states.map(s => (
            <div key={s} className="stb-state-col stb-header-cell stb-state-header">
              {s}
            </div>
          ))}
        </div>

        {/* ── Groups ── */}
        {groups.map((group, gi) => {
          const key = group.parent ? group.parent.task_id : "__unparented__";
          const isCollapsed = isGroupCollapsed(key);
          const parentTypeKey = group.parent
            ? (group.parent.work_item_type || "Task").replace(/\s+/g, "-")
            : null;

          // Cells: for each state, get children in that state
          const cellItems = states.map(s =>
            group.children.filter(c => (c.state || "New") === s)
          );

          return (
            <div key={key} className={`stb-group ${gi % 2 === 1 ? "stb-group--alt" : ""}`}>
              {/* Parent header row */}
              <div className="stb-row stb-group-header-row">
                <div className="stb-parent-col stb-group-header-cell">
                  <div className="stb-parent-info">
                    <button
                      className="stb-expand-btn"
                      onClick={() => toggleCollapse(key)}
                    >
                      {isCollapsed ? "▸" : "▾"}
                    </button>
                    {group.parent ? (
                      <>
                        <span className={`type-badge type-${parentTypeKey}`} title={group.parent.work_item_type} />
                        <span className="stb-parent-id">{group.parent.task_id}</span>
                        <span className="stb-parent-title" title={group.parent.title}>
                          {group.parent.title || "(No title)"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="stb-unparented-icon">▪</span>
                        <span className="stb-parent-title stb-parent-title--unparented">
                          Unparented
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {/* State count badges in header */}
                {states.map((s, si) => {
                  const count = cellItems[si].length;
                  return (
                    <div key={s} className="stb-state-col stb-group-count-cell">
                      {count > 0 && (
                        <span className="stb-count-badge">{count}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cards row */}
              {!isCollapsed && (
                <div className="stb-row stb-cards-row">
                  <div className="stb-parent-col stb-cards-parent-cell" />
                  {states.map((s, si) => (
                    <div
                      key={s}
                      className="stb-state-col stb-cards-cell"
                      onDoubleClick={() => onNewItem && onNewItem({ state: s, parent_task_id: group.parent?.task_id })}
                      title="Double-click to add item here"
                    >
                      {cellItems[si].map(item => (
                        <TaskCard
                          key={item.task_id}
                          item={item}
                          states={states}
                          onStateChange={onStateChange}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                      {cellItems[si].length === 0 && (
                        <div className="stb-cell-empty" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
