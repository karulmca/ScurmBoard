import React, { useMemo, useState } from "react";

function TaskTable({ tasks, onUpdate, onFetchUpdates }) {
  const [drafts, setDrafts] = useState({});
  const [activeTask, setActiveTask] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    update_date: "",
    current_status: "",
    current_update: "",
    state: "",
    sub_state: ""
  });

  const rows = useMemo(() => tasks || [], [tasks]);

  const setDraft = (taskId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
  };

  const handleSave = async (taskId) => {
    const payload = drafts[taskId];
    if (!payload) return;
    await onUpdate(taskId, payload);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const openDailyUpdate = async (task) => {
    setActiveTask(task);
    let latest = null;

    if (onFetchUpdates) {
      setLoadingUpdates(true);
      try {
        const data = await onFetchUpdates(task.task_id);
        setUpdates(data || []);
        latest = data && data.length ? data[0] : null;
      } finally {
        setLoadingUpdates(false);
      }
    }

    setUpdateForm({
      update_date: new Date().toISOString().slice(0, 10),
      current_status: latest?.current_status || task.current_status || "",
      current_update: latest?.current_update || task.current_update || "",
      state: latest?.state || task.state || "",
      sub_state: latest?.sub_state || task.sub_state || ""
    });
  };

  const closeDailyUpdate = () => {
    setActiveTask(null);
    setUpdates([]);
  };

  const submitDailyUpdate = async (event) => {
    event.preventDefault();
    if (!activeTask) return;
    await onUpdate(activeTask.task_id, updateForm);
    if (onFetchUpdates) {
      const data = await onFetchUpdates(activeTask.task_id);
      setUpdates(data || []);
    }
    closeDailyUpdate();
  };

  return (
    <div className="card">
      <h2>ADO Work Items</h2>
      <div className="table-wrapper">
        <table className="task-table">
          <thead>
            <tr>
              <th>TaskID</th>
              <th>Title</th>
              <th>AssignedTo</th>
              <th>State</th>
              <th>Sub-State</th>
              <th>Current Status</th>
              <th>Daily Updates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <tr key={task.task_id}>
                <td>{task.task_id}</td>
                <td>{task.title}</td>
                <td>{task.assigned_to}</td>
                <td>
                  <input
                    type="text"
                    defaultValue={task.state || ""}
                    onChange={(e) => setDraft(task.task_id, "state", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    defaultValue={task.sub_state || ""}
                    onChange={(e) => setDraft(task.task_id, "sub_state", e.target.value)}
                  />
                </td>
                <td>
                  {task.current_status || "—"}
                </td>
                <td>
                  <button
                    type="button"
                    className="icon-button"
                    title="View daily updates"
                    onClick={() => openDailyUpdate(task)}
                  >
                    🗒️
                  </button>
                </td>
                <td>
                  <button type="button" className="primary" onClick={() => handleSave(task.task_id)}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8}>No work items found. Import a dump first.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {activeTask && (
        <div className="modal-backdrop" onClick={closeDailyUpdate}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Daily Update for {activeTask.task_id}</h3>
            <div className="update-history">
              <h4>History</h4>
              {loadingUpdates && <p>Loading updates...</p>}
              {!loadingUpdates && !updates.length && <p>No updates yet.</p>}
              {!loadingUpdates && updates.length > 0 && (
                <ul>
                  {updates.map((item) => (
                    <li key={item.id}>
                      <strong>{item.update_date}</strong> — {item.current_status || ""}
                      <div className="muted">{item.current_update || ""}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form className="modal-form" onSubmit={submitDailyUpdate}>
              <label>
                Update Date
                <input
                  type="date"
                  value={updateForm.update_date}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({ ...prev, update_date: event.target.value }))
                  }
                />
              </label>
              <label>
                State
                <input
                  type="text"
                  value={updateForm.state}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({ ...prev, state: event.target.value }))
                  }
                />
              </label>
              <label>
                Sub-State
                <input
                  type="text"
                  value={updateForm.sub_state}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({ ...prev, sub_state: event.target.value }))
                  }
                />
              </label>
              <label>
                Current Status
                <input
                  type="text"
                  value={updateForm.current_status}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({ ...prev, current_status: event.target.value }))
                  }
                />
              </label>
              <label>
                Daily Update
                <textarea
                  rows={4}
                  value={updateForm.current_update}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({ ...prev, current_update: event.target.value }))
                  }
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={closeDailyUpdate}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Save Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskTable;
