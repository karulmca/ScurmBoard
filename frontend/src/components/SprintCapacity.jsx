import React, { useMemo, useState } from "react";
import { Avatar } from "./WorkItemModal.jsx";

/**
 * SprintCapacity
 * Shows team member workload vs capacity for the selected sprint.
 */
export default function SprintCapacity({ workItems, sprint }) {
  const [capacities, setCapacities] = useState({});

  const sprintItems = useMemo(() => {
    if (!sprint || sprint === "All") return workItems;
    return workItems.filter(w => String(w.sprint) === String(sprint));
  }, [workItems, sprint]);

  // Derive unique assignees
  const members = useMemo(() => {
    const seen = new Set();
    const list = [];
    sprintItems.forEach(w => {
      const name = w.assigned_to || "Unassigned";
      if (!seen.has(name)) {
        seen.add(name);
        list.push(name);
      }
    });
    return list;
  }, [sprintItems]);

  // Workload per person
  const workload = useMemo(() => {
    const map = {};
    sprintItems.forEach(w => {
      const name = w.assigned_to || "Unassigned";
      if (!map[name]) map[name] = { items: 0, points: 0, completed: 0 };
      map[name].items++;
      map[name].points += Number(w.story_points) || 0;
      if (w.state === "Closed" || w.state === "Resolved") map[name].completed++;
    });
    return map;
  }, [sprintItems]);

  const setCapacity = (name, val) => {
    setCapacities(prev => ({ ...prev, [name]: Number(val) || 0 }));
  };

  const totalCapacity = Object.values(capacities).reduce((a, b) => a + b, 0);
  const totalPoints   = Object.values(workload).reduce((a, b) => a + b.points, 0);
  const pctUsed = totalCapacity > 0 ? Math.min(100, Math.round((totalPoints / totalCapacity) * 100)) : 0;

  return (
    <div className="capacity-container">
      <div className="capacity-header">
        <h3 className="capacity-title">Sprint Capacity</h3>
        <div className="capacity-summary">
          <div className="capacity-summary-item">
            <span className="capacity-summary-label">Total Capacity</span>
            <span className="capacity-summary-value">{totalCapacity} pts</span>
          </div>
          <div className="capacity-summary-item">
            <span className="capacity-summary-label">Total Workload</span>
            <span className="capacity-summary-value">{totalPoints} pts</span>
          </div>
          <div className="capacity-summary-item">
            <span className="capacity-summary-label">Utilization</span>
            <span className={`capacity-summary-value ${pctUsed > 100 ? "capacity-over" : pctUsed > 80 ? "capacity-warn" : "capacity-ok"}`}>
              {pctUsed}%
            </span>
          </div>
        </div>
      </div>

      {/* Overall bar */}
      <div className="capacity-overall-bar-wrap">
        <div className="capacity-overall-bar-track">
          <div
            className={`capacity-overall-bar ${pctUsed > 100 ? "capacity-bar--over" : pctUsed > 80 ? "capacity-bar--warn" : "capacity-bar--ok"}`}
            style={{ width: `${Math.min(100, pctUsed)}%` }}
          />
        </div>
        <span className="capacity-overall-bar-label">{pctUsed}% of capacity used</span>
      </div>

      {/* Team table */}
      <div className="capacity-table-wrap">
        <table className="capacity-table">
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Assigned Items</th>
              <th>Story Points</th>
              <th>Completed</th>
              <th>Capacity (pts)</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#605e5c", padding: "24px" }}>
                  No team members found for this sprint.
                </td>
              </tr>
            ) : (
              members.map(name => {
                const w = workload[name] || { items: 0, points: 0, completed: 0 };
                const cap = capacities[name] || 0;
                const util = cap > 0 ? Math.min(100, Math.round((w.points / cap) * 100)) : null;
                const completePct = w.items > 0 ? Math.round((w.completed / w.items) * 100) : 0;

                return (
                  <tr key={name} className="capacity-table-row">
                    <td>
                      <div className="capacity-member-cell">
                        {name !== "Unassigned" ? (
                          <Avatar name={name} />
                        ) : (
                          <span className="capacity-avatar-placeholder">?</span>
                        )}
                        <span className="capacity-member-name">{name}</span>
                      </div>
                    </td>
                    <td className="capacity-num-cell">
                      <span className="capacity-badge capacity-badge--items">{w.items}</span>
                    </td>
                    <td className="capacity-num-cell">
                      <span className="capacity-badge capacity-badge--pts">{w.points}</span>
                    </td>
                    <td className="capacity-num-cell">
                      <div className="capacity-completed-cell">
                        <div className="capacity-mini-bar">
                          <div
                            className="capacity-mini-bar-fill"
                            style={{ width: `${completePct}%` }}
                          />
                        </div>
                        <span>{w.completed}/{w.items}</span>
                      </div>
                    </td>
                    <td className="capacity-num-cell">
                      <input
                        type="number"
                        className="capacity-input"
                        value={cap || ""}
                        min={0}
                        placeholder="—"
                        onChange={e => setCapacity(name, e.target.value)}
                      />
                    </td>
                    <td className="capacity-num-cell">
                      {util !== null ? (
                        <span className={`capacity-util ${util > 100 ? "capacity-over" : util > 80 ? "capacity-warn" : "capacity-ok"}`}>
                          {util}%
                        </span>
                      ) : (
                        <span className="capacity-util-na">Set capacity</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
