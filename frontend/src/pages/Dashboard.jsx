import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";

import UploadCard from "../components/UploadCard.jsx";
import TaskTable from "../components/TaskTable.jsx";
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getTasks,
  uploadAdoDump,
  getTaskUpdates,
  updateTaskStatus
} from "../services/api.js";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const tabs = ["Daily", "Weekly", "Monthly"];

function Dashboard() {
  const [activeTab, setActiveTab] = useState("Daily");
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    getDailyReport().then(setDaily).catch(() => setDaily(null));
    getWeeklyReport().then(setWeekly).catch(() => setWeekly(null));
    getMonthlyReport().then(setMonthly).catch(() => setMonthly(null));
    getTasks().then(setTasks).catch(() => setTasks([]));
  }, []);

  const refreshReports = () => {
    getDailyReport().then(setDaily).catch(() => setDaily(null));
    getWeeklyReport().then(setWeekly).catch(() => setWeekly(null));
    getMonthlyReport().then(setMonthly).catch(() => setMonthly(null));
    getTasks().then(setTasks).catch(() => setTasks([]));
  };

  const handleUpload = async (file) => {
    await uploadAdoDump(file);
    refreshReports();
  };

  const handleTaskUpdate = async (taskId, payload) => {
    await updateTaskStatus(taskId, payload);
    refreshReports();
  };

  const handleFetchUpdates = async (taskId) => getTaskUpdates(taskId);

  const statusPie = useMemo(() => {
    if (!daily?.status_distribution) return null;
    const labels = Object.keys(daily.status_distribution);
    const data = Object.values(daily.status_distribution);
    return {
      labels,
      datasets: [
        {
          label: "Status",
          data,
          backgroundColor: ["#4CAF50", "#FF9800", "#F44336", "#2196F3", "#9C27B0"]
        }
      ]
    };
  }, [daily]);

  const velocityChart = useMemo(() => {
    if (!weekly?.velocity) return null;
    return {
      labels: ["Committed", "Completed"],
      datasets: [
        {
          label: "Velocity",
          data: [weekly.velocity.committed, weekly.velocity.completed],
          backgroundColor: ["#2196F3", "#4CAF50"]
        }
      ]
    };
  }, [weekly]);

  const cycleTimeTrend = useMemo(() => {
    if (!monthly?.cycle_time_trend) return null;
    const labels = monthly.cycle_time_trend.map((item) => item.activated_date || "Unknown");
    const data = monthly.cycle_time_trend.map((item) => item.cycle_time || 0);
    return {
      labels,
      datasets: [
        {
          label: "Cycle Time",
          data,
          borderColor: "#673AB7",
          backgroundColor: "rgba(103, 58, 183, 0.2)"
        }
      ]
    };
  }, [monthly]);

  return (
    <div className="reports-page">
      <div className="page-header" style={{ marginBottom: 0, background: "transparent", border: "none", padding: 0 }}>
        <div>
          <h1 className="page-title">📊 Reports</h1>
          <p style={{ color: "#605e5c", fontSize: 13, marginTop: 4 }}>Daily, weekly, and monthly insights.</p>
        </div>
      </div>

      <div className="report-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`report-tab ${tab === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Daily" && (
        <div className="report-grid">
          <UploadCard onUpload={handleUpload} />
          <div className="report-card">
            <h2>Status Distribution</h2>
            {statusPie ? <Pie data={statusPie} /> : <p>No data</p>}
          </div>
          <div className="report-card">
            <h2>Activated vs Closed Today</h2>
            <p>Activated: {daily?.activated_today?.length || 0}</p>
            <p>Closed: {daily?.closed_today?.length || 0}</p>
            <h3 style={{ marginTop: 12, fontSize: 13 }}>Risks (24h)</h3>
            <ul style={{ paddingLeft: 16, fontSize: 13 }}>
              {(daily?.risks_last_24h || []).map((risk) => (
                <li key={risk.task_id}>{risk.task_id}: {risk.risk_item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "Weekly" && (
        <div className="report-grid">
          <div className="report-card">
            <h2>Velocity</h2>
            {velocityChart ? <Bar data={velocityChart} /> : <p>No data</p>}
          </div>
          <div className="report-card">
            <h2>Task Summaries</h2>
            <div className="summary-list">
              {(weekly?.task_summaries || []).map((summary) => (
                <div className="summary-item" key={summary.line1.task_id}>
                  <div className="line1">
                    <strong>{summary.line1.task_id}</strong> — {summary.line1.title}
                    <span>{summary.line1.assigned_to}</span>
                  </div>
                  <div className="line2">
                    {summary.line2.weekly_update || "No update"} • {summary.line2.timeline_compliance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Monthly" && (
        <div className="report-grid">
          <div className="report-card">
            <h2>Cycle Time Trend</h2>
            {cycleTimeTrend ? <Line data={cycleTimeTrend} /> : <p>No data</p>}
          </div>
          <div className="report-card">
            <h2>Release Reliability</h2>
            <ul style={{ paddingLeft: 16, fontSize: 13 }}>
              {(monthly?.release_reliability || []).map((item) => (
                <li key={item.task_id}>{item.task_id}: {item.release_delta} days</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
