import React, { useState } from "react";
import KanbanBoard          from "../components/KanbanBoard.jsx";
import BoardAnalytics       from "../components/BoardAnalytics.jsx";
import EpicFeatureTimeline  from "../components/EpicFeatureTimeline.jsx";
import FeatureTimeline      from "../components/FeatureTimeline.jsx";
import EpicRoadmap          from "../components/EpicRoadmap.jsx";

const TABS = [
  { key: "board",             label: "Board" },
  { key: "analytics",         label: "Analytics" },
  { key: "epic-feature",      label: "Epic/Feature Timeline" },
  { key: "feature-timeline",  label: "Feature Timeline" },
  { key: "epic-roadmap",      label: "Epic Roadmap" },
];

const ITEM_TYPE_OPTIONS = ["Stories", "Bugs", "Tasks", "Features", "Epics"];

export default function Boards({ workItems, onStateChange, onDelete, onNewItem, onEdit }) {
  const [activeTab,   setActiveTab]   = useState("board");
  const [typeFilter,  setTypeFilter]  = useState("Stories");
  const [showDropdown, setShowDropdown] = useState(false);

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
