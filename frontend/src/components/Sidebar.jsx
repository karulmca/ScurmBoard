import React from "react";

const MAIN_NAV = [
  { id: "boards",    label: "Boards",     icon: "📌" },
  { id: "backlog",   label: "Backlog",    icon: "📚" },
  { id: "workitems", label: "Work Items", icon: "📋" },
  { id: "reports",   label: "Reports",    icon: "📊" },
];

const BOTTOM_NAV = [
  { id: "projects",  label: "Projects",   icon: "🗂️" },
  { id: "retrospectives", label: "Retrospectives", icon: "📝" },
  { id: "user-settings", label: "User Settings", icon: "👤" },
  { id: "settings",  label: "Settings",   icon: "⚙️" },
];

export default function Sidebar({ page, onNavigate, currentProject }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-section-title">Boards</div>
      {MAIN_NAV.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${page === item.id ? "active" : ""}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="sidebar-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}

      {currentProject && (
        <>
          <div className="sidebar-section-title" style={{ marginTop: 16 }}>Current Project</div>
          <div className="sidebar-project-badge" style={{ borderLeftColor: currentProject.color }}>
            <span>{currentProject.icon}</span>
            <span className="sidebar-project-name">{currentProject.name}</span>
            <span className="sidebar-project-key">{currentProject.key}</span>
          </div>
        </>
      )}

      <div className="sidebar-spacer" />
      <div className="sidebar-section-title">Manage</div>
      {BOTTOM_NAV.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${page === item.id ? "active" : ""}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="sidebar-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
