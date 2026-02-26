import React, { useMemo, useState } from "react";
import SprintTaskboard from "../components/SprintTaskboard.jsx";
import SprintCapacity  from "../components/SprintCapacity.jsx";
import SprintBurndown  from "../components/SprintBurndown.jsx";
import { Avatar }      from "../components/WorkItemModal.jsx";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Tooltip, Legend, ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, ArcElement);

const TABS = [
  { key: "taskboard", label: "Taskboard" },
  { key: "backlog",   label: "Backlog"   },
  { key: "capacity",  label: "Capacity"  },
  { key: "analytics", label: "Analytics" },
  { key: "dropplan",  label: "Drop Plan" },
  { key: "goal",      label: "Goal"      },
];

/* ── Sprint Analytics sub-view ───────────────────────────────────────── */
function SprintAnalytics({ workItems, sprint }) {
  const items = useMemo(() =>
    sprint && sprint !== "All"
      ? workItems.filter(w => String(w.sprint) === String(sprint))
      : workItems,
  [workItems, sprint]);

  const stateCounts = useMemo(() => {
    const map = {};
    items.forEach(w => { map[w.state || "New"] = (map[w.state || "New"] || 0) + 1; });
    return map;
  }, [items]);

  const typeCounts = useMemo(() => {
    const map = {};
    items.forEach(w => { map[w.work_item_type || "Task"] = (map[w.work_item_type || "Task"] || 0) + 1; });
    return map;
  }, [items]);

  const stateData = {
    labels: Object.keys(stateCounts),
    datasets: [{
      data: Object.values(stateCounts),
      backgroundColor: ["#a6a0a0","#0078d4","#107c10","#ca5010","#cc293d","#323130"],
    }],
  };
  const typeData = {
    labels: Object.keys(typeCounts),
    datasets: [{
      label: "Work Items",
      data: Object.values(typeCounts),
      backgroundColor: ["#5c2d91","#773b93","#009ccc","#d9a800","#cc293d"],
      borderRadius: 3,
    }],
  };
  const totalPoints = items.reduce((s, w) => s + (Number(w.story_points) || 0), 0);
  const donePoints  = items.filter(w => w.state === "Closed" || w.state === "Resolved")
                          .reduce((s, w) => s + (Number(w.story_points) || 0), 0);
  const pct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  return (
    <div className="sprint-analytics-page">
      <div className="sprint-analytics-stats">
        <div className="sprint-stat-card">
          <div className="sprint-stat-label">Total Items</div>
          <div className="sprint-stat-value">{items.length}</div>
        </div>
        <div className="sprint-stat-card">
          <div className="sprint-stat-label">Story Points</div>
          <div className="sprint-stat-value">{totalPoints}</div>
        </div>
        <div className="sprint-stat-card">
          <div className="sprint-stat-label">Points Done</div>
          <div className="sprint-stat-value" style={{ color: "#107c10" }}>{donePoints}</div>
        </div>
        <div className="sprint-stat-card">
          <div className="sprint-stat-label">Completion</div>
          <div className="sprint-stat-value" style={{ color: pct >= 80 ? "#107c10" : pct >= 50 ? "#ca5010" : "#cc293d" }}>
            {pct}%
          </div>
        </div>
      </div>

      <div className="sprint-analytics-charts">
        <div className="sprint-chart-card">
          <div className="sprint-chart-title">By State</div>
          <Doughnut data={stateData} options={{ plugins: { legend: { position: "right" } } }} />
        </div>
        <div className="sprint-chart-card">
          <div className="sprint-chart-title">By Type</div>
          <Bar data={typeData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="sprint-chart-card">
          <div className="sprint-chart-title">Burndown</div>
          <div style={{ height: 200 }}>
            <SprintBurndown workItems={workItems} sprint={sprint} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Drop Plan sub-view ──────────────────────────────────────────────── */
function DropPlan({ workItems, sprint, onEdit }) {
  const items = useMemo(() =>
    sprint && sprint !== "All"
      ? workItems.filter(w => String(w.sprint) === String(sprint))
      : workItems,
  [workItems, sprint]);

  const atRisk = items.filter(w =>
    w.priority === 1 || w.state === "New"
  );

  if (items.length === 0) {
    return <div className="sprint-tab-empty">No items in this sprint.</div>;
  }

  return (
    <div className="drop-plan-container">
      <div className="drop-plan-info">
        <span className="drop-plan-info-icon">ℹ️</span>
        Items below are candidates for removal from this sprint (high priority items still
        in New state, or items with no story points). Review and decide what stays.
      </div>
      {atRisk.length === 0 ? (
        <div className="sprint-tab-empty" style={{ marginTop: 24 }}>
          🎉 No at-risk items detected for this sprint.
        </div>
      ) : (
        <table className="drop-plan-table">
          <thead>
            <tr>
              <th>Work Item</th>
              <th>Type</th>
              <th>State</th>
              <th>Priority</th>
              <th>Story Pts</th>
              <th>Assigned To</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {atRisk.map(item => (
              <tr key={item.task_id} className="drop-plan-row" onClick={() => onEdit && onEdit(item)}>
                <td>
                  <span className="drop-plan-id">{item.task_id}</span>
                  <span className="drop-plan-title">{item.title}</span>
                </td>
                <td><span className="drop-plan-type">{item.work_item_type}</span></td>
                <td><span className={`drop-plan-state state-dot-${item.state}`}>{item.state || "New"}</span></td>
                <td>{item.priority || "—"}</td>
                <td>{item.story_points != null ? item.story_points : <span style={{ color: "#cc293d" }}>Missing</span>}</td>
                <td>
                  {item.assigned_to ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Avatar name={item.assigned_to} />
                      {item.assigned_to.split(" ")[0]}
                    </span>
                  ) : (
                    <span style={{ color: "#a19f9d" }}>Unassigned</span>
                  )}
                </td>
                <td>
                  {item.priority === 1
                    ? <span className="risk-badge risk-badge--high">High Priority / Not Started</span>
                    : item.story_points == null
                    ? <span className="risk-badge risk-badge--med">No Estimate</span>
                    : <span className="risk-badge risk-badge--low">Not Started</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Sprint Goal sub-view ────────────────────────────────────────────── */
function SprintGoal({ sprint }) {
  const [goal, setGoal] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="sprint-goal-container">
      <h3 className="sprint-goal-title">Sprint Goal</h3>
      {sprint && sprint !== "All" && (
        <div className="sprint-goal-sprint-label">Sprint: {sprint}</div>
      )}
      {!editing ? (
        <div className="sprint-goal-display">
          {goal ? (
            <blockquote className="sprint-goal-text">{goal}</blockquote>
          ) : (
            <div className="sprint-goal-empty">
              No sprint goal has been set yet.
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>
            {goal ? "✏️ Edit Goal" : "+ Set Sprint Goal"}
          </button>
          {saved && <span className="sprint-goal-saved">✅ Saved!</span>}
        </div>
      ) : (
        <div className="sprint-goal-edit">
          <textarea
            className="sprint-goal-textarea"
            value={goal}
            placeholder="Describe the goal for this sprint..."
            onChange={e => setGoal(e.target.value)}
            autoFocus
            rows={5}
          />
          <div className="sprint-goal-edit-btns">
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sprint Backlog sub-view ─────────────────────────────────────────── */
function SprintBacklog({ workItems, sprint, onEdit, onNewItem, onDelete }) {
  const items = useMemo(() =>
    sprint && sprint !== "All"
      ? workItems.filter(w => String(w.sprint) === String(sprint))
      : workItems,
  [workItems, sprint]);

  return (
    <div className="sprint-backlog-container">
      <div className="sprint-backlog-toolbar">
        <span className="sprint-backlog-count">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
        <button className="btn btn-primary btn-sm" onClick={() => onNewItem && onNewItem()}>
          + New Work Item
        </button>
      </div>
      {items.length === 0 ? (
        <div className="sprint-tab-empty">No items in this sprint.</div>
      ) : (
        <table className="sprint-backlog-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>State</th>
              <th>Priority</th>
              <th>Points</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const typeKey = (item.work_item_type || "Task").replace(/\s+/g, "-");
              return (
                <tr
                  key={item.task_id}
                  className="sprint-backlog-row"
                  onClick={() => onEdit && onEdit(item)}
                >
                  <td>
                    <span className={`type-badge type-${typeKey}`} />
                  </td>
                  <td className="sprint-backlog-id">{item.task_id}</td>
                  <td className="sprint-backlog-title">{item.title}</td>
                  <td>{item.work_item_type}</td>
                  <td>
                    <span className={`state-pill state-${item.state}`}>{item.state || "New"}</span>
                  </td>
                  <td>{item.priority || "—"}</td>
                  <td>{item.story_points != null ? item.story_points : "—"}</td>
                  <td>
                    {item.assigned_to ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Avatar name={item.assigned_to} />
                        {item.assigned_to.split(" ")[0]}
                      </span>
                    ) : (
                      <span style={{ color: "#a19f9d" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Main SprintBoard Page ───────────────────────────────────────────── */
export default function SprintBoard({ workItems, onStateChange, onDelete, onNewItem, onEdit }) {
  const [activeTab, setActiveTab]     = useState("taskboard");
  const [sprint,    setSprint]        = useState("All");
  const [person,    setPerson]        = useState("All");
  const [keyword,   setKeyword]       = useState("");
  const [showTypeMenu,   setShowTypeMenu]   = useState(false);
  const [showPersonMenu, setShowPersonMenu] = useState(false);
  const [showSprintMenu, setShowSprintMenu] = useState(false);

  // Derive sprint list from work items
  const sprints = useMemo(() => {
    const set = new Set();
    workItems.forEach(w => { if (w.sprint) set.add(String(w.sprint)); });
    return ["All", ...Array.from(set).sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? 0);
      const nb = parseInt(b.match(/\d+/)?.[0] ?? 0);
      return na - nb;
    })];
  }, [workItems]);

  // Derive person list
  const persons = useMemo(() => {
    const set = new Set();
    workItems.forEach(w => { if (w.assigned_to) set.add(w.assigned_to); });
    return ["All", ...Array.from(set).sort()];
  }, [workItems]);

  // Sprint date info
  const sprintInfo = useMemo(() => {
    if (!sprint || sprint === "All") return null;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const todayWD = Math.max(0, Math.floor((now - startOfMonth) / (1000 * 60 * 60 * 24)));
    const totalWD = 20;
    const remaining = Math.max(0, totalWD - todayWD);
    return {
      label: `${startOfMonth.toLocaleString("default", { month: "long" })} ${startOfMonth.getFullYear()}`,
      start: startOfMonth,
      end: endOfMonth,
      remaining,
    };
  }, [sprint]);

  const selectedSprintLabel = sprint === "All" ? "All Sprints" : sprint;

  return (
    <div className="sprint-board-page">
      {/* ── Header ── */}
      <div className="sprint-board-header">
        <div className="sprint-board-header-left">
          <div className="sprint-board-team-icon">P</div>
          <h1 className="sprint-board-team-name">Project Board</h1>
          <button className="boards-icon-btn" title="Favourite">☆</button>
          <button className="boards-icon-btn" title="Team settings">👥</button>
        </div>
        <div className="sprint-board-header-right">
          <button className="btn btn-primary" onClick={() => onNewItem && onNewItem()}>
            + New Work Item
          </button>
          <button className="sprint-col-options-btn">
            ✏️ Column Options
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sprint-board-tab-bar">
        <nav className="sprint-board-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`sprint-board-tab ${activeTab === t.key ? "sprint-board-tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Sub-toolbar ── */}
      <div className="sprint-board-toolbar">
        <div className="sprint-board-toolbar-left">
          {/* Sprint selector */}
          <div style={{ position: "relative" }}>
            <button
              className="sprint-filter-btn"
              onClick={() => setShowSprintMenu(m => !m)}
            >
              📅 {selectedSprintLabel} <span className="boards-chevron">▾</span>
            </button>
            {showSprintMenu && (
              <div className="sprint-dropdown-menu">
                {sprints.map(s => (
                  <button
                    key={s}
                    className={`sprint-dropdown-item ${sprint === s ? "sprint-dropdown-item--active" : ""}`}
                    onClick={() => { setSprint(s); setShowSprintMenu(false); }}
                  >
                    {s === "All" ? "All Sprints" : s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Person filter */}
          <div style={{ position: "relative" }}>
            <button
              className="sprint-filter-btn"
              onClick={() => setShowPersonMenu(m => !m)}
            >
              👤 Person: {person} <span className="boards-chevron">▾</span>
            </button>
            {showPersonMenu && (
              <div className="sprint-dropdown-menu">
                {persons.map(p => (
                  <button
                    key={p}
                    className={`sprint-dropdown-item ${person === p ? "sprint-dropdown-item--active" : ""}`}
                    onClick={() => { setPerson(p); setShowPersonMenu(false); }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sprint info + mini burndown (right side) */}
        {sprintInfo && activeTab === "taskboard" && (
          <div className="sprint-board-burndown-wrap">
            <div className="sprint-board-burndown-info">
              <span className="sprint-date-range">
                {sprintInfo.start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} –{" "}
                {sprintInfo.end.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </span>
              <span className="sprint-days-remaining">
                {sprintInfo.remaining} work days remaining
              </span>
            </div>
            <div className="sprint-burndown-mini">
              <SprintBurndown
                workItems={workItems}
                sprint={sprint}
                startDate={sprintInfo.start}
                endDate={sprintInfo.end}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Keyword + advanced filters (Taskboard only) ── */}
      {activeTab === "taskboard" && (
        <div className="sprint-filter-bar">
          <span className="sprint-filter-bar-icon">☰</span>
          <input
            className="sprint-keyword-input"
            placeholder="Filter by keyword"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          {keyword && (
            <button className="sprint-filter-clear" onClick={() => setKeyword("")}>✕</button>
          )}
          <div className="sprint-filter-bar-sep" />
          {["Types", "States", "Tags", "Area", "Parent Work Item"].map(f => (
            <button key={f} className="sprint-filter-chip">
              {f} <span className="boards-chevron">▾</span>
            </button>
          ))}
          {(keyword || person !== "All") && (
            <button
              className="sprint-filter-reset"
              onClick={() => { setKeyword(""); setPerson("All"); }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Tab Content ── */}
      <div className="sprint-board-content">
        {activeTab === "taskboard" && (
          <SprintTaskboard
            workItems={workItems}
            sprint={sprint}
            personFilter={person}
            keywordFilter={keyword}
            onStateChange={onStateChange}
            onEdit={onEdit}
            onDelete={onDelete}
            onNewItem={onNewItem}
          />
        )}

        {activeTab === "backlog" && (
          <SprintBacklog
            workItems={workItems}
            sprint={sprint}
            onEdit={onEdit}
            onNewItem={onNewItem}
            onDelete={onDelete}
          />
        )}

        {activeTab === "capacity" && (
          <SprintCapacity
            workItems={workItems}
            sprint={sprint}
          />
        )}

        {activeTab === "analytics" && (
          <SprintAnalytics
            workItems={workItems}
            sprint={sprint}
          />
        )}

        {activeTab === "dropplan" && (
          <DropPlan
            workItems={workItems}
            sprint={sprint}
            onEdit={onEdit}
          />
        )}

        {activeTab === "goal" && (
          <SprintGoal sprint={sprint} />
        )}
      </div>
    </div>
  );
}
