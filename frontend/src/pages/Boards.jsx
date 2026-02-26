import React, { useState, useEffect } from "react";
import KanbanBoard          from "../components/KanbanBoard.jsx";
import BoardAnalytics       from "../components/BoardAnalytics.jsx";
import EpicFeatureTimeline  from "../components/EpicFeatureTimeline.jsx";
import FeatureTimeline      from "../components/FeatureTimeline.jsx";
import EpicRoadmap          from "../components/EpicRoadmap.jsx";
import { checkProjectAccess, getProjectTeams } from "../services/api.js";

const TABS = [
  { key: "board",             label: "Board" },
  { key: "analytics",         label: "Analytics" },
  { key: "epic-feature",      label: "Epic/Feature Timeline" },
  { key: "feature-timeline",  label: "Feature Timeline" },
  { key: "epic-roadmap",      label: "Epic Roadmap" },
];

const ITEM_TYPE_OPTIONS = ["Stories", "Bugs", "Tasks", "Features", "Epics"];

export default function Boards({ workItems, onStateChange, onDelete, onNewItem, onEdit, currentProject, currentUser }) {
  const [activeTab,   setActiveTab]   = useState("board");
  const [typeFilter,  setTypeFilter]  = useState("Stories");
  const [showDropdown, setShowDropdown] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessChecking, setAccessChecking] = useState(false);
  const [projectHasTeams, setProjectHasTeams] = useState(false);

  // ── Access control: check if current user can view this project's board ──
  useEffect(() => {
    if (!currentProject) { setAccessDenied(false); return; }
    // First check if the project has any teams assigned
    getProjectTeams(currentProject.id)
      .then((teams) => {
        setProjectHasTeams(teams.length > 0);
        if (teams.length === 0) {
          // No teams assigned → open access
          setAccessDenied(false);
          return;
        }
        if (!currentUser) {
          // Teams exist but no user selected → deny
          setAccessDenied(true);
          return;
        }
        // Check if the user belongs to a team mapped to this project
        return checkProjectAccess(currentProject.id, currentUser.id)
          .then((result) => setAccessDenied(!result.allowed));
      })
      .catch(() => setAccessDenied(false));
  }, [currentProject?.id, currentUser?.id]); // eslint-disable-line

  // Filter work items by current type selection for board tab
  const typeMap = {
    Stories:  "Story",
    Bugs:     "Bug",
    Tasks:    "Task",
    Features: "Feature",
    Epics:    "Epic",
  };
  const boardItems = workItems.filter(w =>
    !typeMap[typeFilter] || w.work_item_type === typeMap[typeFilter]
  );

  // ── Access Denied gate ──────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="boards-access-denied">
        <div className="access-denied-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>
          {currentProject
            ? `The board for "${currentProject.name}" is restricted to team members only.`
            : "This board is restricted to team members only."}
        </p>
        {!currentUser && (
          <p className="access-denied-hint">
            Select your user from the top-right dropdown to check your access.
          </p>
        )}
        {currentUser && (
          <p className="access-denied-hint">
            You (<strong>{currentUser.name}</strong>) are not a member of any team assigned to this project.
            Contact your admin or go to <strong>Teams</strong> to request access.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="boards-page">
      {/* ── ADO-style Board Header ── */}
      <div className="boards-header">
        <div className="boards-header-left">
          <div className="boards-team-icon">P</div>
          <h1 className="boards-team-name">Project Board</h1>
          <button className="boards-icon-btn" title="Favourite">☆</button>
          <button className="boards-icon-btn" title="Team settings">👥</button>
        </div>
        <div className="boards-header-right">
          <button className="boards-backlog-btn" onClick={() => {}}>
            <span className="boards-backlog-icon">⊞</span>
            View as backlog
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="boards-tab-bar">
        <nav className="boards-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`boards-tab ${activeTab === t.key ? "boards-tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right controls — only on Board tab */}
        {activeTab === "board" && (
          <div className="boards-tab-controls">
            <div className="boards-type-dropdown" style={{ position: "relative" }}>
              <button
                className="boards-type-btn"
                onClick={() => setShowDropdown(d => !d)}
              >
                {typeFilter} <span className="boards-chevron">▾</span>
              </button>
              {showDropdown && (
                <div className="boards-type-menu">
                  {ITEM_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`boards-type-option ${typeFilter === opt ? "boards-type-option--active" : ""}`}
                      onClick={() => { setTypeFilter(opt); setShowDropdown(false); }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="boards-icon-btn boards-expand-btn" title="Full screen">⤢</button>
          </div>
        )}
      </div>

      {/* ── Tab Content ── */}
      <div className="boards-content">
        {activeTab === "board" && (
          <KanbanBoard
            workItems={boardItems}
            onStateChange={onStateChange}
            onNewItem={onNewItem}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}

        {activeTab === "analytics" && (
          <BoardAnalytics workItems={workItems} />
        )}

        {activeTab === "epic-feature" && (
          <EpicFeatureTimeline workItems={workItems} types={["Epic", "Feature"]} />
        )}

        {activeTab === "feature-timeline" && (
          <FeatureTimeline workItems={workItems} />
        )}

        {activeTab === "epic-roadmap" && (
          <EpicRoadmap workItems={workItems} />
        )}
      </div>
    </div>
  );
}
