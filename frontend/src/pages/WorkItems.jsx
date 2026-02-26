import React, { useMemo, useState } from "react";
import { TypeBadge, StatePill, PriDot, Avatar } from "../components/WorkItemModal.jsx";
import { useConfig } from "../hooks/useConfig.js";

export default function WorkItems({ workItems, onStateChange, onDelete, onNewItem, onEdit }) {
  const config = useConfig();
  // Build priority label map from dynamic config
  const priorityLabels = useMemo(
    () => Object.fromEntries(config.priorities.map((p) => [
      p.value,
      (p.label.split("–")[1] ?? p.label).trim()
    ])),
    [config.priorities]
  );
  const [typeFilter, setTypeFilter]   = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [search, setSearch]           = useState("");

  const filtered = useMemo(() => {
    let list = workItems;
    if (typeFilter)  list = list.filter((w) => w.work_item_type === typeFilter);
    if (stateFilter) list = list.filter((w) => (w.state || "New") === stateFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          (w.title || "").toLowerCase().includes(q) ||
          (w.task_id || "").toLowerCase().includes(q) ||
          (w.assigned_to || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [workItems, typeFilter, stateFilter, search]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📋 Work Items</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => onNewItem()}>+ New Item</button>
        </div>
      </div>

      <div className="page-body">
        {/* Toolbar */}
        <div className="wi-toolbar">
          <input
            className="wi-search"
            placeholder="🔍  Search title / ID / assignee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="wi-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {config.work_item_types.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="wi-filter" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">All States</option>
            {config.work_item_states.map((s) => <option key={s}>{s}</option>)}
          </select>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#605e5c" }}>
            {filtered.length} item(s)
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No work items match your filters</div>
            <div className="empty-state-hint">Try clearing filters or create a new item.</div>
          </div>
        ) : (
          <div className="wi-table-wrap">
            <table className="wi-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>ID</th>
                  <th>Title</th>
                  <th>State</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Story Pts</th>
                  <th>Sprint</th>
                  <th>Parent</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.task_id}>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <TypeBadge type={item.work_item_type} />
                        <span style={{ fontSize: 12, color: "#605e5c" }}>{item.work_item_type || "Task"}</span>
                      </span>
                    </td>
                    <td><span className="wi-id">{item.task_id}</span></td>
                    <td style={{ maxWidth: 300 }}>
                      <div className="wi-title-cell">
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title || "(No title)"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <select
                        className="wi-filter"
                        style={{ padding: "2px 6px", fontSize: 12 }}
                        value={item.state || "New"}
                        onChange={(e) => onStateChange(item.task_id, e.target.value)}
                      >
                        {config.work_item_states.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <PriDot priority={item.priority || 3} />
                        <span style={{ fontSize: 12 }}>{priorityLabels[item.priority] || "Medium"}</span>
                      </span>
                    </td>
                    <td>
                      {item.assigned_to ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <Avatar name={item.assigned_to} />
                          <span style={{ fontSize: 12 }}>{item.assigned_to}</span>
                        </span>
                      ) : (
                        <span style={{ color: "#a19f9d", fontSize: 12 }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontSize: 13 }}>
                      {item.story_points ?? "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "#605e5c" }}>{item.sprint || "—"}</td>
                    <td>
                      {item.parent_task_id ? (
                        <span className="wi-id">{item.parent_task_id}</span>
                      ) : (
                        <span style={{ color: "#a19f9d", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ display: "flex", gap: 4 }}>
                      <button
                        className="btn-icon"
                        title="Edit"
                        onClick={() => onEdit(item)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        title="Delete"
                        onClick={() => {
                          if (window.confirm(`Delete ${item.task_id}?`)) onDelete(item.task_id);
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
