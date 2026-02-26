import React, { useMemo, useState } from "react";
import { TypeBadge, StatePill, Avatar } from "../components/WorkItemModal.jsx";
import { useConfig } from "../hooks/useConfig.js";

/**
 * Build a map  parent_task_id → children[]
 * Items with no parent (or unknown parent) are roots.
 */
function buildTree(items, typeOrder) {
  const byId = Object.fromEntries(items.map((i) => [i.task_id, i]));
  const childrenOf = {};
  const roots = [];

  items.forEach((item) => {
    const pid = item.parent_task_id;
    if (pid && byId[pid]) {
      (childrenOf[pid] = childrenOf[pid] || []).push(item);
    } else {
      roots.push(item);
    }
  });

  // Sort roots and children by type order then task_id
  const sort = (arr) =>
    [...arr].sort(
      (a, b) =>
        typeOrder.indexOf(a.work_item_type) - typeOrder.indexOf(b.work_item_type) ||
        (a.task_id > b.task_id ? 1 : -1)
    );

  return { roots: sort(roots), childrenOf };
}

function BacklogRow({ item, depth, childrenOf, collapsed, onToggle, onNewChild, onDelete }) {
  const children = childrenOf[item.task_id] || [];
  const isCollapsed = collapsed[item.task_id];
  const typeKey = (item.work_item_type || "Task").replace(/\s+/g, "-");

  return (
    <>
      <div className="backlog-row">
        {/* indent */}
        {Array.from({ length: depth }).map((_, i) => (
          <span key={i} className="backlog-indent" />
        ))}

        {/* expand toggle */}
        <span
          className="backlog-expand"
          onClick={() => children.length && onToggle(item.task_id)}
        >
          {children.length ? (isCollapsed ? "▶" : "▼") : ""}
        </span>

        {/* type badge */}
        <span className={`type-badge type-${typeKey}`} style={{ margin: "0 6px", flexShrink: 0 }} />

        {/* id */}
        <span className="backlog-id">{item.task_id}</span>

        {/* title */}
        <span className="backlog-title">{item.title || "(No title)"}</span>

        {/* meta columns */}
        <div className="backlog-meta">
          <span className="backlog-meta-cell">
            <StatePill state={item.state || "New"} />
          </span>
          <span className="backlog-meta-cell">
            {item.assigned_to ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Avatar name={item.assigned_to} />
                {item.assigned_to.split(" ")[0]}
              </span>
            ) : (
              <span style={{ color: "#a19f9d" }}>—</span>
            )}
          </span>
          <span className="backlog-meta-cell">
            {item.story_points != null ? `${item.story_points} pts` : "—"}
          </span>
          <span className="backlog-meta-cell">
            {item.sprint || "—"}
          </span>
          <span className="backlog-meta-cell" style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <button className="btn-icon" title="Add child" onClick={() => onNewChild(item)}>＋</button>
            <button className="btn-icon btn-danger" title="Delete" onClick={() => onDelete(item.task_id)}>🗑</button>
          </span>
        </div>
      </div>

      {/* children */}
      {!isCollapsed &&
        children.map((child) => (
          <BacklogRow
            key={child.task_id}
            item={child}
            depth={depth + 1}
            childrenOf={childrenOf}
            collapsed={collapsed}
            onToggle={onToggle}
            onNewChild={onNewChild}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}

export default function Backlog({ workItems, onDelete, onNewItem }) {
  const config = useConfig();
  const [collapsed, setCollapsed] = useState({});
  const [filter, setFilter] = useState("");

  const filtered = useMemo(
    () =>
      filter
        ? workItems.filter(
            (w) =>
              (w.title || "").toLowerCase().includes(filter.toLowerCase()) ||
              (w.task_id || "").toLowerCase().includes(filter.toLowerCase())
          )
        : workItems,
    [workItems, filter]
  );

  const { roots, childrenOf } = useMemo(
    () => buildTree(filtered, config.work_item_types),
    [filtered, config.work_item_types]
  );

  const toggle = (id) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleNewChild = (parent) =>
    onNewItem({ parent_task_id: parent.task_id });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📚 Backlog</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => onNewItem()}>+ New Item</button>
        </div>
      </div>

      <div className="page-body">
        <div className="backlog-toolbar">
          <input
            className="wi-search"
            placeholder="🔍  Filter by title or ID…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <span style={{ color: "#605e5c", fontSize: 13 }}>{filtered.length} item(s)</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No work items yet</div>
            <div className="empty-state-hint">Create your first item using "+ New Item"</div>
          </div>
        ) : (
          <div className="backlog-tree">
            {/* Column header */}
            <div className="backlog-col-header">
              <span className="backlog-expand" />
              <span style={{ width: 14, margin: "0 6px" }} />
              <span style={{ width: 80 }} />
              <span className="backlog-title" style={{ fontSize: 11, fontWeight: 700, color: "#605e5c" }}>TITLE</span>
              <div className="backlog-meta">
                <span className="backlog-meta-cell">STATE</span>
                <span className="backlog-meta-cell">ASSIGNED TO</span>
                <span className="backlog-meta-cell">POINTS</span>
                <span className="backlog-meta-cell">SPRINT</span>
                <span className="backlog-meta-cell">ACTIONS</span>
              </div>
            </div>

            {roots.map((item) => (
              <BacklogRow
                key={item.task_id}
                item={item}
                depth={0}
                childrenOf={childrenOf}
                collapsed={collapsed}
                onToggle={toggle}
                onNewChild={handleNewChild}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
