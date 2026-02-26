import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import WorkItemModal from "./components/WorkItemModal.jsx";
import Boards      from "./pages/Boards.jsx";
import SprintBoard from "./pages/SprintBoard.jsx";
import Backlog      from "./pages/Backlog.jsx";
import WorkItems from "./pages/WorkItems.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Projects from "./pages/Projects.jsx";
import Settings from "./pages/Settings.jsx";
import UserSettings from "./pages/UserSettings.jsx";
import Retrospectives from "./pages/Retrospectives.jsx";
import Teams from "./pages/Teams.jsx";
import { listUsers } from "./services/api.js";
import { getWorkItems, createWorkItem, updateWorkItem, updateTaskStatus, deleteWorkItem } from "./services/api.js";

function App() {
  const [page, setPage] = useState("boards");
  const [workItems, setWorkItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaults, setModalDefaults] = useState({});
  const [currentProject, setCurrentProject] = useState(null);

  // currentUser: selected via topbar picker — drives board access control
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("scrumboard_current_user")) || null; } catch { return null; }
  });
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const loadUsers = useCallback(async () => {
    try { const u = await listUsers(); setAllUsers(u); } catch {}
  }, []);

  const handleSelectUser = (u) => {
    setCurrentUser(u);
    localStorage.setItem("scrumboard_current_user", JSON.stringify(u));
    setShowUserPicker(false);
  };

  const loadItems = useCallback(async () => {
    try {
      const data = await getWorkItems();
      setWorkItems(data);
    } catch (e) {
      console.error("Failed to load work items", e);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openCreate = (defaults = {}) => {
    setModalDefaults(defaults);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (payload.task_id) {
      // Edit mode — task_id present means update existing
      const { task_id, ...fields } = payload;
      await updateWorkItem(task_id, fields);
    } else {
      await createWorkItem(payload);
    }
    setModalOpen(false);
    setModalDefaults({});
    loadItems();
  };

  const openEdit = (item) => {
    setModalDefaults(item);
    setModalOpen(true);
  };

  const handleStateChange = async (taskId, newState) => {
    await updateTaskStatus(taskId, { state: newState });
    loadItems();
  };

  const handleDelete = async (taskId) => {
    await deleteWorkItem(taskId);
    loadItems();
  };

  const sharedProps = { workItems, onStateChange: handleStateChange, onDelete: handleDelete, onNewItem: openCreate, onEdit: openEdit, reload: loadItems };

  return (
    <div className="app-shell" onClick={() => setShowUserPicker(false)}>
      {/* ── Top bar ── */}
      <header className="topbar">
        <div className="topbar-logo">⚡</div>
        <span className="topbar-brand">ScrumBoard</span>
        <div className="topbar-sep" />
        <button
          className="topbar-project-btn"
          onClick={() => setPage("projects")}
          title="Switch project"
        >
          {currentProject ? (
            <>
              <span style={{ marginRight: 4 }}>{currentProject.icon}</span>
              {currentProject.name}
              <span className="topbar-project-key">{currentProject.key}</span>
            </>
          ) : (
            <span style={{ opacity: 0.7 }}>Select Project ▾</span>
          )}
        </button>
        <div className="topbar-spacer" />
        {/* Current User Picker */}
        <div className="topbar-user-wrap">
          <button
            className="topbar-user-btn"
            onClick={() => { setShowUserPicker(!showUserPicker); loadUsers(); }}
            title="Switch active user"
          >
            <span className="topbar-user-icon">👤</span>
            <span className="topbar-user-name">
              {currentUser ? currentUser.name : "Select User"}
            </span>
            <span style={{ marginLeft: 4, opacity: 0.6 }}>▾</span>
          </button>
          {showUserPicker && (
            <div className="user-picker-dropdown" onClick={e => e.stopPropagation()}>
              <div className="user-picker-header">Switch Active User</div>
              <button
                className={`user-picker-item ${!currentUser ? "active" : ""}`}
                onClick={() => handleSelectUser(null)}
              >
                <span className="user-picker-avatar" style={{ background: "#666" }}>?</span>
                <span>None (Guest)</span>
              </button>
              {allUsers.map(u => (
                <button
                  key={u.id}
                  className={`user-picker-item ${currentUser?.id === u.id ? "active" : ""}`}
                  onClick={() => handleSelectUser(u)}
                >
                  <span className="user-picker-avatar" style={{ background: "#0078d4" }}>
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                  <span>{u.name}</span>
                  <span className="user-picker-email">{u.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openCreate()}>+ New Item</button>
      </header>

      <div className="app-body">
        {/* ── Sidebar ── */}
        <Sidebar page={page} onNavigate={setPage} currentProject={currentProject} />

        {/* ── Main content ── */}
        <main className="main-content">
          {page === "boards"     && <Boards     {...sharedProps} currentProject={currentProject} currentUser={currentUser} />}
          {page === "sprints"    && <SprintBoard {...sharedProps} />}
          {page === "backlog"    && <Backlog    {...sharedProps} />}
          {page === "workitems"  && <WorkItems  {...sharedProps} />}
          {page === "reports"    && <Dashboard />}
          {page === "projects"   && <Projects onSelectProject={(p) => { setCurrentProject(p); }} />}
          {page === "teams"      && <Teams />}
          {page === "retrospectives" && currentProject && <Retrospectives projectId={currentProject.id} />}
          {page === "settings"   && <Settings />}
          {page === "user-settings" && <UserSettings userId={1} />}
        </main>
      </div>

      {/* ── Create / Edit modal ── */}
      {modalOpen && (
        <WorkItemModal
          initial={modalDefaults}
          workItems={workItems}
          projectId={currentProject?.id}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setModalDefaults({}); }}
        />
      )}
    </div>
  );
}

export default App;

